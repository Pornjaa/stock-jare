import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { CATEGORIES_CONFIG, PRODUCTS_BY_CATEGORY } from './constants';
import { CategoryType, ProductEntry, IceDebtEntry, CustomerDebtEntry } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'entry' | 'ice-debt' | 'customer-debt' | 'settings'>('dashboard');
  const [step, setStep] = useState<'category' | 'details'>('category');
  const [entries, setEntries] = useState<ProductEntry[]>([]);
  const [iceDebtEntries, setIceDebtEntries] = useState<IceDebtEntry[]>([]);
  const [customerDebtEntries, setCustomerDebtEntries] = useState<CustomerDebtEntry[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [sheetUrl, setSheetUrl] = useState<string>(localStorage.getItem('shoptrack_url') || '');
  
  // Form State
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  
  // Ice Debt State
  const [deliveredBags, setDeliveredBags] = useState<number>(0);
  const [collectedBags, setCollectedBags] = useState<number>(0);
  const [iceNote, setIceNote] = useState('');
  const [manualPrevDebt, setManualPrevDebt] = useState<number>(0);

  // Customer Debt State
  const [debtCustName, setDebtCustName] = useState('');
  const [debtItemName, setDebtItemName] = useState('');
  const [debtQty, setDebtQty] = useState<number>(0);
  const [debtAmount, setDebtAmount] = useState<number>(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shop_entries');
      const savedIce = localStorage.getItem('ice_debt_entries');
      const savedCust = localStorage.getItem('customer_debt_entries');
      if (saved) setEntries(JSON.parse(saved));
      if (savedIce) setIceDebtEntries(JSON.parse(savedIce));
      if (savedCust) setCustomerDebtEntries(JSON.parse(savedCust));
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('shop_entries', JSON.stringify(entries));
    localStorage.setItem('ice_debt_entries', JSON.stringify(iceDebtEntries));
    localStorage.setItem('customer_debt_entries', JSON.stringify(customerDebtEntries));
  }, [entries, iceDebtEntries, customerDebtEntries]);

  const currentIceDebt = iceDebtEntries.length > 0 ? iceDebtEntries[0].currentDebt : 0;

  useEffect(() => {
    if (view === 'ice-debt') {
      setManualPrevDebt(currentIceDebt);
    }
  }, [view, currentIceDebt]);

  const handleSaveUrl = () => {
    if (!sheetUrl.includes('/exec')) {
      alert('⚠️ URL ต้องลงท้ายด้วย /exec');
      return;
    }
    localStorage.setItem('shoptrack_url', sheetUrl);
    alert('บันทึก URL สำเร็จ!');
  };

  const saveProductDirectly = () => {
    if (!selectedCategory || !productName || quantity <= 0) return;
    const newEntry: ProductEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      category: selectedCategory,
      productName,
      quantity,
      totalPrice: price,
      isSynced: false
    };
    setEntries(prev => [newEntry, ...prev]);
    setProductName(''); setQuantity(0); setPrice(0);
    setStep('category');
    setSelectedCategory(null);
    setView('dashboard');
  };

  const handleIceDebtSave = () => {
    const currentDebtValue = manualPrevDebt + deliveredBags - collectedBags;
    const newIceEntry: IceDebtEntry = {
      id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(),
      previousDebt: manualPrevDebt, deliveredBags, collectedBags, currentDebt: currentDebtValue,
      note: iceNote, isSynced: false
    };
    setIceDebtEntries(prev => [newIceEntry, ...prev]);
    setDeliveredBags(0); setCollectedBags(0); setIceNote('');
    setView('dashboard');
    alert('✅ บันทึกยอดถุงน้ำแข็งค้างสำเร็จ!');
  };

  const handleAddCustomerDebt = () => {
    if (!debtCustName || !debtItemName) return;
    const newEntry: CustomerDebtEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      customerName: debtCustName,
      itemName: debtItemName,
      quantity: debtQty,
      amount: debtAmount,
      isSynced: false
    };
    setCustomerDebtEntries(prev => [newEntry, ...prev]);
    setDebtCustName(''); setDebtItemName(''); setDebtQty(0); setDebtAmount(0);
    alert('✅ บันทึกรายการคนค้างสำเร็จ!');
  };

  const syncToGoogleSheets = async () => {
    if (!sheetUrl) {
      alert('⚠️ กรุณาตั้งค่า URL ในหน้า Settings');
      setView('settings');
      return;
    }
    const unsyncedEntries = entries.filter(e => !e.isSynced);
    const unsyncedIce = iceDebtEntries.filter(e => !e.isSynced);
    const unsyncedCust = customerDebtEntries.filter(e => !e.isSynced);
    if (unsyncedEntries.length === 0 && unsyncedIce.length === 0 && unsyncedCust.length === 0) {
      alert('ไม่มีข้อมูลใหม่ที่ยังไม่ได้ส่ง');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { products: unsyncedEntries, iceDebt: unsyncedIce, customerDebt: unsyncedCust };
      await fetch(sheetUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
      setEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      setIceDebtEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      setCustomerDebtEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      alert('🚀 ส่งข้อมูลเรียบร้อยแล้ว!');
    } catch (error) {
      alert('❌ ผิดพลาด: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unsyncedCount = entries.filter(e => !e.isSynced).length + 
                        iceDebtEntries.filter(e => !e.isSynced).length +
                        customerDebtEntries.filter(e => !e.isSynced).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 lg:pb-8 text-slate-900 font-['Kanit']">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('dashboard')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">ShopTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={syncToGoogleSheets} disabled={isSubmitting || unsyncedCount === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${unsyncedCount > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {isSubmitting ? '⌛...' : '📋 ' + (unsyncedCount > 0 ? `ส่ง (${unsyncedCount})` : 'ข้อมูลล่าสุด')}
            </button>
            <button onClick={() => setView('settings')} className="text-slate-400 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full">⚙️</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl flex flex-col justify-center">
                  <h2 className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1">DASHBOARD</h2>
                  <p className="text-2xl font-bold">ระบบบันทึกยอดร้านค้า</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setView('customer-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors">👤 จัดการคนค้าง</button>
                    <button onClick={() => setView('ice-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors">🧊 จัดการถุงค้าง</button>
                  </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-center items-center text-center">
                <span className="text-slate-400 text-sm font-bold mb-2">🧊 ถุงน้ำแข็งค้าง</span>
                <span className="text-5xl font-black text-slate-900">{currentIceDebt.toLocaleString()}</span>
                <button onClick={() => setView('ice-debt')} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">อัปเดตยอดถุง</button>
              </div>
            </div>
            <Dashboard entries={entries} />
          </div>
        )}

        {view === 'entry' && (
          <div className="animate-slideUp max-w-4xl mx-auto">
            {step === 'category' ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900">เลือกประเภทสินค้า</h2>
                  <p className="text-slate-500">แตะเพื่อเลือกหมวดหมู่ที่ต้องการลงข้อมูล</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {CATEGORIES_CONFIG.map((cat) => (
                    <button key={cat.type} onClick={() => { setSelectedCategory(cat.type); setStep('details'); }}
                      className="group bg-white rounded-[2rem] border border-slate-100 hover:border-blue-300 hover:shadow-2xl transition-all overflow-hidden flex flex-col items-center">
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
                          className={`px-4 py-2 rounded-xl text-xs font-bold border ${productName === name ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500'}`}>{name}</button>
                      ))}
                    </div>
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="ระบุชื่อสินค้า..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">จำนวน (หน่วย)</label>
                      <input type="number" value={quantity || ''} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">รวมเงิน (บาท)</label>
                      <input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-lg" />
                    </div>
                  </div>
                  <button onClick={saveProductDirectly} disabled={!productName || quantity <= 0} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg disabled:opacity-30">บันทึกข้อมูล</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'ice-debt' && (
          <div className="animate-slideUp max-w-2xl mx-auto">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">⬅️</button>
                <h2 className="text-2xl font-black text-slate-900">จัดการถุงน้ำแข็งค้าง</h2>
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-blue-600 text-xs font-black uppercase mb-1">ยอดค้างปัจจุบันจากระบบ</p>
                  <p className="text-3xl font-black text-blue-900">{currentIceDebt} ถุง</p>
                </div>
                
                <div className="pt-2">
                  <label className="block text-sm font-black text-blue-700 mb-2 uppercase">แก้ไขยอดค้างเดิม (หากต้องการแก้ตัวเลขค้างเก่า)</label>
                  <input 
                    type="number" 
                    value={manualPrevDebt} 
                    onChange={(e) => setManualPrevDebt(Number(e.target.value))} 
                    className="w-full px-5 py-4 rounded-2xl bg-blue-50 border border-blue-100 outline-none font-black text-blue-900" 
                    placeholder="ระบุยอดค้างเดิม..."
                  />
                  <p className="text-[10px] text-blue-400 mt-1">* เปลี่ยนตัวเลขนี้หากต้องการเริ่มนับยอดค้างใหม่</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 uppercase">ส่งเพิ่มวันนี้</label>
                    <input type="number" value={deliveredBags || ''} onChange={(e) => setDeliveredBags(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 uppercase">เก็บคืนวันนี้</label>
                    <input type="number" value={collectedBags || ''} onChange={(e) => setCollectedBags(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">หมายเหตุ</label>
                  <input value={iceNote} onChange={(e) => setIceNote(e.target.value)} placeholder="เช่น ส่งล่วงหน้า..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-slate-500">ยอดค้างใหม่สุทธิ:</span>
                    <span className="text-2xl font-black text-slate-900">{manualPrevDebt + deliveredBags - collectedBags} ถุง</span>
                  </div>
                  <button onClick={handleIceDebtSave} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg">ยืนยันการบันทึก</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'customer-debt' && (
          <div className="animate-slideUp max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">⬅️</button>
                <h2 className="text-2xl font-black text-slate-900">บันทึกคนค้าง</h2>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">ชื่อลูกค้า</label>
                    <input value={debtCustName} onChange={(e) => setDebtCustName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">สินค้าที่ค้าง</label>
                    <input value={debtItemName} onChange={(e) => setDebtItemName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">จำนวน</label>
                    <input type="number" value={debtQty || ''} onChange={(e) => setDebtQty(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">ยอดเงิน</label>
                    <input type="number" value={debtAmount || ''} onChange={(e) => setDebtAmount(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" />
                  </div>
                </div>
                <button onClick={handleAddCustomerDebt} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-lg">บันทึกรายการ</button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
              <h3 className="text-lg font-black mb-4">รายการค้างปัจจุบัน</h3>
              <div className="space-y-3">
                {customerDebtEntries.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">ไม่มีรายการค้าง</p>
                ) : (
                  customerDebtEntries.map(debt => (
                    <div key={debt.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-slate-900">{debt.customerName}</p>
                        <p className="text-xs text-slate-500">{debt.itemName} ({debt.quantity})</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-red-600">฿{debt.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-slate-400">{new Date(debt.timestamp).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="animate-slideUp max-w-2xl mx-auto">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <h2 className="text-3xl font-black text-slate-900">ตั้งค่าการเชื่อมต่อ</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase">Google Sheets Web App URL</label>
                  <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-mono text-xs" />
                </div>
                <button onClick={handleSaveUrl} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg">💾 บันทึก URL</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 pb-10 z-40 flex justify-around items-end lg:hidden">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-2xl">📊</span><span className="text-[10px] font-bold">แดชบอร์ด</span>
        </button>
        <button onClick={() => setView('customer-debt')} className={`flex flex-col items-center gap-1 ${view === 'customer-debt' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-2xl">👤</span><span className="text-[10px] font-bold">คนค้าง</span>
        </button>
        <div className="relative -mt-10">
          <button onClick={() => { setView('entry'); setStep('category'); }} className="bg-blue-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-4xl border-[6px] border-white active:scale-90 transition-all">+</button>
        </div>
        <button onClick={() => setView('ice-debt')} className={`flex flex-col items-center gap-1 ${view === 'ice-debt' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-2xl">🧊</span><span className="text-[10px] font-bold">ถุงค้าง</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 ${view === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className="text-2xl">⚙️</span><span className="text-[10px] font-bold">ตั้งค่า</span>
        </button>
      </nav>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;