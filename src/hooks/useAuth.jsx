import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToastContext } from './useToast.jsx';
import { useLanguage } from './useLanguage.jsx';
import { supabase } from '../supabaseClient.js';

const AuthContext = createContext(null);

export const WORKSPACE_CONFIGS = {
  video_editor: {
    statusKeys: {
      not_started: 'status_not_started',
      started: 'status_started',
      paused: 'status_paused',
      finished: 'status_finished'
    },
    singularKey: 'item_video',
    pluralKey: 'item_videos',
    actionStartKey: 'action_start_timer',
    meta1Key: 'meta_source_material',
    meta2Key: 'meta_final_link',
    meta3Key: 'meta_deadline',
    meta4Key: 'meta_price'
  }
};

export const rolePrefixes = {
  video_editor: 'video'
};

export function getTimerKeys(role) {
  const prefix = rolePrefixes[role] || 'video';
  if (prefix === 'video') {
    return {
      status: 'status',
      totalSeconds: 'totalSeconds',
      lastStartTime: 'lastStartTime',
      lastStopTime: 'lastStopTime',
      idleGaps: 'idleGaps',
      finishedCount: 'finishedCount'
    };
  }
  return {
    status: `${prefix}Status`,
    totalSeconds: `${prefix}TotalSeconds`,
    lastStartTime: `${prefix}LastStartTime`,
    lastStopTime: `${prefix}LastStopTime`,
    idleGaps: `${prefix}IdleGaps`,
    finishedCount: `${prefix}FinishedCount`
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { success, error } = useToastContext();
  const { t } = useLanguage();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.email,
          role: session.user.user_metadata?.role || 'video_editor'
        });
      }
      setIsInitializing(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          username: session.user.email,
          role: session.user.user_metadata?.role || 'video_editor'
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email, password) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      error(signInError.message);
      return false;
    }
    success(t('auth_login_success') || 'Logged in successfully!');
    return true;
  }, [success, error, t]);

  const signup = useCallback(async (email, password) => {
    if (password.length < 6) {
      error(t('auth_password_short') || 'Password must be at least 6 characters.');
      return false;
    }
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'video_editor' }
      }
    });
    
    if (signUpError) {
      error(signUpError.message);
      return false;
    }
    
    success(t('auth_signup_success') || 'Account created! You are now logged in.');
    return true;
  }, [success, error, t]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    success(t('auth_logged_out') || 'Logged out successfully.');
  }, [success, t]);

  const loginWithDiscord = useCallback(async () => {
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (oauthError) {
      error(oauthError.message);
      return false;
    }
    return true;
  }, [error]);

  if (isInitializing) return null; // Or a loading spinner

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loginWithDiscord }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
