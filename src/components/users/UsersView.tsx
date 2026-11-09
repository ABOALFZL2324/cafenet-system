import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { UserRole } from '../../types';
import { Users, UserPlus, Edit3, Check, X, Shield, ShieldCheck } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, addUser, updateUser } = useData();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [profitPercentage, setProfitPercentage] = useState<number>(30);

  // استیت ویرایش درصد سود
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editPercent, setEditPercent] = useState<number>(30);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !pinCode) return;

    addUser({
      full_name: fullName.trim(),
      username: username.trim(),
      pin_code: pinCode.trim(),
      role,
      profit_percentage: profitPercentage,
      is_active: true,
    });

    setFullName('');
    setUsername('');
    setPinCode('');
    setIsAddOpen(false);
  };

  const handleStartEdit = (user: typeof users[0]) => {
    setEditingUserId(user.id);
    setEditPercent(user.profit_percentage);
  };

  const handleSaveEdit = (userId: number) => {
    updateUser(userId, { profit_percentage: editPercent });
    setEditingUserId(null);
  };

  return (
    <div className="space-y-4 text-right">
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            مدیریت کاربران، اپراتورها و درصد سهم از سود
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تعریف نامحدود متصدیان، تعیین پین‌کد ورود و درصد مشارکت مالی در سود ماهانه
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          افزودن متصدی / اپراتور جدید
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-100 dark:border-zinc-700">
              <tr>
                <th className="p-3">ردیف</th>
                <th className="p-3">نام و نام خانوادگی</th>
                <th className="p-3">نام کاربری</th>
                <th className="p-3">نقش سیستمی</th>
                <th className="p-3">پین‌کد ورود</th>
                <th className="p-3 text-center">درصد سهم از سود ماهانه</th>
                <th className="p-3">وضعیت حساب</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {users.map((user, idx) => {
                const isEditing = editingUserId === user.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{user.full_name}</td>
                    <td className="p-3 text-slate-500">{user.username}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 font-semibold text-[11px]">
                        {user.role === 'admin' ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            مدیر کافی‌نت
                          </>
                        ) : (
                          <>
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            اپراتور / همکار
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">●●●●</td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editPercent}
                            onChange={(e) => setEditPercent(parseInt(e.target.value) || 0)}
                            className="w-16 h-7 px-2 border rounded text-xs text-center font-bold"
                          />
                          <span className="text-xs">٪</span>
                          <button
                            onClick={() => handleSaveEdit(user.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                          {user.profit_percentage}٪
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => updateUser(user.id, { is_active: !user.is_active })}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.is_active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                        }`}
                      >
                        {user.is_active ? 'فعال' : 'غیرفعال'}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(user)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="ویرایش درصد سهم"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال افزودن کاربر */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-750">
              افزودن متصدی / اپراتور جدید به سیستم
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلا: رضا احمدی"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام کاربری انگلیسی:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="reza"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    پین‌کد ورود عددی (۴ رقمی):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نقش کاربر:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
                  >
                    <option value="operator">اپراتور / همکار</option>
                    <option value="admin">مدیر کافی‌نت</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    درصد سهم از سود (%):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={profitPercentage}
                    onChange={(e) => setProfitPercentage(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  افزودن کاربر
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
