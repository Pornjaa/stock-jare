// ShopTrack Version: 1.1.5 (Netlify Ready + Editable Ice Debt)
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
      return 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  };

  const [view, setView] = useState<'dashboard' | 'entry' | 'ice-debt' | 'customer-debt' | 'settings'>(getPageFromPath());
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

  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const saved = localStorage.getItem('shop_entries');
    const savedIce = localStorage.getItem('ice_debt_entries');
    const savedCust = localStorage.getItem('customer_debt_entries');
    if (saved) setEntries(JSON.parse(saved));
    if (savedIce) setIceDebtEntries(JSON.parse(savedIce));
    if (savedCust) setCustomerDebtEntries(JSON.parse(savedCust));
  }, []);

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

  const handleSaveUrl = () => {
    localStorage.setItem('shoptrack_url', sheetUrl);
    alert('บันทึก URL สำเร็จ!');
  };

  const saveProductDirectly = () => {
    const qtyVal = parseFloat(quantity) || 0;
    const priceVal = parseFloat(price) || 0;
    if (!selectedCategory || !productName || qtyVal <= 0) return;
    const newEntry: ProductEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      category: selectedCategory,
      productName,
      quantity: qtyVal,
      totalPrice: priceVal,
      isSynced: false
    };
    setEntries(prev => [newEntry, ...prev]);
    setProductName(''); setQuantity(''); setPrice('');
    setStep('category');
    setSelectedCategory(null);
    setView('dashboard');
  };

  const handleIceDebtSave = () => {
    const del = parseFloat(deliveredBags) || 0;
    const col = parseFloat(collectedBags) || 0;
    // ใช้ยอดค้างสะสมจาก manualPrevDebt ถ้ามีการแก้ไข ถ้าไม่มีใช้ค่าล่าสุดจากระบบ
    const prev = manualPrevDebt !== '' ? (parseFloat(manualPrevDebt) || 0) : currentIceDebt;
    
    const newIceEntry: IceDebtEntry = {
      id: Math.random().toString(36).substr(2, 9), 
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
    if (!debtCustName || !debtItemName) return;
    const newEntry: CustomerDebtEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      customerName: debtCustName,
      itemName: debtItemName,
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

      <main className="max-w-5xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <h2 className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1">OVERVIEW</h2>
                  <p className="text-2xl font-bold">บันทึกยอดขายวันนี้</p>
                  <div className="flex gap-2 mt-4 relative z-10">
                    <button onClick={() => setView('customer-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">👤 คนค้าง</button>
                    <button onClick={() => setView('ice-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold">🧊 ถุงน้ำแข็ง</button>
                  </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-center items-center text-center">
                <span className="text-slate-400 text-sm font-bold mb-1 uppercase tracking-tighter">ถุงน้ำแข็งค้างสะสม</span>
                <span className="text-5xl font-black text-blue-600">{currentIceDebt.toLocaleString()}</span>
                <button onClick={() => setView('ice-debt')} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">อัปเดตยอดถุง</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(categorySummary).map(([cat, data]) => (
                <div key={cat} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 font-bold text-center h-8 flex items-center leading-none">{cat}</span>
                  <span className="text-sm font-black text-blue-600">฿{data.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <Dashboard entries={entries} />
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
                          className={`px-4 py-2 rounded-xl text-xs font-bold border ${productName === name ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-500'}`}>{name}</button>
                      ))}
                    </div>
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="พิมพ์ชื่อสินค้า..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border outline-none font-bold focus:border-blue-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">จำนวน</label>
                      <input type="number" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border font-black text-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">ราคาขายรวม</label>
                      <input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-blue-100 font-black text-lg" />
                    </div>
                  </div>
                  <button onClick={saveProductDirectly} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">บันทึกข้อมูล</button>
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
        <button onClick={() => setView('customer-debt')} className={`flex flex-col items-center gap-1 ${view === 'customer-debt' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">👤</span><span className="text-[10px] font-bold uppercase">คนค้าง</span>
        </button>
        <div className="relative -mt-10">
          <button onClick={() => { setView('entry'); setStep('category'); }} className="bg-blue-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-4xl border-[6px] border-white active:scale-90 transition-all font-light">+</button>
        </div>
        <button onClick={() => setView('ice-debt')} className={`flex flex-col items-center gap-1 ${view === 'ice-debt' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">🧊</span><span className="text-[10px] font-bold uppercase">น้ำแข็ง</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">⚙️</span><span className="text-[10px] font-bold uppercase">ตั้งค่า</span>
        </button>
      </nav>
    </div>
  );
};

export default App;