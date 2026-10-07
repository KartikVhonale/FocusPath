import React, { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import { Award, Flame, Target, BookOpen, Clock, X } from 'lucide-react';
import { useDashboard } from '../hooks/useStudyPlan';
import { hapticFeedback } from '../utils/haptics';

/**
 * Milestones View (Progressive Disclosure)
 * 5 flat, geometric SVG badges with HIG styling.
 * Snaps to 50% and 100% of screen height with prominent gray drag handle.
 */
export default function MilestonesSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useDashboard();
  const dashboardData = data?.dashboard || {};
  
  const streak = dashboardData.streak || 0;
  const hours = dashboardData.todayTotalTime ? dashboardData.todayTotalTime / 60 : 0;

  useEffect(() => {
    const handleOpen = () => {
      hapticFeedback.tap();
      setIsOpen(true);
    };
    window.addEventListener('open-milestones', handleOpen);
    return () => window.removeEventListener('open-milestones', handleOpen);
  }, []);

  const milestones = [
    {
      id: 'streak-10',
      title: '10-Day Streak',
      desc: 'Consistent focus for 10 consecutive days.',
      icon: Flame,
      unlocked: streak >= 10,
    },
    {
      id: 'streak-30',
      title: '30-Day Streak',
      desc: 'A full month of relentless consistency.',
      icon: Flame,
      unlocked: streak >= 30,
    },
    {
      id: 'hours-100',
      title: '100 Hours Focused',
      desc: 'Logged 100 hours of deep work.',
      icon: Clock,
      unlocked: hours >= 100,
    },
    {
      id: 'syllabus-half',
      title: 'Syllabus Halfway',
      desc: 'Completed 50% of the entire exam syllabus.',
      icon: BookOpen,
      unlocked: dashboardData.totalTopics > 0 && dashboardData.todayCompletedTopics >= (dashboardData.totalTopics / 2),
    },
    {
      id: 'perfect-week',
      title: 'Perfect Week',
      desc: 'Hit all daily targets for 7 days straight.',
      icon: Target,
      unlocked: streak >= 7,
    },
  ];

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
                <Drawer.Title className="font-bold text-xl text-label tracking-tight">
                  Milestones
                </Drawer.Title>
                <Drawer.Description className="text-xs tracking-wide text-label-secondary mt-1">
                  Your Apple HIG flat-design achievement badges.
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

          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {milestones.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-[0.5px] transition-all duration-300 ${
                      m.unlocked
                        ? 'bg-accent/5 border-accent/20'
                        : 'bg-background border-border opacity-70'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                        m.unlocked
                          ? 'bg-accent text-white'
                          : 'bg-background-elevated border-[0.5px] border-border text-label-tertiary'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`text-sm font-bold tracking-tight ${
                          m.unlocked ? 'text-accent' : 'text-label'
                        }`}
                      >
                        {m.title}
                      </h4>
                      <p className="text-xs tracking-wide text-label-secondary mt-0.5 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
