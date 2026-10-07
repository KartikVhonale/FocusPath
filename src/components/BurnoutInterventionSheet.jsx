import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { AlertCircle, CalendarRange, X } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

export default function BurnoutInterventionSheet({ burnoutRisk = false, onRelievePace }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (burnoutRisk) {
      // Small delay so it feels native
      const t = setTimeout(() => {
        hapticFeedback.heavy();
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [burnoutRisk]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen} snapPoints={[0.5, 1]}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-background-elevated flex flex-col rounded-t-[32px] fixed bottom-0 left-0 right-0 z-[101] outline-none shadow-[0_-8px_40px_rgba(0,0,0,0.12)] border-t-[0.5px] border-border overflow-hidden h-full max-h-[100vh]">
          {/* Prominent gray pill-shaped drag handle at top */}
          <div className="pt-3 pb-1 bg-background-elevated sticky top-0 z-10 flex flex-col items-center shrink-0">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3 shrink-0" />
            <div className="w-full px-6 flex items-center justify-between">
              <div>
                <Drawer.Title className="font-bold text-xl text-label tracking-tight flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  Dynamic Feedback Loop
                </Drawer.Title>
                <Drawer.Description className="text-xs tracking-wide text-label-secondary mt-1">
                  Autonomous Engine Intervention
                </Drawer.Description>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 text-label-secondary hover:text-label transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-6">
            <p className="text-base text-label font-medium leading-relaxed">
              You've been pushing hard, but falling slightly behind pace over the last 3 days. 
              Would you like to shift your target exam date back by 1 week to relieve the daily load?
            </p>

            <button
              onClick={() => {
                hapticFeedback.success();
                setIsOpen(false);
                onRelievePace?.();
              }}
              className="w-full h-14 bg-accent text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              <CalendarRange className="w-5 h-5" />
              Extend Global Schedule
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
