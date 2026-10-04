import React, { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Flame, X, Radio, BookOpen, Sparkles, RefreshCw, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { hapticFeedback } from '../utils/haptics';
import WidgetErrorBoundary from './WidgetErrorBoundary';

export default function ClassmatesHubModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();

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
    refetchInterval: false, // Turned off polling! MongoDB Change Streams handle it now.
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
            activeNowCount: updatedClassmates.filter((c) => c.isCurrentlyStudying).length,
            onlineCount: updatedClassmates.filter((c) => c.isOnline).length,
          };
        });
      } catch (err) {}
    };

    return () => {
      eventSource.close();
    };
  }, [isOpen, queryClient]);

  const classmates = data?.classmates || [];
  const activeNowCount = data?.activeNowCount || 0;
  const onlineCount = data?.onlineCount || 0;

  const handleClose = () => {
    hapticFeedback.tap();
    onClose?.();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Apple Glassmorphic Spatial Backdrop */}
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

              {/* Game Center-style Floating Modal Window */}
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

                  {/* Header */}
                  <div className="p-6 border-b border-border flex items-center justify-between shrink-0 bg-background-elevated/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-success text-white flex items-center justify-center shadow-sm">
                        <Users className="w-5 h-5" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Dialog.Title className="text-lg font-bold text-label tracking-tight">
                            Classmates Hub
                          </Dialog.Title>
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
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
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
                            No cohort classmates active yet. Invite friends or join a teacher class
                            to study together!
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
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    {/* Avatar with Game Center Status Ring */}
                                    <div className="relative shrink-0">
                                      <div
                                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm select-none ${
                                          peer.isCurrentUser
                                            ? 'bg-accent text-white shadow-sm'
                                            : isStudying
                                              ? 'bg-success text-white shadow-sm'
                                              : 'bg-black/5 dark:bg-white/10 text-label'
                                        }`}
                                      >
                                        {(peer.name?.[0] || 'A').toUpperCase()}
                                      </div>

                                      {/* Presence Dot: Pulsing Dot when Studying */}
                                      {isStudying ? (
                                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success/75 opacity-75" />
                                          <span className="relative inline-flex rounded-full h-4 w-4 bg-success border-2 border-white dark:border-[#1C1C1E] shadow-sm" />
                                        </span>
                                      ) : (
                                        <span
                                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#1C1C1E] ${
                                            isOnline
                                              ? 'bg-success'
                                              : 'bg-neutral-400 dark:bg-neutral-600'
                                          }`}
                                        />
                                      )}
                                    </div>

                                    {/* Name & Progress */}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs tracking-wide font-bold text-label truncate block">
                                          {peer.name}
                                        </span>
                                        {!isOnline && (
                                          <span className="text-[10px] text-label-secondary font-medium">
                                            • Offline
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[10px] text-label-secondary block truncate mt-0.5">
                                        {peer.completionPercentage}% syllabus mastered
                                      </span>
                                    </div>
                                  </div>

                                  {/* Streak Badge */}
                                  <div className="flex items-center gap-1 bg-accent/10 text-accent px-2.5 py-1 rounded-full text-xs tracking-wide font-bold shrink-0 border border-accent/20">
                                    <Flame className="w-3.5 h-3.5 fill-current" />
                                    <span>{peer.currentStreak}d</span>
                                  </div>
                                </div>

                                {/* Active Focus Topic Card */}
                                {isStudying && (
                                  <div className="mt-3 pt-2.5 border-t border-success/15 flex items-center gap-2 text-[11px] text-success font-medium">
                                    <Radio className="w-3.5 h-3.5 shrink-0 text-success animate-pulse" />
                                    <span className="truncate">
                                      Focusing on:{' '}
                                      <strong className="font-semibold">
                                        {peer.currentFocusTopic || 'Deep Work'}
                                      </strong>
                                    </span>
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
                </motion.div>
              </Dialog.Content>
            </>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}


