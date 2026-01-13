// ShopTrack Version: 1.1.9 (Fixed Data Sync for Peek Stats)
import React, { useState, useEffect, useMemo } from 'react';
import { Dashboard } from './components/Dashboard.tsx';
import { CATEGORIES_CONFIG, PRODUCTS_BY_CATEGORY } from './constants.tsx';
import { CategoryType, ProductEntry, IceDebtEntry, CustomerDebtEntry } from './types.ts';

const App: React.FC = () => {
  const getPageFromPath = () => {
    try {
      const path = window.location.pathname.replace(/\/$/, '');
      if (path === '/entry') return 'entry';
      if (path === '/ice-debt') return 'ice-debt';
      if (path === '/customer-debt') return 'customer-debt';
      if (path === '/settings') return 'settings';
      if (path === '/peek-stats') return 'peek-stats';
      return 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  };

  const [view, setView] = useState<'dashboard' | 'entry' | 'ice-debt' | 'customer-debt' | 'settings' | 'peek-stats'>(getPageFromPath());
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [iceDebtEntries, setIceDebtEntries] = useState<IceDebtEntry[]>([]);
  const [customerDebtEntries, setCustomerDebtEntries] = useState<CustomerDebtEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string>(localStorage.getItem('shoptrack_url') || '');
  
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  
  const [deliveredBags, setDeliveredBags] = useState<string>('');
  const [collectedBags, setCollectedBags] = useState<string>('');
  const [iceNote, setIceNote] = useState('');
  const [manualPrevDebt, setManualPrevDebt] = useState<string>('');

  const [debtCustName, setDebtCustName] = useState('');
  const [debtItemName, setDebtItemName] = useState('');
  const [debtQty, setDebtQty] = useState<string>('');
  const [debtAmount, setDebtAmount] = useState<string>('');

  const [peekSearch, setPeekSearch] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);

  useEffect(() => {
    try {
      const path = view === 'dashboard' ? '/' : `/${view}`;
      const canPush = window.location.protocol.startsWith('http');
      if (canPush && window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    } catch (e) {}
  }, [view]);

  useEffect(() => {
    const handlePopState = () => {
      try { setView(getPageFromPath()); } catch (e) { setView('dashboard'); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. ดึงข้อมูลจาก Local Storage เป็นอันดับแรก (Fast Load)
  useEffect(() => {
    const saved = localStorage.getItem('shop_entries');
    const savedIce = localStorage.getItem('ice_debt_entries');
    const savedCust = localStorage.getItem('customer_debt_entries');
    if (saved) setEntries(JSON.parse(saved));
    if (savedIce) setIceDebtEntries(JSON.parse(savedIce));
    if (savedCust) setCustomerDebtEntries(JSON.parse(savedCust));
  }, []);

  // 2. ปรับปรุง: ดึงข้อมูลจาก Google Sheets เมื่อมีการสลับหน้า (Auto-Restore & Refresh)
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!sheetUrl) return;
      setIsInitialLoading(true);
      try {
        // เพิ่ม timestamp (t=...) เพื่อป้องกัน browser จำค่าเก่า (Cache)
        const cacheBuster = `${sheetUrl}${sheetUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
        const response = await fetch(cacheBuster);
        if (response.ok) {
          const data = await response.json();
          if (data) {
            // ป้องกันข้อมูลใหม่ที่ยังไม่ได้ซิงค์หาย โดยการใช้ Merge Logic
            if (data.products) {
              setEntries(prev => {
                const unsynced = prev.filter(e => !e.isSynced);
                const synced = data.products.map((p: any) => ({ ...p, isSynced: true }));
                const unsyncedIds = new Set(unsynced.map(u => u.id));
                return [...unsynced, ...synced.filter((s: any) => !unsyncedIds.has(s.id))];
              });
            }
            if (data.iceDebt) {
              setIceDebtEntries(prev => {
                const unsynced = prev.filter(e => !e.isSynced);
                const synced = data.iceDebt.map((p: any) => ({ ...p, isSynced: true }));
                const unsyncedIds = new Set(unsynced.map(u => u.id));
                return [...unsynced, ...synced.filter((s: any) => !unsyncedIds.has(s.id))];
              });
            }
            if (data.customerDebt) {
              setCustomerDebtEntries(prev => {
                const unsynced = prev.filter(e => !e.isSynced);
                const synced = data.customerDebt.map((p: any) => ({ ...p, isSynced: true }));
                const unsyncedIds = new Set(unsynced.map(u => u.id));
                return [...unsynced, ...synced.filter((s: any) => !unsyncedIds.has(s.id))];
              });
            }
          }
        }
      } catch (err) {
        console.warn("Sync: Could not fetch from Sheets. Using local data.", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    // ดึงข้อมูลใหม่ทุกครั้งที่เข้าหน้าส่องยอด หรือหน้าสรุปยอด เพื่อให้ได้ยอดล่าสุดจากชีต
    if (view === 'peek-stats' || view === 'dashboard') {
      fetchExistingData();
    }
  }, [sheetUrl, view]); // ทำงานทุกครั้งที่เปลี่ยนหน้า View หรือเปลี่ยน URL

  useEffect(() => {
    localStorage.setItem('shop_entries', JSON.stringify(entries));
    localStorage.setItem('ice_debt_entries', JSON.stringify(iceDebtEntries));
    localStorage.setItem('customer_debt_entries', JSON.stringify(customerDebtEntries));
  }, [entries, iceDebtEntries, customerDebtEntries]);

  const currentIceDebt = iceDebtEntries.length > 0 ? iceDebtEntries[0].currentDebt : 0;

  const categorySummary = useMemo(() => {
    const summary: Record<string, { quantity: number, amount: number }> = {};
    entries.forEach(entry => {
      if (!summary[entry.category]) {
        summary[entry.category] = { quantity: 0, amount: 0 };
      }
      summary[entry.category].quantity += entry.quantity;
      summary[entry.category].amount += entry.totalPrice;
    });
    return summary;
  }, [entries]);

  const peekResults = useMemo(() => {
    if (!peekSearch.trim()) return null;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - 7);

    const stats = {
      today: { qty: 0, amount: 0 },
      week: { qty: 0, amount: 0 },
      month: { qty: 0, amount: 0 },
      year: { qty: 0, amount: 0 }
    };

    const target = peekSearch.trim().toLowerCase();
    entries.forEach(e => {
      if (e.productName.toLowerCase().includes(target)) {
        const d = new Date(e.timestamp);
        if (d >= todayStart) {
          stats.today.qty += e.quantity;
          stats.today.amount += e.totalPrice;
        }
        if (d >= weekStart) {
          stats.week.qty += e.quantity;
          stats.week.amount += e.totalPrice;
        }
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          stats.month.qty += e.quantity;
          stats.month.amount += e.totalPrice;
        }
        if (d.getFullYear() === now.getFullYear()) {
          stats.year.qty += e.quantity;
          stats.year.amount += e.totalPrice;
        }
      }
    });
    return stats;
  }, [entries, peekSearch]);

  const handleSaveUrl = () => {
    localStorage.setItem('shoptrack_url', sheetUrl);
    alert('บันทึก URL สำเร็จ!');
  };

  const saveProductDirectly = () => {
    const cleanName = productName.trim();
    const qtyVal = parseFloat(quantity.toString().replace(/,/g, '')) || 0;
    const priceVal = parseFloat(price.toString().replace(/,/g, '')) || 0;
    
    if (!selectedCategory || !cleanName || qtyVal <= 0) {
      alert('⚠️ โปรดระบุชื่อสินค้าและจำนวนให้ถูกต้อง');
      return;
    }

    const newEntry: ProductEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      category: selectedCategory,
      productName: cleanName,
      quantity: qtyVal,
      totalPrice: priceVal,
      isSynced: false
    };

    setEntries(prev => [newEntry, ...prev]);
    
    setProductName(''); 
    setQuantity(''); 
    setPrice('');
    setStep('category');
    setSelectedCategory(null);
    setView('dashboard');
  };

  const handleIceDebtSave = () => {
    const del = parseFloat(deliveredBags) || 0;
    const col = parseFloat(collectedBags) || 0;
    const prev = manualPrevDebt !== '' ? (parseFloat(manualPrevDebt) || 0) : currentIceDebt;
    
    const newIceEntry: IceDebtEntry = {
      id: Math.random().toString(36).substring(2, 11), 
      timestamp: new Date().toISOString(),
      previousDebt: prev, 
      deliveredBags: del, 
      collectedBags: col, 
      currentDebt: prev + del - col,
      note: iceNote, 
      isSynced: false
    };
    setIceDebtEntries(prevArr => [newIceEntry, ...prevArr]);
    setDeliveredBags(''); setCollectedBags(''); setIceNote(''); setManualPrevDebt('');
    setView('dashboard');
    alert('✅ อัปเดตยอดถุงน้ำแข็งค้างแล้ว');
  };

  const handleAddCustomerDebt = () => {
    const cleanCustName = debtCustName.trim();
    const cleanItemName = debtItemName.trim();
    if (!cleanCustName || !cleanItemName) return;
    
    const newEntry: CustomerDebtEntry = {
      id: Math.random().toString(36).substring(2, 11),
      timestamp: new Date().toISOString(),
      customerName: cleanCustName,
      itemName: cleanItemName,
      quantity: parseFloat(debtQty) || 0,
      amount: parseFloat(debtAmount) || 0,
      isSynced: false
    };
    setCustomerDebtEntries(prev => [newEntry, ...prev]);
    setDebtCustName(''); setDebtItemName(''); setDebtQty(''); setDebtAmount('');
    alert('✅ บันทึกรายการค้างเรียบร้อย');
  };

  const syncToGoogleSheets = async () => {
    if (!sheetUrl) {
      alert('⚠️ โปรดระบุ URL ในหน้า Settings');
      setView('settings');
      return;
    }
    const unsyncedEntries = entries.filter(e => !e.isSynced);
    const unsyncedIce = iceDebtEntries.filter(e => !e.isSynced);
    const unsyncedCust = customerDebtEntries.filter(e => !e.isSynced);
    
    if (!unsyncedEntries.length && !unsyncedIce.length && !unsyncedCust.length) {
      alert('ไม่มีข้อมูลใหม่ให้ซิงค์');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch(sheetUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        body: JSON.stringify({ 
          products: unsyncedEntries, 
          iceDebt: unsyncedIce, 
          customerDebt: unsyncedCust 
        }) 
      });
      setEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      setIceDebtEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      setCustomerDebtEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      alert('🚀 ซิงค์ข้อมูลสำเร็จ!');
    } catch (e) {
      alert('❌ ผิดพลาด: ' + (e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unsyncedCount = entries.filter(e => !e.isSynced).length + 
                        iceDebtEntries.filter(e => !e.isSynced).length +
                        customerDebtEntries.filter(e => !e.isSynced).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 text-slate-900 font-['Kanit']">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
            <span className="text-xl font-bold tracking-tight">ShopTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={syncToGoogleSheets} disabled={isSubmitting || unsyncedCount === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${unsyncedCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {isSubmitting ? '⌛...' : '📋 ' + (unsyncedCount > 0 ? `ส่ง (${unsyncedCount})` : 'เรียบร้อย')}
            </button>
            <button onClick={() => setView('settings')} className="text-slate-400 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full">⚙️</button>
          </div>
        </div>
      </header>

      {isInitialLoading && (
        <div className="fixed top-[72px] left-0 right-0 z-50 flex justify-center">
          <div className="bg-blue-600 text-white px-4 py-1 rounded-b-lg text-[10px] font-bold animate-pulse shadow-md">
            🔄 กำลังดึงข้อมูลปัจจุบันจากชีต...
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <h2 className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1">OVERVIEW</h2>
                  <p className="text-2xl font-bold">บันทึกยอดขายวันนี้</p>
                  <div className="flex gap-2 mt-4 relative z-10 flex-wrap">
                    <button onClick={() => setView('customer-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">👤 คนค้าง</button>
                    <button onClick={() => setView('ice-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">🧊 ถุงน้ำแข็ง</button>
                    <button onClick={() => setView('peek-stats')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold">🔍 ส่องยอด</button>
                  </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-center items-center text-center">
                <span className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-tighter">ถุงน้ำแข็งค้างสะสม</span>
                <span className="text-5xl font-black text-blue-600">{currentIceDebt.toLocaleString()}</span>
                <button onClick={() => setView('ice-debt')} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">อัปเดตยอดถุง</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {/* Added explicit type annotation [string, any] to fix unknown property error in TypeScript */}
              {Object.entries(categorySummary).map(([cat, data]: [string, any]) => (
                <div key={cat} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 font-bold text-center h-8 flex items-center leading-none">{cat}</span>
                  <span className="text-sm font-black text-blue-600">฿{data.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <Dashboard entries={entries} />
          </div>
        )}

        {view === 'peek-stats' && (
          <div className="animate-fadeIn max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">⬅️</button>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">🔍 ส่องยอดรายสินค้า</h2>
              </div>
              
              <div className="space-y-4">
                <p className="text-slate-500 text-sm font-medium">ระบุชื่อสินค้าที่ต้องการส่องยอด (ระบบจะค้นหาชื่อที่ใกล้เคียง)</p>
                <div className="relative">
                   <input 
                    value={peekSearch} 
                    onChange={(e) => setPeekSearch(e.target.value)} 
                    placeholder="เช่น ลีโอ, โค้ก, สายฝน..." 
                    className="w-full px-6 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-lg transition-all shadow-inner"
                  />
                  {peekSearch && (
                    <button onClick={() => setPeekSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold">✕</button>
                  )}
                </div>
              </div>

              {peekResults && peekSearch.trim() !== '' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn">
                  {[
                    { label: 'วันนี้', data: peekResults.today, color: 'blue' },
                    { label: '7 วันล่าสุด', data: peekResults.week, color: 'emerald' },
                    { label: 'เดือนนี้', data: peekResults.month, color: 'amber' },
                    { label: 'ปีนี้', data: peekResults.year, color: 'purple' },
                  ].map((item, idx) => (
                    <div key={idx} className={`bg-${item.color}-50 p-6 rounded-3xl border border-${item.color}-100 flex flex-col`}>
                      <span className={`text-${item.color}-600 text-[10px] font-black uppercase tracking-widest mb-1`}>{item.label}</span>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-2xl font-black text-slate-900">{item.data.qty.toLocaleString()} <small className="text-[10px] text-slate-400 font-normal">ชิ้น</small></span>
                          <span className={`text-lg font-bold text-${item.color}-700`}>฿{item.data.amount.toLocaleString()}</span>
                        </div>
                        <div className={`w-8 h-8 rounded-full bg-${item.color}-200/50 flex items-center justify-center text-xs`}>📈</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!peekResults && peekSearch.trim() !== '' && (
                 <div className="text-center py-10 text-slate-400 italic bg-slate-50 rounded-3xl">-- ไม่พบข้อมูลสินค้าชื่อนี้ --</div>
              )}
            </div>
          </div>
        )}

        {view === 'entry' && (
          <div className="animate-fadeIn max-w-4xl mx-auto">
            {step === 'category' ? (
              <div className="space-y-8 text-center">
                <h2 className="text-3xl font-black text-slate-900">ระบุประเภทสินค้า</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {CATEGORIES_CONFIG.map((cat) => (
                    <button key={cat.type} onClick={() => { setSelectedCategory(cat.type); setStep('details'); }}
                      className="group bg-white rounded-[2rem] border border-slate-100 hover:border-blue-300 hover:shadow-2xl transition-all overflow-hidden">
                      <div className="w-full h-32 overflow-hidden">
                        <img src={cat.image} alt={cat.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="p-5 font-bold text-slate-800">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl max-w-2xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('category')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">⬅️</button>
                  <h2 className="text-2xl font-black text-slate-900">{selectedCategory}</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-3 uppercase">ชื่อสินค้า</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedCategory && PRODUCTS_BY_CATEGORY[selectedCategory]?.map(name => (
                        <button key={name} onClick={() => setProductName(name)} 
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${productName === name ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{name}</button>
                      ))}
                    </div>
                    <input 
                      value={productName} 
                      onChange={(e) => setProductName(e.target.value)} 
                      onKeyDown={(e) => e.key === 'Enter' && saveProductDirectly()}
                      placeholder="พิมพ์ชื่อสินค้าที่ต้องการลงขาย..." 
                      className="w-full px-5 py-4 rounded-2xl bg-slate-50 border outline-none font-bold focus:border-blue-300 focus:bg-white transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">จำนวน</label>
                      <input 
                        type="number" 
                        inputMode="decimal" 
                        value={quantity} 
                        onChange={(e) => setQuantity(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && saveProductDirectly()}
                        placeholder="0" 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-black text-lg focus:border-blue-300 focus:bg-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">ราคาขายรวม</label>
                      <input 
                        type="number" 
                        inputMode="decimal" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && saveProductDirectly()}
                        placeholder="0.00" 
                        className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-blue-100 font-black text-lg focus:border-blue-300 focus:bg-white" 
                      />
                    </div>
                  </div>
                  <button onClick={saveProductDirectly} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all hover:bg-blue-700">บันทึกข้อมูล</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'settings' && (
          <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <h2 className="text-3xl font-black text-slate-900">ตั้งค่า Google Sheets</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase">Web App URL</label>
                  <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border outline-none font-mono text-xs" />
                </div>
                <button onClick={handleSaveUrl} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg">💾 บันทึกการเชื่อมต่อ</button>
              </div>
            </div>
          </div>
        )}

        {view === 'ice-debt' && (
           <div className="animate-fadeIn max-w-2xl mx-auto">
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
             <div className="flex items-center gap-4">
               <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">⬅️</button>
               <h2 className="text-2xl font-black text-slate-900">น้ำแข็งค้าง</h2>
             </div>
             <div className="space-y-6">
               <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                 <p className="text-blue-600 text-xs font-black uppercase mb-1">ค้างสะสมเดิม (แก้ไขได้)</p>
                 <input 
                   type="number" 
                   inputMode="decimal"
                   value={manualPrevDebt === '' ? currentIceDebt : manualPrevDebt} 
                   onChange={(e) => setManualPrevDebt(e.target.value)}
                   className="text-4xl font-black text-blue-900 bg-transparent border-b-2 border-blue-200 outline-none w-full focus:border-blue-500"
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-black mb-2 uppercase">ส่งเพิ่ม (+)</label>
                   <input type="number" value={deliveredBags} onChange={(e) => setDeliveredBags(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-black" />
                 </div>
                 <div>
                   <label className="block text-sm font-black mb-2 uppercase">เก็บคืน (-)</label>
                   <input type="number" value={collectedBags} onChange={(e) => setCollectedBags(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-black" />
                 </div>
               </div>
               <button onClick={handleIceDebtSave} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl">บันทึกยอดถุง</button>
             </div>
           </div>
         </div>
        )}

        {view === 'customer-debt' && (
           <div className="animate-fadeIn max-w-2xl mx-auto space-y-6">
           <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
             <div className="flex items-center gap-4">
               <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">⬅️</button>
               <h2 className="text-2xl font-black text-slate-900">บันทึกคนค้าง</h2>
             </div>
             <div className="space-y-6">
               <input value={debtCustName} onChange={(e) => setDebtCustName(e.target.value)} placeholder="ชื่อลูกค้า" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-bold" />
               <input value={debtItemName} onChange={(e) => setDebtItemName(e.target.value)} placeholder="สินค้า" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-bold" />
               <div className="grid grid-cols-2 gap-4">
                 <input type="number" value={debtQty} onChange={(e) => setDebtQty(e.target.value)} placeholder="จำนวน" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-black" />
                 <input type="number" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} placeholder="ยอดเงิน" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-black" />
               </div>
               <button onClick={handleAddCustomerDebt} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl">บันทึกรายการ</button>
             </div>
           </div>
         </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-10 z-40 flex justify-around items-end shadow-lg">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">📊</span><span className="text-[10px] font-bold uppercase">สรุปยอด</span>
        </button>
        <button onClick={() => setView('peek-stats')} className={`flex flex-col items-center gap-1 ${view === 'peek-stats' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">🔍</span><span className="text-[10px] font-bold uppercase">ส่องยอด</span>
        </button>
        <div className="relative -mt-10">
          <button onClick={() => { setView('entry'); setStep('category'); }} className="bg-blue-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-4xl border-[6px] border-white active:scale-90 transition-all font-light">+</button>
        </div>
        <button onClick={() => setView('customer-debt')} className={`flex flex-col items-center gap-1 ${view === 'customer-debt' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">👤</span><span className="text-[10px] font-bold uppercase">คนค้าง</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">⚙️</span><span className="text-[10px] font-bold uppercase">ตั้งค่า</span>
        </button>
      </nav>
    </div>
  );
};

export default App;