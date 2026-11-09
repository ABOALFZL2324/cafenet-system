import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { formatToman, parseTomanInput } from '../../utils/currency';
import { InvoiceItem, PaymentMethod } from '../../types';
import { Receipt, Plus, Trash2, Check, X, Search, Calculator, Sparkles } from 'lucide-react';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPrintCalc: () => void;
  onViewInvoice: (invoiceId: number) => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  onOpenPrintCalc,
  onViewInvoice,
}) => {
  const { currentUser, currentShift } = useAuth();
  const { services, serviceCategories, addInvoice } = useData();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pos');
  const [discountStr, setDiscountStr] = useState('0');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [error, setError] = useState('');

  // استیت فرم خدمت آزاد و دلخواه (خارج از نرخ‌نامه)
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customPriceStr, setCustomPriceStr] = useState('');
  const [customQty, setCustomQty] = useState(1);

  if (!isOpen || !currentUser) return null;

  // فیلتر خدمات
  const filteredServices = services.filter((s) => {
    if (!s.is_active) return false;
    const matchCat = selectedCategory === 'all' || s.category_id === selectedCategory;
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // افزودن خدمت معمول از نرخ‌نامه
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

  // افزودن خدمت آزاد / دلخواه (سفارشی)
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
      service_id: 0, // شناسه صفر برای خدمات آزاد
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

  // تغییر تعداد
  const handleUpdateQty = (itemId: string, delta: number) => {
    const updated = items
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty, total_price: newQty * item.unit_price } : null;
        }
        return item;
      })
      .filter(Boolean) as InvoiceItem[];
    setItems(updated);
  };

  // حذف قلم
  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter((i) => i.id !== itemId));
  };

  // محاسبات مالی فاکتور
  const totalAmount = items.reduce((acc, i) => acc + i.total_price, 0);
  const discount = parseTomanInput(discountStr);
  const finalAmount = Math.max(0, totalAmount - discount);

  // ثبت نهایی فاکتور
  const handleSaveInvoice = (shouldPrint: boolean = false) => {
    if (items.length === 0) {
      setError('لطفاً حداقل یک خدمت یا کالا به فاکتور اضافه کنید.');
      return;
    }

    const created = addInvoice({
      shift_id: currentShift ? currentShift.id : 0,
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      customer_name: customerName.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      items,
      total_amount: totalAmount,
      discount,
      final_amount: finalAmount,
      payment_method: paymentMethod,
    });

    onClose();
    if (shouldPrint) {
      onViewInvoice(created.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 no-print">
      <div className="w-full max-w-5xl h-[92vh] bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 flex flex-col text-right overflow-hidden">
        {/* هدر */}
        <div className="h-14 px-5 border-b border-slate-100 dark:border-zinc-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Receipt className="w-5 h-5" />
            <span>ثبت فاکتور و دریافتی جدید (چندخدمتی / سریع / آزاد)</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه دو ستونه */}
        <div className="flex-1 flex overflow-hidden">
          {/* ستون راست: انتخاب خدمات و نرخ‌نامه */}
          <div className="w-7/12 border-l border-slate-100 dark:border-zinc-700 p-4 flex flex-col overflow-hidden">
            {/* ردیف دکمه‌های ابزار: جستجو، ماشین حساب پرینت، افزودن خدمت آزاد */}
            <div className="flex gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="جستجوی سریع خدمات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
                />
              </div>

              <button
                type="button"
                onClick={onOpenPrintCalc}
                className="px-3 h-10 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-100 transition-colors shrink-0"
              >
                <Calculator className="w-4 h-4" />
                محاسبه پرینت
              </button>

              <button
                type="button"
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="px-3 h-10 rounded-xl bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50 text-xs font-semibold flex items-center gap-1.5 hover:bg-purple-100 transition-colors shrink-0"
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                خدمت آزاد / دلخواه
              </button>
            </div>

            {/* بخش فرم افزودن خدمت دلخواه (خارج از نرخ‌نامه) */}
            {showCustomForm && (
              <div className="p-3 mb-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 rounded-xl shrink-0 space-y-2">
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center justify-between">
                  <span>افزودن خدمت آزاد اختصاصی برای این مشتری:</span>
                  <button onClick={() => setShowCustomForm(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    placeholder="شرح خدمت (مثلا: تایپ فوری عریضه، تنظیم قرارداد...)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="col-span-6 h-8 px-2.5 rounded-lg border border-purple-200 bg-white dark:bg-zinc-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="مبلغ (تومان)"
                    value={customPriceStr}
                    onChange={(e) => setCustomPriceStr(e.target.value)}
                    className="col-span-3 h-8 px-2 rounded-lg border border-purple-200 bg-white dark:bg-zinc-900 text-xs text-left font-bold"
                    dir="ltr"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="تعداد"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="col-span-1 h-8 px-1 text-center rounded-lg border border-purple-200 bg-white dark:bg-zinc-900 text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="col-span-2 h-8 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    افزودن +
                  </button>
                </div>
              </div>
            )}

            {/* دسته‌بندی‌ها */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                همه خدمات
              </button>
              {serviceCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* کارت‌های خدمات جهت انتخاب با یک کلیک */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1 mt-2">
              {filteredServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleAddService(service)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-right transition-all flex flex-col justify-between group h-20 active:scale-95"
                >
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                    {service.title}
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {formatToman(service.unit_price)}
                    </span>
                    <Plus className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ستون چپ: سبد اقلام فاکتور و تسویه */}
          <div className="w-5/12 p-4 flex flex-col justify-between bg-slate-50/50 dark:bg-zinc-800/40">
            {/* اطلاعات مشتری (اختیاری) */}
            <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  نام مشتری (اختیاری):
                </label>
                <input
                  type="text"
                  placeholder="مشتری عمومی"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  شماره تماس (اختیاری):
                </label>
                <input
                  type="text"
                  placeholder="۰۹۱۲..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* لیست اقلام ثبت‌شده در فاکتور */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-900 p-2 space-y-2 mb-3">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Receipt className="w-8 h-8 stroke-1 mb-2 text-slate-300" />
                  خدمات مورد نظر را از ستون راست یا دکمه «خدمت آزاد» انتخاب کنید.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.service_title}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatToman(item.unit_price)}
                      </div>
                    </div>

                    {/* تغییر تعداد */}
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="w-5 h-5 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded"
                      >
                        +
                      </button>
                      <span className="w-6 text-center font-bold text-slate-700 dark:text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded"
                      >
                        -
                      </button>
                    </div>

                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {formatToman(item.total_price)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* بخش تسویه، تخفیف و روش پرداخت */}
            <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-slate-200 dark:border-zinc-700 space-y-2 shrink-0">
              {/* روش پرداخت */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pos')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    paymentMethod === 'pos'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600'
                  }`}
                >
                  کارت‌خوان (POS)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'border-slate-200 dark:border-zinc-700 text-slate-600'
                  }`}
                >
                  نقدی (صندوق)
                </button>
              </div>

              {/* تخفیف */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500">تخفیف (اختیاری):</span>
                <input
                  type="text"
                  value={discountStr}
                  onChange={(e) => setDiscountStr(e.target.value)}
                  className="w-28 h-7 px-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-left text-xs"
                  placeholder="۰"
                  dir="ltr"
                />
              </div>

              {/* جمع کل نهایی */}
              <div className="flex items-center justify-between text-sm font-extrabold pt-2 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-slate-800 dark:text-slate-100">مبلغ قابل دریافت:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">
                  {formatToman(finalAmount)}
                </span>
              </div>
            </div>

            {error && <div className="text-[11px] text-rose-500 font-semibold mt-1">{error}</div>}

            {/* دکمه‌های ثبت */}
            <div className="grid grid-cols-2 gap-2 mt-3 shrink-0">
              <button
                type="button"
                onClick={() => handleSaveInvoice(false)}
                className="py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                ثبت دریافتی (سریع)
              </button>
              <button
                type="button"
                onClick={() => handleSaveInvoice(true)}
                className="py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                ثبت و چاپ فاکتور
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
