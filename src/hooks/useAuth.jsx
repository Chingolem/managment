import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToastContext } from './useToast.jsx';
import { useLanguage } from './useLanguage.jsx';

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

// ─── Security Helpers ───

/** Sanitize string input: strip HTML tags and limit length */
function sanitize(str, maxLen = 128) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^\n>]*>/g, '')          // strip HTML tags
    .replace(/[<>"'&]/g, '')            // strip dangerous chars
    .trim()
    .slice(0, maxLen);
}

/** Simple hash for password storage (not crypto-grade, but better than plaintext) */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_editflow_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Validate parsed JSON from localStorage to prevent injection */
function safeParseJSON(raw, fallback) {
  if (typeof raw !== 'string') return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

/** Validate user object shape */
function isValidUser(u) {
  return u && typeof u.username === 'string' && typeof u.password === 'string';
}

// ─── Login Rate Limiter ───

const LOGIN_ATTEMPTS = {};
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60 * 1000; // 1 minute lockout

function isLockedOut(username) {
  const key = username.toLowerCase();
  const record = LOGIN_ATTEMPTS[key];
  if (!record) return false;
  if (record.count >= MAX_ATTEMPTS) {
    if (Date.now() - record.lastAttempt < LOCKOUT_MS) return true;
    // Lockout expired — reset
    delete LOGIN_ATTEMPTS[key];
    return false;
  }
  return false;
}

function recordFailedAttempt(username) {
  const key = username.toLowerCase();
  if (!LOGIN_ATTEMPTS[key]) LOGIN_ATTEMPTS[key] = { count: 0, lastAttempt: 0 };
  LOGIN_ATTEMPTS[key].count++;
  LOGIN_ATTEMPTS[key].lastAttempt = Date.now();
}

function resetAttempts(username) {
  delete LOGIN_ATTEMPTS[username.toLowerCase()];
}

// ─── Auth Provider ───

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Restore session on initial render (lazy initializer — no effect needed)
    try {
      const sessionUser = sessionStorage.getItem('editflow_current_user') || localStorage.getItem('editflow_remembered_user');
      if (sessionUser) {
        const parsed = safeParseJSON(sessionUser, null);
        if (parsed && typeof parsed.username === 'string') {
          return parsed;
        }
      }
    } catch {
      // localStorage may be unavailable; intentionally ignored.
    }
    return null;
  });
  const { success, error } = useToastContext();
  const { t } = useLanguage();

  useEffect(() => {
    // Seed default admin account
    const rawUsers = localStorage.getItem('editflow_users');
    let users = safeParseJSON(rawUsers, []);
    if (!Array.isArray(users)) users = [];

    const hasAdmin = users.some(u => u.username?.toLowerCase() === 'admin');
    if (!hasAdmin) {
      users.push({
        username: 'admin',
        password: 'admin', // will be hashed on first login
        discordId: '',
        role: 'video_editor',
        createdAt: Date.now(),
        hashed: false
      });
      localStorage.setItem('editflow_users', JSON.stringify(users));
    }
  }, []);

  const login = useCallback(async (username, password, rememberMe) => {
    const safeUsername = sanitize(username, 32);
    const safePassword = password; // don't alter password, just limit attempts

    if (isLockedOut(safeUsername)) {
      error('Too many failed attempts. Please wait 1 minute.');
      return false;
    }

    const rawUsers = localStorage.getItem('editflow_users');
    let users = safeParseJSON(rawUsers, []);
    if (!Array.isArray(users)) users = [];

    const matchedUser = users.find(u => {
      if (!isValidUser(u)) return false;
      return u.username.toLowerCase() === safeUsername.toLowerCase();
    });

    if (!matchedUser) {
      recordFailedAttempt(safeUsername);
      error(t('auth_login_error') || 'Invalid username or password.');
      return false;
    }

    // Check password — support both hashed and legacy plaintext
    let passwordMatch;
    if (matchedUser.hashed) {
      const inputHash = await hashPassword(safePassword);
      passwordMatch = inputHash === matchedUser.password;
    } else {
      const legacyMatch = matchedUser.password === safePassword;
      passwordMatch = legacyMatch;
      // Upgrade to hashed on successful legacy login
      if (legacyMatch) {
        const hashed = await hashPassword(safePassword);
        const updatedUsers = users.map(u =>
          u.username.toLowerCase() === safeUsername.toLowerCase()
            ? { ...u, password: hashed, hashed: true }
            : u
        );
        localStorage.setItem('editflow_users', JSON.stringify(updatedUsers));
      }
    }

    if (!passwordMatch) {
      recordFailedAttempt(safeUsername);
      error(t('auth_login_error') || 'Invalid username or password.');
      return false;
    }

    resetAttempts(safeUsername);
    const userPayload = { username: matchedUser.username, role: matchedUser.role || 'video_editor' };
    setUser(userPayload);
    sessionStorage.setItem('editflow_current_user', JSON.stringify(userPayload));
    localStorage.setItem('editflow_remembered_user', JSON.stringify(userPayload));
    success(t('auth_login_success') || 'Logged in successfully!');
    return true;
  }, [success, error, t]);

  const signup = useCallback(async (username, password, discordId) => {
    const safeUsername = sanitize(username, 32);
    const safeDiscordId = sanitize(discordId, 64);

    if (safeUsername.length < 3) {
      error(t('auth_username_short') || 'Username must be at least 3 characters.');
      return false;
    }
    if (password.length < 6) {
      error(t('auth_password_short') || 'Password must be at least 6 characters.');
      return false;
    }
    // Block obviously dangerous usernames
    if (/[<>"'&/\\]/.test(username)) {
      error('Username contains invalid characters.');
      return false;
    }

    const rawUsers = localStorage.getItem('editflow_users');
    let users = safeParseJSON(rawUsers, []);
    if (!Array.isArray(users)) users = [];

    const exists = users.some(u => u.username?.toLowerCase() === safeUsername.toLowerCase());
    if (exists) {
      error(t('auth_user_exists') || 'Username is already taken.');
      return false;
    }

    const hashedPwd = await hashPassword(password);
    const newUser = {
      username: safeUsername,
      password: hashedPwd,
      discordId: safeDiscordId,
      role: 'video_editor',
      createdAt: Date.now(),
      hashed: true
    };
    users.push(newUser);
    localStorage.setItem('editflow_users', JSON.stringify(users));
    success(t('auth_signup_success') || 'Account created! You can now log in.');
    return true;
  }, [success, error, t]);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('editflow_current_user');
    localStorage.removeItem('editflow_remembered_user');
    success(t('auth_logged_out') || 'Logged out successfully.');
  }, [success, t]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
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
