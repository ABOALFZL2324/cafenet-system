import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatToman, parseTomanInput } from '../../utils/currency';
import { InvoiceItem, PaymentMethod } from '../../types';
import { matchesFuzzyPersian } from '../../utils/text';
import {
  Receipt,
  Plus,
  Minus,
  Trash2,
  Check,
  X,
  Search,
  Calculator,
  Sparkles,
  CreditCard,
  Banknote,
  User,
  Phone,
  Star,
  Zap,
} from 'lucide-react';

export interface InitialSaleData {
  customerName?: string;
  customerPhone?: string;
  orderTitle?: string;
  orderAmount?: number;
}

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintCalc?: () => void;
  onViewInvoice?: (invoiceId: number) => void;
  initialData?: InitialSaleData | null;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  onOpenPrintCalc,
  onViewInvoice,
  initialData,
}) => {
  const { currentUser, currentShift } = useAuth();
  const { services, serviceCategories, addInvoice } = useData();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pos');
  const [discountStr, setDiscountStr] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all' | 'favorites'>('favorites');
  const [error, setError] = useState('');

  // استیت فرم خدمت آزاد و دلخواه (خارج از نرخ‌نامه)
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customPriceStr, setCustomPriceStr] = useState('');
  const [customQty, setCustomQty] = useState(1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // بارگذاری داده‌های اولیه اگر از سفارش معلق آمده باشد
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCustomerName(initialData.customerName || '');
        setCustomerPhone(initialData.customerPhone || '');
        if (initialData.orderTitle && initialData.orderAmount) {
          const customItem: InvoiceItem = {
            id: Math.random().toString(36).substring(2, 9),
            service_id: 0,
            service_title: initialData.orderTitle,
            category_name: 'سفارش تسویه معلق',
            quantity: 1,
            unit_price: initialData.orderAmount,
            total_price: initialData.orderAmount,
          };
          setItems([customItem]);
        }
      }
      // فوکوس خودکار روی اینپوت جستجو جهت سرعت فوق‌العاده بالا
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialData]);

  // کلید میانبر کیبورد F2 برای ثبت نهایی فاکتور
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleSaveInvoice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items, paymentMethod, discountStr, customerName, customerPhone]);

  if (!isOpen || !currentUser) return null;

  // کلمات کلیدی خدمات پرکاربرد کافی‌نت
  const isFavoriteService = (s: typeof services[0]) => {
    const favKeywords = ['پرینت', 'کپی', 'ثبت‌نام', 'ثبت نام', 'اسکن', 'سخا', 'ثنا', 'بیمه', 'خلافی', 'فیش'];
    return favKeywords.some((k) => matchesFuzzyPersian(s.title, k)) || s.id <= 8;
  };

  // فیلتر خدمات با جستجوی هوشمند فازی فارسی و تفکیک پرکاربردها
  const filteredServices = services.filter((s) => {
    if (!s.is_active) return false;

    // فیلتر دسته
    if (selectedCategory === 'favorites') {
      if (!isFavoriteService(s) && !searchQuery) return false;
    } else if (selectedCategory !== 'all') {
      if (s.category_id !== selectedCategory) return false;
    }

    // فیلتر جستجو
    if (searchQuery.trim()) {
      return matchesFuzzyPersian(s.title, searchQuery);
    }

    return true;
  });

  // افزودن خدمت از نرخ‌نامه
  const handleAddService = (service: typeof services[0]) => {
    const existingIndex = items.findIndex((i) => i.service_id === service.id);
    if (existingIndex !== -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total_price = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setItems(updated);
    } else {
      const category = serviceCategories.find((c) => c.id === service.category_id);
      const newItem: InvoiceItem = {
        id: Math.random().toString(36).substring(2, 9),
        service_id: service.id,
        service_title: service.title,
        category_name: category?.name,
        quantity: 1,
        unit_price: service.unit_price,
        total_price: service.unit_price,
      };
      setItems([...items, newItem]);
    }
    setError('');
  };

  const handleIncreaseQty = (index: number) => {
    const updated = [...items];
    updated[index].quantity += 1;
    updated[index].total_price = updated[index].quantity * updated[index].unit_price;
    setItems(updated);
  };

  const handleDecreaseQty = (index: number) => {
    const updated = [...items];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
      updated[index].total_price = updated[index].quantity * updated[index].unit_price;
      setItems(updated);
    } else {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddCustomItem = () => {
    const price = parseTomanInput(customPriceStr);
    if (!customTitle.trim()) {
      setError('لطفاً عنوان خدمت دلخواه را وارد کنید.');
      return;
    }
    if (price <= 0) {
      setError('مبلغ خدمت باید بیشتر از صفر باشد.');
      return;
    }

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substring(2, 9),
      service_id: 0,
      service_title: customTitle.trim(),
      category_name: 'خدمت آزاد / متفرقه',
      quantity: customQty,
      unit_price: price,
      total_price: price * customQty,
    };

    setItems([...items, newItem]);
    setCustomTitle('');
    setCustomPriceStr('');
    setCustomQty(1);
    setShowCustomForm(false);
    setError('');
  };

  const subtotal = items.reduce((acc, i) => acc + i.total_price, 0);
  const discount = parseTomanInput(discountStr);
  const finalAmount = Math.max(0, subtotal - discount);

  const handleSaveInvoice = () => {
    if (items.length === 0) {
      setError('حداقل یک خدمت به فاکتور اضافه کنید.');
      return;
    }

    const created = addInvoice({
      shift_id: currentShift ? currentShift.id : 0,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      customer_name: customerName.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      items,
      subtotal,
      discount,
      final_amount: finalAmount,
      payment_method: paymentMethod,
    });

    setItems([]);
    setCustomerName('');
    setCustomerPhone('');
    setDiscountStr('0');
    setError('');
    onClose();

    if (onViewInvoice && created?.id) {
      onViewInvoice(created.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 no-print animate-fade-in">
      <div className="w-full max-w-5xl h-[88vh] bg-white dark:bg-[#1f1f23] rounded-3xl shadow-2xl border border-slate-200/90 dark:border-zinc-800 flex flex-col overflow-hidden text-right">
        {/* هدر */}
        <div className="h-14 px-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-slate-50/90 via-white to-slate-50/90 dark:from-zinc-900/60 dark:via-[#1f1f23] dark:to-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <span>ثبت فاکتور و صدور آنی</span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/40">
                  فروش مستقیم
                </span>
              </h2>
              <p className="text-[10px] text-slate-400 dark:text-zinc-400">
                متصدی: {currentUser.full_name} {currentShift ? '(شیفت فعال)' : '(بدون شیفت)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-500 dark:text-zinc-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* بدنه دو ستونه فاکتور */}
        <div className="flex-1 flex overflow-hidden">
          {/* سمت راست: کاتالوگ و خدمات */}
          <div className="w-7/12 border-l border-slate-100 dark:border-zinc-800 p-4 flex flex-col overflow-hidden">
            {/* نوار جستجو و ابزارها با فوکوس خودکار */}
            <div className="flex gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="جستجوی هوشمند (مثلاً: پرینت، سخا، ثبت نام، خلافی)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900/60 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {onOpenPrintCalc && (
                <button
                  type="button"
                  onClick={onOpenPrintCalc}
                  className="px-3 h-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/40 text-xs font-bold flex items-center gap-1.5 hover:bg-blue-100 transition-all shrink-0"
                >
                  <Calculator className="w-4 h-4" />
                  محاسبه پرینت
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="px-3 h-10 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/40 text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-all shrink-0"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                خدمت آزاد
              </button>
            </div>

            {/* فرم خدمت دلخواه (سفارشی) */}
            {showCustomForm && (
              <div className="p-3 mb-3 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-2xl shrink-0 space-y-2">
                <div className="text-xs font-black text-purple-900 dark:text-purple-200 flex items-center justify-between">
                  <span>تعریف خدمت آزاد دلخواه خارج از تعرفه:</span>
                  <button onClick={() => setShowCustomForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="شرح خدمت (مثلا: ثبت نام کنکور، تنظیم قرارداد...)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="col-span-6 h-9 px-3 rounded-xl border border-purple-200 bg-white dark:bg-zinc-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="مبلغ (تومان)"
                    value={customPriceStr}
                    onChange={(e) => setCustomPriceStr(e.target.value)}
                    className="col-span-3 h-9 px-2.5 rounded-xl border border-purple-200 bg-white dark:bg-zinc-900 text-xs text-left font-bold"
                    dir="ltr"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="تعداد"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="col-span-1 h-9 px-1 text-center rounded-xl border border-purple-200 bg-white dark:bg-zinc-900 text-xs font-black font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="col-span-2 h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all shadow-xs"
                  >
                    افزودن +
                  </button>
                </div>
              </div>
            )}

            {/* دسته‌بندی‌ها با تب ویژه پرکاربردها ⭐ */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('favorites')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-1 ${
                  selectedCategory === 'favorites'
                    ? 'bg-amber-500 text-white shadow-xs shadow-amber-500/30 ring-2 ring-amber-400/30'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/40'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                پرکاربرد و فوری
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                }`}
              >
                همه خدمات ({services.length})
              </button>

              {serviceCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* کارت‌های خدمات جهت انتخاب با یک کلیک */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 pr-1 mt-2">
              {filteredServices.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
                  خدمتی با این عبارت پیدا نشد. می‌توانید با زدن دکمه «خدمت آزاد» آن را فوری وارد کنید.
                </div>
              ) : (
                filteredServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => handleAddService(service)}
                    className="p-3 rounded-2xl border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-right transition-all flex flex-col justify-between group h-20 active:scale-95 bg-white dark:bg-zinc-850/60 shadow-2xs"
                  >
                    <div className="text-xs font-black text-slate-800 dark:text-zinc-100 line-clamp-2">
                      {service.title}
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-slate-100 dark:border-zinc-800">
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">
                        {formatToman(service.unit_price)}
                      </span>
                      <span className="w-5 h-5 rounded-lg bg-slate-100 dark:bg-zinc-750 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* سمت چپ: سبد فاکتور و اطلاعات مشتری */}
          <div className="w-5/12 p-4 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-[#1b1b1e]">
            {/* اطلاعات مشتری */}
            <div className="space-y-2 mb-3 shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="نام مشتری (اختیاری)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full h-8.5 pr-8 pl-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  />
                </div>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="شماره موبایل"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full h-8.5 pr-8 pl-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* لیست آیتم‌های اضافه شده به فاکتور */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500 text-xs p-6 text-center">
                  <Receipt className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
                  هیچ خدمتی انتخاب نشده است.
                  <span className="text-[11px] mt-1 text-slate-400">
                    از ستون سمت راست یا تب «پرکاربرد و فوری» انتخاب کنید.
                  </span>
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-2xl bg-white dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {item.service_title}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-zinc-400 mt-0.5">
                        واحد: {formatToman(item.unit_price)}
                      </div>
                    </div>

                    {/* کنترلر تعداد */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900/80 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleIncreaseQty(idx)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-white font-bold hover:bg-blue-50 transition-colors shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-black text-xs font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleDecreaseQty(idx)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-slate-700 dark:text-white font-bold hover:bg-rose-50 transition-colors shadow-2xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* جمع سطر */}
                    <div className="text-left font-black text-xs text-slate-800 dark:text-white font-mono shrink-0 w-20">
                      {formatToman(item.total_price)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* بخش خلاصه مالی و دکمه پرداخت */}
            <div className="bg-white dark:bg-zinc-800/90 rounded-2xl p-3 border border-slate-200/90 dark:border-zinc-700/90 shrink-0 space-y-2.5 shadow-xs">
              {/* انتخاب روش پرداخت */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pos')}
                  className={`py-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'pos'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  کارت‌خوان (POS)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-750'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  نقدی
                </button>
              </div>

              {/* تخفیف */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">تخفیف (تومان):</span>
                <input
                  type="text"
                  value={discountStr}
                  onChange={(e) => setDiscountStr(e.target.value)}
                  className="w-28 h-7 px-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-left font-black text-xs font-mono"
                  dir="ltr"
                />
              </div>

              {/* مبلغ نهایی */}
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200/80 dark:border-emerald-800/50 flex items-center justify-between">
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                  مبلغ نهایی دریافتی:
                </span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatToman(finalAmount)}
                </span>
              </div>

              {error && <div className="text-[11px] text-rose-500 font-bold text-center">{error}</div>}

              {/* دکمه ثبت فاکتور */}
              <button
                type="button"
                onClick={handleSaveInvoice}
                disabled={items.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>ثبت نهایی و صدور فاکتور</span>
                <span className="px-1.5 py-0.2 bg-white/20 rounded text-[10px] font-mono">F2</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
