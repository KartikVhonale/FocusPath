import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../utils/queryKeys';
import { useAuth } from '../context/AuthContext';
import { Target, Compass, Users, Layers, Plus, Settings } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';
import api from '../services/api';

export default function MobileBottomNav({ onOpenQuickLog, onOpenSpotlight }) {
  const { isTeacher } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handlePrefetchItem = (to) => {
    if (to === '/path') {
      queryClient.prefetchQuery({
        queryKey: queryKeys.timeline(30),
        queryFn: () => api.getTimelineHistory(30),
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: queryKeys.trends(),
        queryFn: api.getTrendsReport,
        staleTime: 5 * 60 * 1000,
      });
      queryClient.prefetchQuery({
        queryKey: queryKeys.distribution(),
        queryFn: api.getSubjectDistribution,
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  const studentNavItems = [
    { to: '/', label: 'Focus', icon: Target },
    { to: '/path', label: 'Path', icon: Compass },
  ];

  const teacherNavItems = [
    { to: '/teacher', label: 'Roster', icon: Users },
    { to: '/master-plan', label: 'Master Plan', icon: Layers },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl border-t border-black/5 dark:border-white/10 z-40 flex items-center justify-around px-3 select-none">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.to;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onTouchStart={() => handlePrefetchItem(item.to)}
            onMouseEnter={() => handlePrefetchItem(item.to)}
            onClick={() => hapticFeedback.tap()}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-primary font-bold'
                : 'text-text-muted hover:text-text-main dark:hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        );
      })}

      {/* Quick Log / Spotlight action button on Mobile */}
      <button
        type="button"
        onClick={() => {
          hapticFeedback.tap();
          if (onOpenQuickLog) onOpenQuickLog();
          else if (onOpenSpotlight) onOpenSpotlight();
        }}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl text-secondary hover:text-secondary-hover cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-secondary/15 flex items-center justify-center">
          <Plus className="w-4 h-4 stroke-[3]" />
        </div>
        <span className="text-[10px] font-bold">Log</span>
      </button>

      {/* Settings link on Mobile */}
      <button
        type="button"
        onClick={() => {
          hapticFeedback.tap();
          navigate('/setup');
        }}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl text-text-muted hover:text-text-main cursor-pointer"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">Setup</span>
      </button>
    </nav>
  );
}

