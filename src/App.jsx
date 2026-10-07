import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import AppSidebar from './components/AppSidebar';
import CanvasHeader from './components/CanvasHeader';
import BottomNav from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardSkeleton from './components/DashboardSkeleton';
import GlobalLoader from './components/GlobalLoader';
import QuickLogModal from './components/QuickLogModal';
import SpotlightCommandPalette from './components/SpotlightCommandPalette';
import ClassmatesHubModal from './components/ClassmatesHubModal';
import MilestonesSheet from './components/MilestonesSheet';
import FloatingTimer from './components/FloatingTimer';
import { useKeyPress } from './hooks/useKeyPress';
import { useIsMobile } from './hooks/useMediaQuery';
import { useTimerStore } from './store/useTimerStore';
import { queryKeys } from './utils/queryKeys';
import { checkFallbackNotifications } from './utils';
import api from './services/api';
import { useCircadianTheme } from './hooks/useCircadianTheme';

// Code Splitting (Lazy Loading) for maximum frontend performance
const Focus = lazy(() => import('./pages/Focus')); // "Focus" tab
const Path = lazy(() => import('./pages/Path')); // "Path" tab
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard')); // "Roster" tab
const TeacherMasterPlan = lazy(() => import('./pages/TeacherMasterPlan')); // "Master Plan" tab
const Setup = lazy(() => import('./pages/Setup'));
const Auth = lazy(() => import('./pages/Auth'));
const Register = lazy(() => import('./pages/Register'));
const SyllabusBuilder = lazy(() => import('./pages/SyllabusBuilder'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ToastContainer() {
  const { toastMessage } = useApp();
  if (!toastMessage) return null;

  const bgStyles =
    {
      success: 'bg-success text-white shadow-success/30',
      error: 'bg-[#FF3B30] text-white shadow-red-500/30',
      info: 'bg-accent text-white shadow-accent/30',
    }[toastMessage.type] || 'bg-background-elevated text-label border border-border';

  return (
    <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div
        className={`px-4 py-2 rounded-full border-[0.5px] border-border shadow-sm backdrop-blur-md text-xs tracking-wide font-semibold max-w-sm pointer-events-auto ${bgStyles}`}
      >
        {toastMessage.text}
      </div>
    </div>
  );
}

function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={<GlobalLoader />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public Auth Screens */}
          <Route
            path="/login"
            element={
              <PageWrapper>
                <Auth />
              </PageWrapper>
            }
          />
          <Route
            path="/register"
            element={
              <PageWrapper>
                <Register />
              </PageWrapper>
            }
          />

          {/* Student Tab 1: "Focus" Screen */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <Focus />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/focus"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <Focus />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Student Tab 2: "Path" Screen (Syllabus + Analytics Consolidation) */}
          <Route
            path="/path"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <Path />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Teacher Tab 1: "Roster" Screen */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <PageWrapper>
                  <TeacherDashboard />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Teacher Tab 2: "Master Plan" Screen */}
          <Route
            path="/master-plan"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <PageWrapper>
                  <TeacherMasterPlan />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route path="/teacher/master-plan" element={<Navigate to="/master-plan" replace />} />

          {/* Plan Setup / Onboarding */}
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <Setup />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Standalone Syllabus Builder Route (also available via Path modal) */}
          <Route
            path="/builder"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <SyllabusBuilder />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Fallback routes */}
          <Route path="/syllabus" element={<Navigate to="/path" replace />} />
          <Route path="/timer" element={<Navigate to="/" replace />} />
          <Route
            path="*"
            element={
              <PageWrapper>
                <NotFound />
              </PageWrapper>
            }
          />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}

