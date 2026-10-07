import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Drawer } from 'vaul';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Flame, X, Radio, BookOpen, Sparkles, RefreshCw, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { hapticFeedback } from '../utils/haptics';
import WidgetErrorBoundary from './WidgetErrorBoundary';
import { useIsMobile } from '../hooks/useMediaQuery';

export default function ClassmatesHubModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Scroll-lock body while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['cohortClassmates'],
    queryFn: async () => {
      const res = await api.client.get('/cohort/classmates');
      return res.data;
    },
    enabled: isOpen,
    refetchInterval: false,
    staleTime: Infinity,
  });

  // Zero-Backend Real-Time Presence: MongoDB Change Streams via SSE
  useEffect(() => {
    if (!isOpen) return;

    const eventSource = new EventSource('/api/sessions/stream');

    eventSource.onmessage = (event) => {
      try {
        const change = JSON.parse(event.data);

        queryClient.setQueryData(['cohortClassmates'], (oldData) => {
          if (!oldData || !oldData.classmates) return oldData;

          const updatedClassmates = oldData.classmates.map((peer) => {
            if (peer._id === change.userId || peer._id === change._id) {
              return {
                ...peer,
                isCurrentlyStudying: change.status === 'focusing',
                isOnline: change.status === 'focusing',
                currentFocusTopic:
                  change.status === 'focusing' ? change.topic || 'Deep Work Session' : '',
              };
            }
            return peer;
          });

          return {
            ...oldData,
            classmates: updatedClassmates,
          };
        });
      } catch (err) {
        console.error('SSE JSON parse error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isOpen, queryClient]);

  const classmates = data?.classmates || [];
  const activeNowCount = classmates.filter((c) => c.isCurrentlyStudying).length;
  const onlineCount = classmates.filter((c) => c.isOnline).length;

  const handleClose = () => {
    hapticFeedback.tap();
    onClose?.();
  };

  const innerModalContent = (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-border flex items-center justify-between shrink-0 bg-background-elevated/50 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-success text-white flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-label tracking-tight">
                Classmates Hub
              </h3>
              {activeNowCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/15 text-success border border-success/25 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span>{activeNowCount} Focus Active</span>
                </span>
              )}
            </div>
            <p className="text-xs tracking-wide text-label-secondary mt-0.5">
              Silent peer accountability • {onlineCount} online now
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              hapticFeedback.tap();
              refetch();
            }}
            disabled={isFetching}
            className="p-2 rounded-2xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Refresh Presence"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-2xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content / Grid */}
      <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
        <WidgetErrorBoundary title="Classmates Presence">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-label-secondary">
              <div className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs tracking-wide font-medium text-label-secondary">
                Connecting to classroom radar...
              </span>
            </div>
          ) : classmates.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 text-label-secondary flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-xs tracking-wide font-semibold text-label-secondary max-w-sm mx-auto">
                No cohort classmates active yet. Invite friends or join a teacher class to study together!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {classmates.map((peer) => {
                const isStudying = peer.isCurrentlyStudying;
                const isOnline = peer.isOnline;

                return (
                  <div
                    key={peer.id}
                    className={`p-4 rounded-2xl transition-all border ${
                      peer.isCurrentUser
                        ? 'bg-accent/5 border-accent/30 ring-1 ring-accent/20'
                        : isStudying
                          ? 'bg-success/5 border-success/25 shadow-sm'
                          : 'bg-background-elevated border-[0.5px] border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative">
                          <div className="w-9 h-9 rounded-full bg-accent/15 text-accent font-black text-xs tracking-wide flex items-center justify-center uppercase select-none">
                            {peer.name?.[0] || 'U'}
                          </div>
                          {isStudying && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success ring-2 ring-background flex items-center justify-center">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs tracking-wide font-bold text-label truncate">
                              {peer.name}
                            </span>
                            {peer.isCurrentUser && (
                              <span className="text-[10px] bg-accent/15 text-accent font-bold px-1.5 py-0.2 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-label-secondary truncate block">
                            {isStudying
                              ? 'Studying now'
                              : isOnline
                                ? 'Active'
                                : 'Offline'}
                          </span>
                        </div>
                      </div>

                      {peer.streak > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                          <Flame className="w-3 h-3 fill-current" />
                          <span>{peer.streak}d</span>
                        </div>
                      )}
                    </div>

                    {isStudying && peer.currentFocusTopic && (
                      <div className="mt-2 text-xs tracking-wide bg-background/60 p-2 rounded-xl flex items-center gap-2 border-[0.5px] border-border text-label truncate">
                        <Radio className="w-3 h-3 text-success shrink-0 animate-pulse" />
                        <span className="truncate">{peer.currentFocusTopic}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </WidgetErrorBoundary>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between text-[11px] text-label-secondary bg-background-elevated/40 shrink-0">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Heartbeat auto-syncs every 5 minutes</span>
        </span>
        <button
          type="button"
          onClick={handleClose}
          className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-label font-semibold cursor-pointer transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );

  // Mobile Bottom Sheet via vaul with snapPoints={[0.5, 1]}
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={(open) => !open && handleClose()} snapPoints={[0.5, 1]}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-[32px] bg-background-elevated/95 backdrop-blur-2xl border-t border-[0.5px] border-border h-full max-h-[100vh] outline-none pb-[calc(1.5rem+env(safe-area-inset-bottom))] overflow-hidden shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
            {/* Prominent gray pill-shaped drag handle at top */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto my-3 shrink-0" />
            <div className="flex-1 overflow-hidden">{innerModalContent}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop Centered Modal
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                  onClick={handleClose}
                  className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-opacity duration-300 ease-out"
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[85vh] flex flex-col bg-background-elevated/95 backdrop-blur-3xl border-[0.5px] border-border rounded-3xl shadow-sm overflow-hidden p-0"
                >
                  <Dialog.Description className="sr-only">
                    Classmates real-time study hub and presence
                  </Dialog.Description>
                  {innerModalContent}
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
