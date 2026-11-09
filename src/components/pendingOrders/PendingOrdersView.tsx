import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatToman, parseTomanInput } from '../../utils/currency';
import { formatJalaliDateTime } from '../../utils/jalali';
import { OrderStatus, PendingOrder } from '../../types';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Phone,
  FileText,
} from 'lucide-react';

export const PendingOrdersView: React.FC = () => {
  const { currentUser } = useAuth();
  const { pendingOrders, addPendingOrder, updateOrderStatus, deletePendingOrder } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // استیت فرم ثبت
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [estimatedAmountStr, setEstimatedAmountStr] = useState('');
  const [prepaymentStr, setPrepaymentStr] = useState('');
  const [dueDate, setDueDate] = useState('');

  const filteredOrders = pendingOrders.filter((order) => {
    const matchStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchQuery =
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      order.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchQuery;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    addPendingOrder({
      created_by_user_id: currentUser.id,
      created_by_name: currentUser.full_name,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      title: title.trim(),
      details: details.trim() || undefined,
      estimated_amount: parseTomanInput(estimatedAmountStr),
      prepayment_amount: parseTomanInput(prepaymentStr),
      status: 'pending',
      due_date: dueDate || undefined,
    });

    // ریست فرم
    setCustomerName('');
    setCustomerPhone('');
    setTitle('');
    setDetails('');
    setEstimatedAmountStr('');
    setPrepaymentStr('');
    setDueDate('');
    setIsAddModalOpen(false);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">در انتظار شروع / مدارک</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">در حال انجام</span>;
      case 'ready':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">آماده تحویل</span>;
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">تحویل داده شده و تسویه</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* هدر بخش */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            دفتر سفارشات معلق و کارهای در دست اقدام (میز کار شیفت‌ها)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ثبت سفارش‌های زمان‌دار جهت تحویل شفاف و بدون فراموشی بین متصدیان شیفت‌ها
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          ثبت سفارش معلق جدید
        </button>
      </div>

      {/* فیلترها و جستجو */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی نام مشتری، تلفن یا شرح کار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'همه سفارشات' },
            { id: 'pending', label: 'در انتظار مدارک' },
            { id: 'in_progress', label: 'در حال انجام' },
            { id: 'ready', label: 'آماده تحویل' },
            { id: 'delivered', label: 'تحویل داده شده' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filterStatus === tab.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* کارت‌های سفارشات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700">
            هیچ سفارشی در این وضعیت یافت نشد.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const remaining = Math.max(0, order.estimated_amount - order.prepayment_amount);
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 p-4 shadow-sm flex flex-col justify-between hover:border-amber-400 transition-all text-right"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(order.status)}
                    <span className="text-[10px] text-slate-400">
                      ثبت: {formatJalaliDateTime(order.created_at)}
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 mb-1">
                    {order.title}
                  </h3>

                  <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mb-2">
                    <span className="font-semibold">{order.customer_name}</span>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500 flex items-center gap-1" dir="ltr">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {order.customer_phone}
                    </span>
                  </div>

                  {order.details && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-750 text-[11px] text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      {order.details}
                    </div>
                  )}

                  {/* حساب و کتاب بیعانه */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-750 text-xs space-y-1 mb-3">
                    <div className="flex justify-between text-slate-500">
                      <span>مبلغ کل برآورد:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {formatToman(order.estimated_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>بیعانه دریافتی:</span>
                      <span className="font-bold">{formatToman(order.prepayment_amount)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-bold pt-1 border-t border-slate-200 dark:border-zinc-800">
                      <span>مانده قابل دریافت:</span>
                      <span>{formatToman(remaining)}</span>
                    </div>
                  </div>
                </div>

                {/* تغییر وضعیت سریع و عملیات */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    ثبت‌کننده: {order.created_by_name || 'متصدی'}
                  </div>

                  <div className="flex items-center gap-1">
                    {order.status !== 'delivered' && (
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="h-8 px-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-[11px] font-semibold"
                      >
                        <option value="pending">در انتظار شروع</option>
                        <option value="in_progress">در حال انجام</option>
                        <option value="ready">آماده تحویل</option>
                        <option value="delivered">تحویل و تسویه شد</option>
                      </select>
                    )}
                    <button
                      onClick={() => deletePendingOrder(order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="حذف سفارش"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* مودال ثبت سفارش جدید */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-750 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              ثبت کار در دست اقدام جدید (برای پیگیری در شیفت‌ها)
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی مشتری:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثلا: آقای مرادی"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس همراه:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  شرح کار / سفارش مورد نیاز:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلا: ثبت نام اینترنتی ایران‌خودرو / اسکن مدارک دانشگاهی"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  جزئیات، محل مدارک یا توضیحات شیفت بعدی:
                </label>
                <textarea
                  rows={3}
                  placeholder="مثلا: کپی کارت ملی در پوشه زردرنگ کشوی ۱ قرار دارد، فردا ساعت ۱۰ سایت باز می‌شود..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    مبلغ کل برآورد شده (تومان):
                  </label>
                  <input
                    type="text"
                    placeholder="مثلا: ۱۰۰,۰۰۰"
                    value={estimatedAmountStr}
                    onChange={(e) => setEstimatedAmountStr(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    بیعانه نقدی/کارتخوان پرداخت شده:
                  </label>
                  <input
                    type="text"
                    placeholder="مثلا: ۳۰,۰۰۰"
                    value={prepaymentStr}
                    onChange={(e) => setPrepaymentStr(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left font-bold text-emerald-600"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold"
                >
                  ثبت قطعی در کارتابل
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-medium"
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
