import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { ServiceItem } from '../../types';
import { formatToman, parseTomanInput } from '../../utils/currency';
import { downloadServicesTemplateExcel, parseServicesExcelFile, ParsedExcelService } from '../../utils/exportExcel';
import { matchesFuzzyPersian } from '../../utils/text';
import { Tags, Plus, Edit2, Trash2, Check, X, Search, FolderPlus, FileSpreadsheet, Download, Upload, AlertCircle } from 'lucide-react';

export const ServicesRatesView: React.FC = () => {
  const {
    services,
    serviceCategories,
    addServiceItem,
    updateServiceItem,
    deleteServiceItem,
    addServiceCategory,
    importServicesBulk,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');

  // استیت‌های ایمپورت اکسل
  const [importedServices, setImportedServices] = useState<ParsedExcelService[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importStatusMessage, setImportStatusMessage] = useState('');
  const [importErrorMessage, setImportErrorMessage] = useState('');

  // استیت افزودن خدمت جدید
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriceStr, setNewPriceStr] = useState('');
  const [newCatId, setNewCatId] = useState<number>(serviceCategories[0]?.id || 1);

  // استیت افزودن دسته جدید
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // استیت ویرایش کامل خدمت
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPriceStr, setEditPriceStr] = useState('');
  const [editCatId, setEditCatId] = useState<number>(1);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCat === 'all' || s.category_id === selectedCat;
    const matchSearch = matchesFuzzyPersian(s.title, searchQuery);
    return matchCat && matchSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseTomanInput(newPriceStr);
    if (!newTitle.trim() || price <= 0) return;

    addServiceItem({
      title: newTitle.trim(),
      unit_price: price,
      category_id: newCatId,
      is_active: true,
    });

    setNewTitle('');
    setNewPriceStr('');
    setIsAddOpen(false);
  };

  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addServiceCategory(newCatName.trim());
    setNewCatName('');
    setIsAddCatOpen(false);
  };

  const handleStartEdit = (service: ServiceItem) => {
    setEditingService(service);
    setEditTitle(service.title);
    setEditPriceStr(service.unit_price.toString());
    setEditCatId(service.category_id);
    setEditIsActive(service.is_active);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const p = parseTomanInput(editPriceStr);
    if (!editTitle.trim() || p <= 0) return;

    updateServiceItem(editingService.id, {
      title: editTitle.trim(),
      unit_price: p,
      category_id: editCatId,
      is_active: editIsActive,
    });

    setEditingService(null);
  };

  // خواندن فایل اکسل بارگذاری شده
  const handleExcelFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrorMessage('');
    setImportStatusMessage('');

    try {
      const parsed = await parseServicesExcelFile(file);
      setImportedServices(parsed);
      setImportFileName(file.name);
      setIsImportModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'خطا در خواندن فایل اکسل.');
    } finally {
      e.target.value = '';
    }
  };

  // تایید ورود اقلام اکسل به نرخ‌نامه
  const handleConfirmImport = (replaceExisting: boolean) => {
    if (importedServices.length === 0) return;

    const count = importServicesBulk(importedServices, replaceExisting);
    setIsImportModalOpen(false);
    setImportedServices([]);
    setImportFileName('');
    setImportStatusMessage(`✓ تعداد ${count} عنوان خدمت از فایل اکسل با موفقیت به نرخ‌نامه اضافه شد.`);
    setTimeout(() => setImportStatusMessage(''), 5000);
  };

  return (
    <div className="space-y-4 text-right">
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-600" />
            نرخ‌نامه، دسته‌بندی‌ها و تعرفه مصوب خدمات کافی‌نت
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            امکان تعریف، ورود گروهی از فایل اکسل (.xlsx) و ویرایش کامل قیمت و عناوین خدمات
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* دکمه دانلود قالب اکسل */}
          <button
            type="button"
            onClick={downloadServicesTemplateExcel}
            className="px-3 py-2 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="دانلود فایل نمونه اکسل جهت نوشتن خدمات و تعرفه‌ها"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>قالب خام اکسل</span>
          </button>

          {/* دکمه ورود از اکسل */}
          <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all active:scale-95">
            <FileSpreadsheet className="w-4 h-4" />
            <span>ورود از اکسل (.xlsx)</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleExcelFileSelect} className="hidden" />
          </label>

          <button
            onClick={() => setIsAddCatOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-blue-600" />
            افزودن دسته‌بندی
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            خدمت جدید
          </button>
        </div>
      </div>

      {importStatusMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{importStatusMessage}</span>
        </div>
      )}

      {/* فیلترها و دسته‌ها */}
      <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی عنوان خدمت..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pr-9 pl-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
              selectedCat === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            همه دسته‌ها ({services.length})
          </button>
          {serviceCategories.map((c) => {
            const count = services.filter((s) => s.category_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedCat === c.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* جدول نرخ‌نامه */}
      <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-zinc-900/60 text-slate-500 border-b border-slate-100 dark:border-zinc-700">
              <tr>
                <th className="p-3">ردیف</th>
                <th className="p-3">عنوان خدمت</th>
                <th className="p-3">دسته‌بندی</th>
                <th className="p-3">نرخ مصوب (تومان)</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
              {filteredServices.map((service, idx) => {
                const cat = serviceCategories.find((c) => c.id === service.category_id);
                return (
                  <tr key={service.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{service.title}</td>
                    <td className="p-3 text-slate-500">{cat?.name || '-'}</td>
                    <td className="p-3 font-extrabold text-blue-600 dark:text-blue-400">
                      {formatToman(service.unit_price)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          service.is_active
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {service.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(service)}
                          className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="ویرایش کامل خدمت"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          ویرایش کامل
                        </button>
                        <button
                          onClick={() => deleteServiceItem(service.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors"
                          title="حذف خدمت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال ویرایش کامل خدمت */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-750 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-blue-600" />
              ویرایش کامل خدمت در نرخ‌نامه
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  دسته‌بندی خدمت:
                </label>
                <select
                  value={editCatId}
                  onChange={(e) => setEditCatId(parseInt(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
                >
                  {serviceCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان دقیق خدمت:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نرخ مصوب پایه (تومان):
                </label>
                <input
                  type="text"
                  required
                  value={editPriceStr}
                  onChange={(e) => setEditPriceStr(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  وضعیت خدمت:
                </label>
                <select
                  value={editIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditIsActive(e.target.value === 'active')}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
                >
                  <option value="active">فعال (نمایش در صدور فاکتور)</option>
                  <option value="inactive">غیرفعال (مخفی در صدور فاکتور)</option>
                </select>
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
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال افزودن خدمت */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-750">
              افزودن خدمت یا کالای جدید به نرخ‌نامه
            </h3>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  دسته‌بندی خدمت:
                </label>
                <select
                  value={newCatId}
                  onChange={(e) => setNewCatId(parseInt(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold"
                >
                  {serviceCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان دقیق خدمت / کالا:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلا: صحافی فنری با طلق (تا ۵۰ برگ)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نرخ مصوب (تومان):
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلا: ۳۵,۰۰۰"
                  value={newPriceStr}
                  onChange={(e) => setNewPriceStr(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs text-left font-bold"
                  dir="ltr"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  افزودن به نرخ‌نامه
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال افزودن دسته جدید */}
      {isAddCatOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4 pb-2 border-b border-slate-100 dark:border-zinc-750 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-blue-600" />
              افزودن دسته‌بندی جدید
            </h3>

            <form onSubmit={handleAddCatSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  نام دسته‌بندی جدید:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلا: خدمات نقشه و پلات مهندسی"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  ثبت دسته
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddCatOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* مودال پیش‌نمایش و تایید خدمات واردشده از فایل اکسل */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-700 p-6 text-right flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-700 shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  پیش‌نمایش ورود خدمات از اکسل ({importFileName})
                </h3>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 my-2 shrink-0">
              تعداد <strong>{importedServices.length}</strong> قلم خدمت معتبر در فایل شناسایی شد. لطفاً بررسی و نحوه افزودن را انتخاب نمایید:
            </p>

            {/* جدول پیش‌نمایش */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-zinc-700 rounded-xl mb-4">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-zinc-900 text-slate-500 sticky top-0 border-b border-slate-200 dark:border-zinc-700">
                  <tr>
                    <th className="p-2.5">ردیف</th>
                    <th className="p-2.5">دسته‌بندی</th>
                    <th className="p-2.5">عنوان خدمت</th>
                    <th className="p-2.5">نرخ مصوب (تومان)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-700">
                  {importedServices.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-zinc-750">
                      <td className="p-2.5 text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 text-slate-500">{s.category}</td>
                      <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{s.title}</td>
                      <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatToman(s.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* دکمه‌های اقدام */}
            <div className="flex flex-col sm:flex-row gap-2 shrink-0 pt-2 border-t border-slate-100 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => handleConfirmImport(false)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                افزودن به نرخ‌نامه فعلی (ادغام اقلام)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('آیا مطمئن هستید؟ تمامی خدمات قبلی پاک شده و فقط این لیست اکسل جایگزین خواهد شد.')) {
                    handleConfirmImport(true);
                  }
                }}
                className="px-4 py-2.5 border border-rose-300 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-all"
              >
                جایگزینی کامل نرخ‌نامه قبلی
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2.5 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
