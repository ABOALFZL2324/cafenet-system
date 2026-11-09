import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Shift } from '../types';
import { loadDatabase, saveDatabase } from '../utils/storage';

interface AuthContextType {
  currentUser: User | null;
  currentShift: Shift | null;
  isLocked: boolean;
  loginWithPin: (userId: number, pin: string) => boolean;
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => boolean;
  startShift: () => void;
  endShift: (handoverNote?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    const db = loadDatabase();
    if (db.activeUserId) {
      const u = db.users.find((x) => x.id === db.activeUserId && x.is_active);
      if (u) setCurrentUser(u);
    }
    if (db.activeShiftId) {
      const s = db.shifts.find((x) => x.id === db.activeShiftId && x.status === 'active');
      if (s) setCurrentShift(s);
    }
  }, []);

  const loginWithPin = (userId: number, pin: string): boolean => {
    const db = loadDatabase();
    const user = db.users.find((u) => u.id === userId && u.is_active);
    if (!user || user.pin_code !== pin) {
      return false;
    }
    setCurrentUser(user);
    db.activeUserId = user.id;

    // بازیابی شیفت باز این کاربر در صورت وجود
    const existingActiveShift = db.shifts.find(
      (s) => s.user_id === user.id && s.status === 'active'
    );
    if (existingActiveShift) {
      setCurrentShift(existingActiveShift);
      db.activeShiftId = existingActiveShift.id;
    } else {
      setCurrentShift(null);
      db.activeShiftId = null;
    }

    saveDatabase(db);
    setIsLocked(false);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentShift(null);
    const db = loadDatabase();
    db.activeUserId = null;
    db.activeShiftId = null;
    saveDatabase(db);
  };

  const lockScreen = () => {
    setIsLocked(true);
  };

  const unlockScreen = (pin: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.pin_code === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const startShift = () => {
    if (!currentUser) return;
    const db = loadDatabase();

    const newShift: Shift = {
      id: Date.now(),
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      start_time: new Date().toISOString(),
      end_time: null,
      status: 'active',
    };

    db.shifts.unshift(newShift);
    db.activeShiftId = newShift.id;
    saveDatabase(db);
    setCurrentShift(newShift);
  };

  const endShift = (handoverNote?: string) => {
    if (!currentShift) return;
    const db = loadDatabase();
    const shiftIdx = db.shifts.findIndex((s) => s.id === currentShift.id);
    if (shiftIdx !== -1) {
      db.shifts[shiftIdx].end_time = new Date().toISOString();
      db.shifts[shiftIdx].status = 'closed';
      if (handoverNote) {
        db.shifts[shiftIdx].handover_note = handoverNote;
      }
    }
    db.activeShiftId = null;
    saveDatabase(db);
    setCurrentShift(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentShift,
        isLocked,
        loginWithPin,
        logout,
        lockScreen,
        unlockScreen,
        startShift,
        endShift,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
