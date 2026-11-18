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
  Copy,
  Check,
} from 'lucide-react';

export const PendingOrdersView: React.FC = () => {
  const { currentUser } = useAuth();
  const { pendingOrders, addPendingOrder, updateOrderStatus, deletePendingOrder } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  const handleCopyPhone = (order: PendingOrder) => {
    navigator.clipboard.writeText(order.customer_phone);
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1 border border-amber-300/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            در انتظار مدارک / شروع
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center gap-1 border border-blue-300/40">
            <Clock className="w-3 h-3 text-blue-500" />
            در حال اقدام
          </span>
        );
      case 'ready':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 flex items-center gap-1 border border-purple-300/40">
            <CheckCircle2 className="w-3 h-3 text-purple-500" />
            آماده تحویل به مشتری
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300/40">
            ✓ تحویل و تسویه شد
          </span>
        );
    }
  };

  const getStatusStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'in_progress': return 2;
      case 'ready': return 3;
      case 'delivered': return 4;
    }
  };

  return (
    <div className="space-y-4 text-right max-w-7xl mx-auto">
      {/* هدر بخش */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 shadow-sm">
        <div>
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            میز کار سفارشات معلق و کارهای در دست اقدام (Handover)
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تحویل شفاف مدارک و وظایف بین شیفت‌های کافی‌نت تا هیچ کاری فراموش یا گم نشود
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          ثبت سفارش معلق جدید
        </button>
      </div>

      {/* فیلترها و جستجو */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی نام مشتری، شماره تماس یا موضوع کار..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-medium"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'همه سفارشات' },
            { id: 'pending', label: 'در انتظار مدارک' },
            { id: 'in_progress', label: 'در حال اقدام' },
            { id: 'ready', label: 'آماده تحویل' },
            { id: 'delivered', label: 'تحویل داده شده' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                filterStatus === tab.id
                  ? 'bg-amber-500 text-white shadow-sm font-bold'
                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* کارت‌های سفارشات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full p-16 text-center text-slate-400 text-xs bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80">
            هیچ سفارشی در این وضعیت موجود نیست.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const remaining = Math.max(0, order.estimated_amount - order.prepayment_amount);
            const step = getStatusStepIndex(order.status);
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200/80 dark:border-zinc-700/80 p-4 shadow-sm flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all text-right group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    {getStatusBadge(order.status)}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatJalaliDateTime(order.created_at)}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 mb-1.5 leading-snug">
                    {order.title}
                  </h3>

                  {/* نوار کوچک پیشرفت وضعیت */}
                  <div className="w-full h-1 bg-slate-100 dark:bg-zinc-700 rounded-full my-2.5 overflow-hidden flex">
                    <div style={{ width: `${(step / 4) * 100}%` }} className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-300"></div>
                  </div>

                  {/* مشخصات مشتری با دکمه کپی شماره */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-zinc-850 p-2 rounded-xl border border-slate-100 dark:border-zinc-750 mb-2.5">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{order.customer_name}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyPhone(order)}
                      className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-mono"
                      title="کپی شماره تماس"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{order.customer_phone}</span>
                      {copiedId === order.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {order.details && (
                    <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-zinc-900 border border-amber-200/40 dark:border-zinc-750 text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                      {order.details}
                    </div>
                  )}

                  {/* حساب و کتاب بیعانه */}
                  <div className="bg-slate-50 dark:bg-zinc-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-750 text-xs space-y-1 mb-3">
                    <div className="flex justify-between text-slate-500">
                      <span>مبلغ کل برآورد:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {formatToman(order.estimated_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>بیعانه دریافتی:</span>
                      <span>{formatToman(order.prepayment_amount)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-black pt-1 border-t border-slate-200 dark:border-zinc-800">
                      <span>مانده قابل دریافت:</span>
                      <span>{formatToman(remaining)}</span>
                    </div>
                  </div>
                </div>

                {/* تغییر وضعیت سریع و عملیات */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-700 flex items-center justify-between">
                  <div className="text-[10px] text-slate-400">
                    ثبت: {order.created_by_name || 'متصدی'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.status !== 'delivered' && (
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className="h-8 px-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-[11px] font-bold"
                      >
                        <option value="pending">در انتظار شروع</option>
                        <option value="in_progress">در حال اقدام</option>
                        <option value="ready">آماده تحویل</option>
                        <option value="delivered">تحویل و تسویه شد</option>
                      </select>
                    )}
                    <button
                      onClick={() => deletePendingOrder(order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
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
                  className="px-4 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium transition-colors"
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
