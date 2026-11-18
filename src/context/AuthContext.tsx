import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Shift, ShiftWorker } from '../types';
import { loadDatabase, saveDatabase } from '../utils/storage';
import { checkLoginAttempts, recordFailedAttempt, resetFailedAttempts } from '../utils/security';

interface AuthContextType {
  currentUser: User | null;
  currentShift: Shift | null;
  isLocked: boolean;
  loginWithPin: (userId: number, pin: string) => { success: boolean; message?: string };
  logout: () => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => { success: boolean; message?: string };
  startShift: (additionalWorkerIds?: number[]) => void;
  updateShiftWorkers: (workers: ShiftWorker[]) => void;
  endShift: (handoverNote?: string, workersHours?: { user_id: number; hours: number }[]) => void;
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

  const loginWithPin = (userId: number, pin: string): { success: boolean; message?: string } => {
    const identifier = `user_${userId}`;
    const attemptCheck = checkLoginAttempts(identifier);

    if (!attemptCheck.allowed) {
      return {
        success: false,
        message: `تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ${attemptCheck.waitSeconds} ثانیه صبر کنید.`,
      };
    }

    const db = loadDatabase();
    const user = db.users.find((u) => u.id === userId && u.is_active);

    if (!user || user.pin_code !== pin) {
      const failResult = recordFailedAttempt(identifier);
      if (failResult.locked) {
        return {
          success: false,
          message: `حساب به دلیل ۴ تلاش ناموفق به مدت ${failResult.waitSeconds} ثانیه موقتاً مسدود شد.`,
        };
      }
      return { success: false, message: 'پین‌کد وارد شده نادرست است.' };
    }

    // ورود موفق -> بازنشانی خطاهای تلاش
    resetFailedAttempts(identifier);
    setCurrentUser(user);
    db.activeUserId = user.id;

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
    return { success: true };
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

  const unlockScreen = (pin: string): { success: boolean; message?: string } => {
    if (!currentUser) return { success: false, message: 'کاربری وارد نشده است.' };

    const identifier = `lock_${currentUser.id}`;
    const attemptCheck = checkLoginAttempts(identifier);

    if (!attemptCheck.allowed) {
      return {
        success: false,
        message: `به دلیل تلاش‌های ناموفق مکرر، صفحه برای ${attemptCheck.waitSeconds} ثانیه قفل شد.`,
      };
    }

    if (currentUser.pin_code === pin) {
      resetFailedAttempts(identifier);
      setIsLocked(false);
      return { success: true };
    }

    const failResult = recordFailedAttempt(identifier);
    if (failResult.locked) {
      return {
        success: false,
        message: `صفحه به دلیل حدس اشتباه برای ${failResult.waitSeconds} ثانیه مسدود گردید.`,
      };
    }

    return { success: false, message: 'پین‌کد اشتباه است.' };
  };

  const startShift = (additionalWorkerIds?: number[]) => {
    if (!currentUser) return;
    const db = loadDatabase();

    const workers: ShiftWorker[] = [
      { user_id: currentUser.id, user_name: currentUser.full_name },
    ];

    if (additionalWorkerIds && additionalWorkerIds.length > 0) {
      additionalWorkerIds.forEach((wId) => {
        if (wId !== currentUser.id) {
          const userObj = db.users.find((u) => u.id === wId);
          if (userObj) {
            workers.push({ user_id: userObj.id, user_name: userObj.full_name });
          }
        }
      });
    }

    const newShift: Shift = {
      id: Date.now(),
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      workers,
      start_time: new Date().toISOString(),
      end_time: null,
      status: 'active',
    };

    db.shifts.unshift(newShift);
    db.activeShiftId = newShift.id;
    saveDatabase(db);
    setCurrentShift(newShift);
  };

  const updateShiftWorkers = (workers: ShiftWorker[]) => {
    if (!currentShift) return;
    const db = loadDatabase();
    const shiftIdx = db.shifts.findIndex((s) => s.id === currentShift.id);
    if (shiftIdx !== -1) {
      db.shifts[shiftIdx].workers = workers;
      saveDatabase(db);
      setCurrentShift({ ...db.shifts[shiftIdx] });
    }
  };

  const endShift = (handoverNote?: string, workersHours?: { user_id: number; hours: number }[]) => {
    if (!currentShift) return;
    const db = loadDatabase();
    const shiftIdx = db.shifts.findIndex((s) => s.id === currentShift.id);
    if (shiftIdx !== -1) {
      const endTime = new Date().toISOString();
      db.shifts[shiftIdx].end_time = endTime;
      db.shifts[shiftIdx].status = 'closed';
      if (handoverNote) {
        db.shifts[shiftIdx].handover_note = handoverNote;
      }

      // محاسبه طول شیفت بر اساس ساعت
      const startTimeMs = new Date(db.shifts[shiftIdx].start_time).getTime();
      const endTimeMs = new Date(endTime).getTime();
      const shiftDurationHours = Math.max(0.01, Number(((endTimeMs - startTimeMs) / (1000 * 3600)).toFixed(2)));

      // ثبت و تثبیت ساعت کاری هر یک از کارگران و حاضرین در این شیفت
      let finalWorkers: ShiftWorker[] = db.shifts[shiftIdx].workers || [
        { user_id: db.shifts[shiftIdx].user_id, user_name: db.shifts[shiftIdx].user_name || '' },
      ];

      finalWorkers = finalWorkers.map((w) => {
        const customEntry = workersHours?.find((wh) => wh.user_id === w.user_id);
        const resolvedHours = customEntry !== undefined ? customEntry.hours : (w.hours ?? shiftDurationHours);
        return {
          ...w,
          hours: resolvedHours,
        };
      });

      // اگر کاربرانی در workersHours اضافه شده‌اند که در لیست اولیه نبودند
      if (workersHours) {
        workersHours.forEach((wh) => {
          if (!finalWorkers.some((w) => w.user_id === wh.user_id)) {
            const userObj = db.users.find((u) => u.id === wh.user_id);
            finalWorkers.push({
              user_id: wh.user_id,
              user_name: userObj ? userObj.full_name : `کاربر ${wh.user_id}`,
              hours: wh.hours,
            });
          }
        });
      }

      db.shifts[shiftIdx].workers = finalWorkers;
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
        updateShiftWorkers,
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
