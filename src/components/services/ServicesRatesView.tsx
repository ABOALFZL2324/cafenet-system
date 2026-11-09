import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { formatToman, parseTomanInput } from '../../utils/currency';
import { Tags, Plus, Edit2, Trash2, Check, X, Search } from 'lucide-react';

export const ServicesRatesView: React.FC = () => {
  const { services, serviceCategories, addServiceItem, updateServiceItem, deleteServiceItem, addServiceCategory } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | 'all'>('all');

  // استیت افزودن خدمت جدید
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriceStr, setNewPriceStr] = useState('');
  const [newCatId, setNewCatId] = useState<number>(serviceCategories[0]?.id || 1);

  // استیت ویرایش قیمت
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPriceStr, setEditPriceStr] = useState('');

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCat === 'all' || s.category_id === selectedCat;
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
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

  const handleStartEdit = (service: typeof services[0]) => {
    setEditingId(service.id);
    setEditPriceStr(service.unit_price.toString());
  };

  const handleSaveEdit = (id: number) => {
    const p = parseTomanInput(editPriceStr);
    if (p > 0) {
      updateServiceItem(id, { unit_price: p });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-4 text-right">
      <div className="bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tags className="w-5 h-5 text-blue-600" />
            نرخ‌نامه و تعرفه مصوب خدمات کافی‌نت
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تعیین نرخ پایه خدمات، پرینت، ثبت‌نام‌ها و کالاها جهت استفاده سریع در صدور فاکتور
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          افزودن خدمت جدید به نرخ‌نامه
        </button>
      </div>

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
            همه دسته‌ها
          </button>
          {serviceCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedCat === c.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
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
                const isEditing = editingId === service.id;
                return (
                  <tr key={service.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-750">
                    <td className="p-3 text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{service.title}</td>
                    <td className="p-3 text-slate-500">{cat?.name || '-'}</td>
                    <td className="p-3 font-extrabold text-blue-600 dark:text-blue-400">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editPriceStr}
                            onChange={(e) => setEditPriceStr(e.target.value)}
                            className="w-24 h-7 px-2 border rounded text-xs text-left"
                            dir="ltr"
                          />
                          <button
                            onClick={() => handleSaveEdit(service.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        formatToman(service.unit_price)
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        فعال
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {!isEditing && (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(service)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="تغییر نرخ مصوب"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteServiceItem(service.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition-colors"
                            title="حذف خدمت"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال افزودن خدمت */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
