import React, { useState, useMemo } from 'react';
import { MenuItem } from '../types';
import { Button } from './Button';

interface MenuManagementViewProps {
  items: MenuItem[];
  onUpdateItems: (items: MenuItem[]) => void;
  onDeleteItem?: (id: string) => Promise<void>;
  categories: string[];
  onUpdateCategories: (categories: string[]) => void;
  onRenameCategory?: (oldName: string, newName: string) => Promise<void>;
}

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({ items, onUpdateItems, onDeleteItem, categories, onUpdateCategories, onRenameCategory }) => {
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ old: string, new: string } | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({});
  const [newEnchancement, setNewEnchancement] = useState('');
  const [newVariant, setNewVariant] = useState('');
  
  const [activeTab, setActiveTab] = useState<'items' | 'sauces'>('items');
  const [filterQuery, setFilterQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Vše');
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [enhSearch, setEnhSearch] = useState('');
  const [enhCategory, setEnhCategory] = useState('Vše');
  const [showEnhancementPicker, setShowEnhancementPicker] = useState(false);

  const availableCategories = useMemo(() => {
    return Array.from(new Set([...categories, ...items.map(i => i.category)])).sort();
  }, [categories, items]);

  const handleSave = () => {
    const finalName = formData.name !== undefined ? formData.name : (editingItem?.name || '');
    if (!finalName) return;
    
    const newItem: MenuItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name: formData.name !== undefined ? formData.name : (editingItem?.name || ''),
      description: formData.description !== undefined ? formData.description : (editingItem?.description || ''),
      category: formData.category !== undefined ? formData.category : (editingItem?.category || 'Ostatní'),
      image: formData.image !== undefined ? formData.image : (editingItem?.image || ''),
      price: formData.price !== undefined ? formData.price : (editingItem?.price || 0),
      isSoldOut: formData.isSoldOut !== undefined ? formData.isSoldOut : (editingItem?.isSoldOut || false),
      isHidden: formData.isHidden !== undefined ? formData.isHidden : (editingItem?.isHidden || false),
      vylepseni: formData.vylepseni !== undefined ? formData.vylepseni : (editingItem?.vylepseni || []),
      varianty: formData.varianty !== undefined ? formData.varianty : (editingItem?.varianty || [])
    };

    onUpdateItems(isCreating ? [...items, newItem] : items.map(i => i.id === newItem.id ? newItem : i));
    setEditingItem(null);
    setIsCreating(false);
    setFormData({});
    setIsAddingNewCategory(false);
    setNewCategoryName('');
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const isSauce = item.category === 'Omáčky & Dipy';
      if (activeTab === 'sauces' && !isSauce) return false;
      if (activeTab === 'items' && isSauce) return false;

      const matchesSearch = item.name.toLowerCase().includes(filterQuery.toLowerCase());
      const matchesCategory = filterCategory === 'Vše' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, activeTab, filterQuery, filterCategory]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Sklad & Menu 📝</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Správa nabízených dobrot</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setActiveTab('items')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${activeTab === 'items' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>Nabídka</button>
           <button onClick={() => setActiveTab('sauces')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all ${activeTab === 'sauces' ? 'bg-orange-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>Omáčky & Dipy</button>
           <button onClick={() => setIsManagingCategories(true)} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 ml-2">⚙️ Kategorie</button>
           <Button variant="primary" onClick={() => { setFormData({ category: activeTab === 'sauces' ? 'Omáčky & Dipy' : (availableCategories[0] || 'Ostatní'), vylepseni: [] }); setIsCreating(true); }} className="rounded-2xl font-black py-3 px-6 shadow-xl text-xs uppercase ml-2">
              Přidat ➕
           </Button>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap gap-4 bg-white p-4 rounded-2xl border-2 border-slate-50 shadow-sm items-center">
         <div className="flex-1 min-w-[200px] relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input 
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-orange-500" 
                placeholder="Hledat v menu..." 
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
            />
         </div>
                {activeTab === 'items' && (
            <select 
                className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none focus:border-orange-500"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
            >
                <option value="Vše">Všechny kategorie</option>
                {availableCategories.filter(c => c !== 'Omáčky & Dipy').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
         )}
         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-auto">
            Zobrazeno: {filteredItems.length} položek
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => (
          <div key={item.id} className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col relative ${item.isSoldOut ? 'opacity-50 grayscale border-red-100' : 'border-slate-50'}`}>
            {item.isHidden && <div className="absolute top-2 right-2 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase shadow-lg z-10">Skryto 👁️‍🗨️</div>}
             <div className="h-24 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
               {item.image ? (
                 <img src={item.image} className="h-full w-full object-cover" />
               ) : (
                 <span className="text-3xl grayscale opacity-30">🍽️</span>
               )}
             </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black text-xl text-slate-900 leading-tight">{item.name}</h3>
                <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-full uppercase text-slate-500">{item.category}</span>
              </div>
              <p className="text-sm text-slate-400 font-bold italic mb-4">"{item.description}"</p>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {item.varianty?.map(v => (
                    <span key={v} className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100">{v}</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1 mb-6">
                {item.vylepseni?.map(v => (
                    <span key={v} className="text-[10px] font-black bg-orange-50 text-orange-600 px-2 py-1 rounded-lg">+{v}</span>
                ))}
              </div>

              <div className="mt-auto flex gap-2">
                 <button onClick={() => setEditingItem(item)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all font-black text-xs uppercase">Upravit</button>
                 <button onClick={() => onUpdateItems(items.map(i => i.id === item.id ? {...i, isSoldOut: !i.isSoldOut} : i))} className={`flex-1 p-3 rounded-xl font-black text-xs uppercase transition-all ${item.isSoldOut ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {item.isSoldOut ? 'NASKLADNIT' : 'VYPRODÁNO'}
                 </button>
                 <button onClick={() => setItemToDelete(item)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(isCreating || editingItem) && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
           <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[95vh]">
              <div className="p-6 md:p-8 border-b-2 border-slate-50 shrink-0">
                  <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="absolute top-6 right-8 text-slate-400 hover:text-slate-900 text-xl font-black z-10">✕</button>
                  <h2 className="text-2xl font-black text-slate-900 border-b-4 border-orange-500 pb-1 inline-block">
                    {isCreating ? 'Nové Jídlo' : 'Upravit Jídlo'}
                  </h2>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto no-scrollbar space-y-5 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Název</label>
                        <input className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black outline-none focus:border-orange-500" value={formData.name !== undefined ? formData.name : (editingItem?.name || '')} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex justify-between">
                           Kategorie
                           <button onClick={() => setIsAddingNewCategory(!isAddingNewCategory)} className="text-orange-500 hover:underline">{isAddingNewCategory ? 'Zpět na výběr' : '+ Nová'}</button>
                        </label>
                        {isAddingNewCategory ? (
                           <input 
                              autoFocus
                              className="w-full p-3 bg-orange-50 border-2 border-orange-200 rounded-xl font-black outline-none" 
                              placeholder="Název..." 
                              value={newCategoryName}
                              onChange={e => {
                                 setNewCategoryName(e.target.value);
                                 setFormData({...formData, category: e.target.value});
                              }}
                           />
                        ) : (
                           <select className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black outline-none focus:border-orange-500" value={formData.category !== undefined ? formData.category : (editingItem?.category || '')} onChange={e => setFormData({...formData, category: e.target.value})}>
                               {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        )}
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Cena (Kč)</label>
                        <input type="number" className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black outline-none focus:border-orange-500" value={formData.price !== undefined ? formData.price : (editingItem?.price || 0)} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Krátký popis</label>
                    <input className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500" value={formData.description !== undefined ? formData.description : (editingItem?.description || '')} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">URL Obrázku</label>
                    <input className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500" value={formData.image !== undefined ? formData.image : (editingItem?.image || '')} placeholder="https://..." onChange={e => setFormData({...formData, image: e.target.value})} />
                </div>

                <div className="flex items-center gap-4 bg-slate-50 p-4 border-2 border-slate-100 rounded-2xl">
                    <label className="flex items-center gap-3 cursor-pointer w-full">
                        <input type="checkbox" className="w-5 h-5 accent-orange-600 rounded-lg shrink-0 cursor-pointer" checked={formData.isHidden !== undefined ? formData.isHidden : (editingItem?.isHidden || false)} onChange={e => setFormData({...formData, isHidden: e.target.checked})} />
                        <div>
                            <span className="font-black text-sm text-slate-900 block uppercase tracking-wide">Skrýt ve veřejném menu</span>
                            <span className="text-[10px] text-slate-500 font-bold block leading-tight">Položka nebude zákazníkům viditelná (vhodné pro vylepšení)</span>
                        </div>
                    </label>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Možné varianty (Právě jedna - např. Velikost)</label>
                    <div className="flex gap-2 mb-2">
                        <input className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500" placeholder="Např. Malé, Velké..." value={newVariant} onChange={e => setNewVariant(e.target.value)} />
                        <button onClick={() => {
                            if (!newVariant.trim()) return;
                            const current = formData.varianty || (editingItem?.varianty || []);
                            if(!current.includes(newVariant.trim())) setFormData({...formData, varianty: [...current, newVariant.trim()]});
                            setNewVariant('');
                        }} className="px-5 bg-blue-500 text-white rounded-xl font-black font-2xl">＋</button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {(formData.varianty || (editingItem?.varianty || [])).map((v, i) => (
                            <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 border border-blue-100">
                                {v}
                                <button onClick={() => {
                                    const current = formData.varianty || (editingItem?.varianty || []);
                                    setFormData({...formData, varianty: current.filter((_, idx) => idx !== i)});
                                }} className="text-red-400 hover:text-red-600">✕</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-1 border-t-2 border-slate-50 pt-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Možná vylepšení (Může být více - např. Omáčky)</label>
                    <div className="flex gap-2 mb-2">
                        <input className="flex-1 p-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold outline-none focus:border-orange-500" placeholder="Vlastní text..." value={newEnchancement} onChange={e => setNewEnchancement(e.target.value)} />
                        <button onClick={() => {
                            if (!newEnchancement.trim()) return;
                            const current = formData.vylepseni || (editingItem?.vylepseni || []);
                            if(!current.includes(newEnchancement.trim())) setFormData({...formData, vylepseni: [...current, newEnchancement.trim()]});
                            setNewEnchancement('');
                        }} className="px-5 bg-orange-500 text-white rounded-xl font-black font-2xl">＋</button>
                    </div>
                    <div className="mb-4 bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 shadow-sm relative">
                        <button onClick={() => setShowEnhancementPicker(!showEnhancementPicker)} className="w-full text-left font-black text-orange-600 text-xs flex justify-between items-center hover:text-orange-700 transition-colors uppercase tracking-wider">
                           <span>➕ Nalistovat položky ze stálého menu</span>
                           <span className="text-xl">{showEnhancementPicker ? '▴' : '▾'}</span>
                        </button>

                        {showEnhancementPicker && (
                           <div className="mt-4 border-t-2 border-slate-200 pt-4 animate-slide-in">
                              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                 <input 
                                    placeholder="Hledat..." 
                                    className="flex-1 p-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-orange-500 transition-colors"
                                    value={enhSearch}
                                    onChange={e => setEnhSearch(e.target.value)}
                                 />
                                 <select 
                                    className="p-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-orange-500 transition-colors"
                                    value={enhCategory}
                                    onChange={e => setEnhCategory(e.target.value)}
                                 >
                                    <option value="Vše">Všechny kategorie</option>
                                    {availableCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                              </div>
                              <div className="max-h-40 overflow-y-auto no-scrollbar flex flex-col gap-1.5 pr-1">
                                 {items
                                    .filter(i => i.id !== (editingItem?.id || ''))
                                    .filter(i => enhCategory === 'Vše' || i.category === enhCategory)
                                    .filter(i => i.name.toLowerCase().includes(enhSearch.toLowerCase()))
                                    .map(item => {
                                       const current = formData.vylepseni || (editingItem?.vylepseni || []);
                                       const isSelected = current.includes(item.name);
                                       return (
                                          <label key={item.id} className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'bg-orange-500 text-white border-orange-600 shadow-md' : 'bg-white text-slate-700 border-slate-100 hover:border-orange-300 hover:bg-orange-50/50'}`}>
                                             <input 
                                                type="checkbox" 
                                                className="w-4 h-4 accent-emerald-500 cursor-pointer rounded shrink-0"
                                                checked={isSelected}
                                                onChange={(e) => {
                                                   if (e.target.checked) setFormData({...formData, vylepseni: [...current, item.name]});
                                                   else setFormData({...formData, vylepseni: current.filter(n => n !== item.name)});
                                                }}
                                             />
                                             <span className="font-black text-xs flex-1">{item.name}</span>
                                             <span className={`text-[8px] uppercase font-black px-2 py-1 rounded-lg ${isSelected ? 'bg-orange-700/50 text-white' : 'bg-slate-100 text-slate-500'}`}>{item.category}</span>
                                          </label>
                                       );
                                    })
                                 }
                                 {items.filter(i => i.id !== (editingItem?.id || '')).filter(i => enhCategory === 'Vše' || i.category === enhCategory).filter(i => i.name.toLowerCase().includes(enhSearch.toLowerCase())).length === 0 && (
                                    <div className="text-center p-4 text-slate-400 text-xs font-black bg-white rounded-xl border-2 border-dashed border-slate-200">🥗 Prázdno</div>
                                 )}
                              </div>
                           </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {(formData.vylepseni || (editingItem?.vylepseni || [])).map((v, i) => (
                            <span key={i} className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5 border border-slate-200">
                                {v}
                                <button onClick={() => {
                                    const current = formData.vylepseni || (editingItem?.vylepseni || []);
                                    setFormData({...formData, vylepseni: current.filter((_, idx) => idx !== i)});
                                }} className="text-red-400 hover:text-red-600">✕</button>
                            </span>
                        ))}
                    </div>
                </div>
              </div>

              <div className="p-6 md:p-8 border-t-2 border-slate-50 shrink-0">
                  <Button variant="primary" fullWidth onClick={handleSave} className="py-4 text-base font-black rounded-xl shadow-xl shadow-orange-100">
                      ULOŽIT DO MENU 💾
                  </Button>
              </div>
           </div>
        </div>
      )}

      {isManagingCategories && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[200] flex items-center justify-center p-6">
           <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
              <button onClick={() => setIsManagingCategories(false)} className="absolute top-6 right-8 text-slate-400 hover:text-slate-900 text-xl font-black">✕</button>
              <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Správa Kategorií</h2>
              
              <div className="space-y-3 max-h-[350px] overflow-y-auto no-scrollbar mb-6 pr-2">
                 {availableCategories.map(cat => {
                    const count = items.filter(i => i.category === cat).length;
                    const isEditing = editingCategory?.old === cat;

                    return (
                       <div key={cat} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[70px]">
                          {isEditing ? (
                             <div className="flex-1 flex gap-2">
                                <input 
                                   autoFocus
                                   className="flex-1 p-2 bg-white border-2 border-orange-500 rounded-lg font-bold text-sm outline-none" 
                                   value={editingCategory?.new}
                                   onChange={e => setEditingCategory({...editingCategory!, new: e.target.value})}
                                />
                                <button onClick={() => {
                                   if (editingCategory?.new && editingCategory.new !== editingCategory.old) {
                                      onRenameCategory?.(editingCategory.old, editingCategory.new);
                                   }
                                   setEditingCategory(null);
                                }} className="p-2 bg-emerald-500 text-white rounded-lg text-xs font-black">OK</button>
                                <button onClick={() => setEditingCategory(null)} className="p-2 bg-slate-200 text-slate-400 rounded-lg text-xs font-black">✕</button>
                             </div>
                          ) : (
                             <>
                                <div>
                                   <p className="font-black text-slate-900 text-sm tracking-tight">{cat}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{count} položek</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setEditingCategory({ old: cat, new: cat })} className="p-2 text-slate-400 hover:text-blue-500 transition-colors text-xs">✏️</button>
                                    {count === 0 ? (
                                       <button onClick={() => onUpdateCategories(categories.filter(c => c !== cat))} className="p-2 text-red-500 hover:text-red-600 transition-colors text-xs">🗑️</button>
                                    ) : (
                                       <span className="text-[9px] font-black text-slate-300 uppercase italic px-2">Aktivní</span>
                                    )}
                                </div>
                             </>
                          )}
                       </div>
                    );
                 })}
              </div>

              <div className="space-y-1 bg-slate-900 p-6 rounded-3xl text-white">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nová Kategorie</label>
                 <div className="flex gap-2">
                    <input 
                      id="new-cat-input"
                      className="flex-1 p-3 bg-white/10 border border-white/10 rounded-xl font-bold text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-500" 
                      placeholder="Název..." 
                      onKeyPress={e => {
                         if (e.key === 'Enter') {
                            const input = (e.target as HTMLInputElement);
                            if (input.value && !categories.includes(input.value)) {
                               onUpdateCategories([...categories, input.value]);
                               input.value = '';
                            }
                         }
                      }}
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById('new-cat-input') as HTMLInputElement;
                        if (input.value && !categories.includes(input.value)) {
                          onUpdateCategories([...categories, input.value]);
                          input.value = '';
                        }
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl font-black text-xs uppercase transition-all shadow-lg shadow-orange-500/20"
                    >
                      Přidat ➕
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
       {itemToDelete && (
         <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[300] flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative text-center border-4 border-slate-100">
               <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🗑️</div>
               <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Smazat položku?</h2>
               <p className="text-slate-500 font-bold mb-8 italic">"{itemToDelete.name}" bude trvale odstraněno z nabídky.</p>
               <div className="flex flex-col gap-3">
                  <Button variant="danger" fullWidth onClick={() => { 
                    onDeleteItem?.(itemToDelete.id); 
                    setItemToDelete(null); 
                  }} className="py-4 text-lg font-black rounded-xl">ANO, SMAZAT 🗑️</Button>
                  <Button variant="secondary" fullWidth onClick={() => setItemToDelete(null)} className="font-bold border-0">Zrušit</Button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
