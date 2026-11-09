import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { User, UserRole } from '../../types';
import { Users, UserPlus, Edit3, Check, X, Shield, ShieldCheck } from 'lucide-react';

export const UsersView: React.FC = () => {
  const { users, addUser, updateUser } = useData();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // استیت فرم افزودن
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [role, setRole] = useState<UserRole>('operator');
  const [profitPercentage, setProfitPercentage] = useState<number>(30);

  // استیت فرم ویرایش
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPinCode, setEditPinCode] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('operator');
  const [editProfitPercentage, setEditProfitPercentage] = useState<number>(30);

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

  const handleStartEdit = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.full_name);
    setEditUsername(user.username);
    setEditPinCode(user.pin_code);
    setEditRole(user.role);
    setEditProfitPercentage(user.profit_percentage);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      full_name: editFullName.trim(),
      username: editUsername.trim(),
      pin_code: editPinCode.trim() || editingUser.pin_code,
      role: editRole,
      profit_percentage: editProfitPercentage,
    });

    setEditingUser(null);
  };

  return (
    <div className="space-y-4 text-right">
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            مدیریت کامل کاربران، اپراتورها و درصد سهم از سود
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تعریف، ویرایش کامل اطلاعات هویتی، تغییر پین‌کد ورود و درصد مشارکت مالی در سود
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          افزودن متصدی جدید
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
                <th className="p-3 text-center">پین‌کد ورود</th>
                <th className="p-3 text-center">درصد سهم از سود ماهانه</th>
                <th className="p-3">وضعیت حساب</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {users.map((user, idx) => (
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
                  <td className="p-3 font-mono text-center font-bold text-slate-600 dark:text-slate-300">
                    {user.pin_code}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                      {user.profit_percentage}٪
                    </span>
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
                    <button
                      onClick={() => handleStartEdit(user)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 mx-auto transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      ویرایش کامل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال ویرایش کامل اپراتور */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-750 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600" />
              ویرایش کامل اطلاعات متصدی ({editingUser.full_name})
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام و نام خانوادگی:
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
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
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left font-semibold"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    پین‌کد عددی ورود (۴ رقمی):
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نقش کاربری:
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
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
                    value={editProfitPercentage}
                    onChange={(e) => setEditProfitPercentage(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-center font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  ذخیره تغییرات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-medium"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال افزودن کاربر */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
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
                  placeholder="مثلا: علی حسینی"
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
                    placeholder="ali"
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
                    type="text"
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
