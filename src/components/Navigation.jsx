import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Timer, Settings, School } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hapticFeedback } from '../utils/haptics';

export default function Navigation() {
  const { isTeacher } = useAuth();

  const navItems = [
    { to: '/', label: 'Today', icon: LayoutDashboard },
    ...(isTeacher ? [{ to: '/teacher', label: 'Cohort', icon: School }] : []),
    { to: '/syllabus', label: 'Syllabus', icon: BookOpen },
    { to: '/timer', label: 'Focus Timer', icon: Timer },
    ...(!isTeacher ? [{ to: '/setup', label: 'Setup', icon: Settings }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="bg-background-elevated/95 backdrop-blur-2xl border-[0.5px] border-border rounded-full px-2 py-1.5 shadow-sm flex items-center justify-around transition-colors duration-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => hapticFeedback.tap()}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-h-[44px] min-w-[56px] py-1 px-2.5 rounded-full transition-all duration-200 relative ${
                    isActive
                      ? 'text-accent font-bold scale-105'
                      : 'text-label-secondary hover:text-label font-medium active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 mb-0.5 transition-transform duration-200 ${
                        isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,107,107,0.4)]' : ''
                      }`}
                    />
                    <span className="text-[10px] tracking-tight">{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-1 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_6px_#FF6B6B]"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
