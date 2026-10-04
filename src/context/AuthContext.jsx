import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import storageService from '../services/storage';
import { useTimerStore } from '../store/useTimerStore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isLockedByTeacher, setIsLockedByTeacher] = useState(() => {
    try {
      return localStorage.getItem('isLockedByTeacher') === 'true';
    } catch {
      return false;
    }
  });

  const [loading, setLoading] = useState(true);

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    storageService.setAuthUser(updatedUser);
  };

  const updateLockedStatus = (locked) => {
    setIsLockedByTeacher(Boolean(locked));
    localStorage.setItem('isLockedByTeacher', String(Boolean(locked)));
  };

  // Validate or fetch current user on initial boot
  useEffect(() => {
    let isMounted = true;

    const verifyUser = async () => {
      const savedToken = await storageService.getAuthToken();
      if (savedToken) {
        try {
          const res = await api.getMe();
          if (isMounted && res.success && res.user) {
            setUser(res.user);
            await storageService.setAuthUser(res.user);
          }

          // Check study plan lock state on boot
          try {
            const dashRes = await api.getDashboard();
            if (isMounted && dashRes.success && dashRes.data) {
              const locked = Boolean(dashRes.data.isLockedByTeacher);
              setIsLockedByTeacher(locked);
              localStorage.setItem('isLockedByTeacher', String(locked));
            }
          } catch {
            // Non-blocking dashboard check
          }
        } catch (err) {
          console.warn('Session verification failed, resetting credentials:', err.message);
          if (isMounted) {
            logout();
          }
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    verifyUser();

    // Listen for 401 unauthorized events from api interceptor
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
      setIsLockedByTeacher(false);
      storageService.removeAuth();
      localStorage.removeItem('isLockedByTeacher');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  // 5-Minute Student Heartbeat API
  useEffect(() => {
    if (!token) return;

    const dispatchHeartbeat = async () => {
      try {
        const timer = useTimerStore.getState();
        await api.client.post('/user/heartbeat', {
          isStudying: Boolean(timer.isActive),
          activeTopicTitle: timer.activeTopic?.title || '',
        });
      } catch {
        // Silently ignore heartbeat network drops
      }
    };

    dispatchHeartbeat();
    const interval = setInterval(dispatchHeartbeat, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [token]);

  const login = async (email, password) => {
    try {
      const cleanEmail = email?.trim()?.toLowerCase();
      const res = await api.login(cleanEmail, password);

      if (res && res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        await storageService.setAuthToken(res.token);
        await storageService.setAuthUser(res.user);

        // Check lock status
        try {
          const dashRes = await api.getDashboard();
          if (dashRes.success && dashRes.data) {
            const locked = Boolean(dashRes.data.isLockedByTeacher);
            setIsLockedByTeacher(locked);
            localStorage.setItem('isLockedByTeacher', String(locked));
          }
        } catch {
          // Non-blocking
        }

        return { success: true, user: res.user };
      }
      return {
        success: false,
        message: res?.message || 'Login failed. Please verify your credentials.',
      };
    } catch (err) {
      console.error('Login error:', err);
      const message =
        err.response?.data?.message ||
        (err.response?.status === 429
          ? 'Too many login attempts. Please wait a few moments.'
          : err.message || 'Login failed. Please try again.');
      return { success: false, message };
    }
  };

  const register = async (
    username,
    email,
    password,
    accountMode = 'self_study',
    teacherCode = ''
  ) => {
    try {
      const cleanEmail = email?.trim()?.toLowerCase();
      const cleanName = username?.trim() || 'Aspirant';
      const res = await api.register(cleanName, cleanEmail, password, accountMode, teacherCode);

      if (res && res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        const locked = res.user.accountMode === 'managed';
        setIsLockedByTeacher(locked);
        await storageService.setAuthToken(res.token);
        await storageService.setAuthUser(res.user);
        localStorage.setItem('isLockedByTeacher', String(locked));
        return { success: true, user: res.user };
      }
      return {
        success: false,
        message: res?.message || 'Registration failed. Please try again.',
      };
    } catch (err) {
      console.error('Registration error:', err);
      const message =
        err.response?.data?.message ||
        (err.response?.status === 429
          ? 'Too many registration attempts. Please wait a few moments.'
          : err.message || 'Registration failed. Please try again.');
      return { success: false, message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLockedByTeacher(false);
    storageService.removeAuth();
    localStorage.removeItem('isLockedByTeacher');
    window.dispatchEvent(new Event('auth:unauthorized'));
  };

  const accountMode = user?.accountMode || 'self_study';
  const isManagedStudent = accountMode === 'managed';
  const isSelfStudy = accountMode === 'self_study';
  const isTeacher = accountMode === 'teacher';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        accountMode,
        isManagedStudent,
        isSelfStudy,
        isTeacher,
        isLockedByTeacher: Boolean(isLockedByTeacher || isManagedStudent),
        teacherCode: user?.teacherCode || '',
        assignedTeacherId: user?.assignedTeacherId || null,
        teacherName: user?.teacherName || '',
        cohortNotes: user?.cohortNotes || '',
        isAuthenticated: !!token,
        loading,
        login,
        register,
        logout,
        updateUser,
        updateLockedStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