function MainLayout() {
  const queryClient = useQueryClient();
  useCircadianTheme();

  // Midnight Rollover Invalidation
  useEffect(() => {
    let lastDate = new Date().getDate();
    const midnightCheck = setInterval(() => {
      const currentDate = new Date().getDate();
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        console.log('Midnight Rollover: Invalidating syllabus and dashboard caches...');
        queryClient.invalidateQueries({ queryKey: queryKeys.syllabus() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      }
    }, 60000); // Check every minute
    return () => clearInterval(midnightCheck);
  }, [queryClient]);

  useCircadianTheme();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isClassmatesOpen, setIsClassmatesOpen] = useState(false);
  const { isActive, isStrictPomodoro, isFullScreen, tick } = useTimerStore();
  const isImmersion = (isStrictPomodoro && isActive) || isFullScreen;

  // PART 4: RESPONSIVE GUARD HOOK (< 768px)
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Sync default state when crossing viewport breakpoints
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  // PWA Fallback Scheduler: Checks localforage every 60s for scheduled alerts on iOS/Firefox
  useEffect(() => {
    const fallbackInterval = setInterval(() => {
      checkFallbackNotifications();
    }, 60000);
    return () => clearInterval(fallbackInterval);
  }, []);

  // Global Floating Timer Interval: calls tick() every 1000ms when active
  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, tick]);

  // Global Keyboard Shortcuts
  // Cmd/Ctrl + K: Spotlight Command Palette
  useKeyPress('k', () => setIsSpotlightOpen((prev) => !prev), { ctrlOrCmd: true });

  // Cmd/Ctrl + B: Toggle macOS-style Sidebar
  useKeyPress('b', () => setIsSidebarOpen((prev) => !prev), { ctrlOrCmd: true });

  // Event listener for opening spotlight and classmates from any component
  useEffect(() => {
    const handleOpenSpotlight = () => setIsSpotlightOpen(true);
    const handleOpenClassmates = () => setIsClassmatesOpen(true);
    window.addEventListener('open-spotlight', handleOpenSpotlight);
    window.addEventListener('open-classmates', handleOpenClassmates);
    return () => {
      window.removeEventListener('open-spotlight', handleOpenSpotlight);
      window.removeEventListener('open-classmates', handleOpenClassmates);
    };
  }, []);

  return (
    /* PART 1: THE ROOT APP SHELL (Strict, full-screen, non-scrolling wrapper) */
    <div className="flex h-screen w-screen overflow-hidden bg-background text-label font-sans transition-colors duration-300">
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 3500,
          className:
            '!bg-background-elevated !text-label !rounded-2xl !border-[0.5px] !border-border !shadow-apple dark:!shadow-apple-dark !font-semibold !text-xs tracking-wide !py-3 !px-4',
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF3B30',
              secondary: '#FFFFFF',
            },
          },
        }}
      />

      {/* 1. DESKTOP PUSH SIDEBAR (Desktop Only, Zen-Faded when timer is active, Hidden in Immersion) */}
      {!isAuthPage && !isMobile && !isImmersion && (
        <div
          className={`transition-all duration-700 ease-out flex shrink-0 h-full ${
            isActive
              ? 'opacity-30 filter grayscale hover:opacity-100 hover:filter-none'
              : 'opacity-100 filter-none'
          }`}
        >
          <AppSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isMobile={false}
            onOpenSpotlight={() => setIsSpotlightOpen(true)}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onOpenClassmates={() => setIsClassmatesOpen(true)}
          />
        </div>
      )}

      {/* 2. MOBILE OVERLAY SLIDE-OVER DRAWER (< 768px, Hidden in Immersion) */}
      {!isAuthPage && isMobile && !isImmersion && (
        <AppSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isMobile={true}
          onOpenSpotlight={() => setIsSpotlightOpen(true)}
          onOpenQuickLog={() => setIsQuickLogOpen(true)}
          onOpenClassmates={() => setIsClassmatesOpen(true)}
        />
      )}

      {/* PART 3: THE MAIN CANVAS (The "Flex-1" Hero with macOS inset corner) */}
      <main
        id="main-scroll-container"
        className={`flex-1 h-full overflow-y-auto relative ${
          !isAuthPage
            ? 'bg-background rounded-tl-2xl border-l-[0.5px] border-border shadow-[-4px_0_24px_rgba(0,0,0,0.02)]'
            : 'bg-background'
        } flex flex-col custom-scrollbar`}
      >
        {/* PART 4: MAC-STYLE TOOLBAR HEADER WITH SIDEBAR TOGGLE (Hidden in Immersion, Zen-Faded during active timer) */}
        {!isAuthPage && !isImmersion && (
          <div
            className={`transition-all duration-700 ease-out ${
              isActive
                ? 'opacity-30 filter grayscale hover:opacity-100 hover:filter-none'
                : 'opacity-100 filter-none'
            }`}
          >
            <CanvasHeader
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              onOpenSpotlight={() => setIsSpotlightOpen(true)}
              onOpenQuickLog={() => setIsQuickLogOpen(true)}
              onOpenClassmates={() => setIsClassmatesOpen(true)}
            />
          </div>
        )}

        <ToastContainer />

        {/* Dynamic Canvas Content: fills remaining space without overlapping */}
        <div
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${
            !isAuthPage ? 'pb-24 md:pb-12' : ''
          }`}
        >
          <AnimatedRoutes />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (Screens < 768px, Hidden in Immersion, Zen-Faded during active timer) */}
      {!isAuthPage && isMobile && !isImmersion && (
        <div
          className={`transition-all duration-700 ease-out ${
            isActive
              ? 'opacity-40 filter grayscale hover:opacity-100 hover:filter-none'
              : 'opacity-100 filter-none'
          }`}
        >
          <BottomNav
            onOpenClassmates={() => setIsClassmatesOpen(true)}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
        </div>
      )}

      {/* Global Spotlight Command Palette (cmdk) */}
      <SpotlightCommandPalette
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
      />

      {/* Global Quick Log Progress Modal */}
      <QuickLogModal isOpen={isQuickLogOpen} onClose={() => setIsQuickLogOpen(false)} />

      {/* Global Classmates Hub Presence Modal */}
      <ClassmatesHubModal isOpen={isClassmatesOpen} onClose={() => setIsClassmatesOpen(false)} />

      <MilestonesSheet />
      {/* Global Floating Glassmorphic Timer */}
      <FloatingTimer />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const handleOnline = () => {
      api.syncOfflineQueue();
    };
    window.addEventListener('online', handleOnline);
    // Attempt sync on mount if already online
    if (navigator.onLine) {
      handleOnline();
    }
    return () => window.removeEventListener('online', handleOnline);
  }, []);
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <MainLayout />
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}







