
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
  const [isUrlSaved, setIsUrlSaved] = useState(!!localStorage.getItem('shoptrack_url'));
  
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

  // Load Data from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('shop_entries');
    const savedIce = localStorage.getItem('ice_debt_entries');
    const savedCust = localStorage.getItem('customer_debt_entries');
    if (saved) setEntries(JSON.parse(saved));
    if (savedIce) setIceDebtEntries(JSON.parse(savedIce));
    if (savedCust) setCustomerDebtEntries(JSON.parse(savedCust));
  }, []);

  // Sync with LocalStorage on Change
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
      alert('⚠️ URL ต้องลงท้ายด้วย /exec (Web App URL จาก Google Apps Script)');
      return;
    }
    localStorage.setItem('shoptrack_url', sheetUrl);
    setIsUrlSaved(true);
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
    alert('✅ บันทึกรายการสำเร็จ!');
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

  const deleteCustomerDebt = (id: string) => {
    if (window.confirm('ยืนยันการลบรายการค้างนี้?')) {
      setCustomerDebtEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  const syncToGoogleSheets = async () => {
    if (!sheetUrl) {
      alert('⚠️ กรุณาตั้งค่า URL ในหน้า Settings ก่อนครับ');
      setView('settings');
      return;
    }

    const unsyncedEntries = entries.filter(e => !e.isSynced);
    const unsyncedIce = iceDebtEntries.filter(e => !e.isSynced);
    const unsyncedCust = customerDebtEntries.filter(e => !e.isSynced);
    
    if (unsyncedEntries.length === 0 && unsyncedIce.length === 0 && unsyncedCust.length === 0) {
      alert('ไม่มีข้อมูลใหม่ที่ยังไม่ได้ส่งครับ');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { 
        products: unsyncedEntries, 
        iceDebt: unsyncedIce,
        customerDebt: unsyncedCust
      };
      
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      setEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      setIceDebtEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      setCustomerDebtEntries(prev => prev.map(e => ({ ...e, isSynced: true })));
      alert('🚀 ส่งข้อมูลเข้า Google Sheets เรียบร้อยแล้ว!');
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
            <button 
              onClick={syncToGoogleSheets}
              disabled={isSubmitting || unsyncedCount === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-md ${
                unsyncedCount > 0 
                ? 'bg-amber-500 text-white animate-pulse hover:bg-amber-600' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}
            >
              {isSubmitting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : '📋'}
              {unsyncedCount > 0 ? `ส่งเข้าชีต (${unsyncedCount})` : 'ข้อมูลล่าสุดแล้ว'}
            </button>
            <button onClick={() => setView('settings')} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${!isUrlSaved ? 'bg-red-50 text-red-500 animate-bounce' : 'text-slate-400 hover:bg-slate-100'}`}>⚙️</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl flex flex-col justify-center">
                  <h2 className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1">ยินดีต้อนรับกลับมา</h2>
                  <p className="text-2xl font-bold leading-relaxed">ระบบบันทึกยอดร้านค้าพร้อมใช้งานแล้ว</p>
                  <p className="text-slate-400 text-sm mt-2">บันทึกข้อมูลวันนี้เพื่อดูสรุปยอดที่แม่นยำ</p>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-center items-center text-center">
                <span className="text-slate-400 text-sm font-bold uppercase mb-2">🧊 ถุงน้ำแข็งค้าง</span>
                <span className="text-5xl font-black text-slate-900">{currentIceDebt.toLocaleString()}</span>
                <button onClick={() => setView('ice-debt')} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">จัดการยอดค้าง</button>
              </div>
            </div>
            <Dashboard entries={entries} />
          </div>
        )}

        {view === 'entry' && (
          <div className="animate-slideUp max-w-2xl mx-auto">
            {step === 'category' ? (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-3xl font-black text-slate-900">ลงรายการสินค้า</h2>
                  <p className="text-slate-500 font-medium italic">เลือกหมวดหมู่ที่ต้องการบันทึก</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CATEGORIES_CONFIG.map((cat) => (
                    <button key={cat.type} onClick={() => { setSelectedCategory(cat.type); setStep('details'); }}
                      className="group bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all flex flex-col items-center gap-4">
                      <div className="text-6xl group-hover:scale-110 transition-transform">{cat.icon}</div>
                      <span className="font-bold text-slate-800">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl space-y-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setStep('category')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">⬅️</button>
                  <h2 className="text-2xl font-black text-slate-900">{selectedCategory}</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-3 uppercase tracking-wider">ชื่อสินค้า</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedCategory && PRODUCTS_BY_CATEGORY[selectedCategory]?.map(name => (
                        <button key={name} onClick={() => setProductName(name)} 
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${productName === name ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{name}</button>
                      ))}
                    </div>
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="ระบุชื่อสินค้า..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">จำนวน</label>
                      <input type="number" value={quantity || ''} onChange={(e) => setQuantity(Number(e.target.value))} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-lg text-slate-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">รวมเงิน (บาท)</label>
                      <input type="number" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-lg text-slate-900" />
                    </div>
                  </div>
                  <button onClick={saveProductDirectly} disabled={!productName || quantity <= 0} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg active:scale-95 disabled:opacity-30 transition-all">บันทึกรายการสินค้า 🚀</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'ice-debt' && (
          <div className="animate-slideUp max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">📊</button>
                <h2 className="text-3xl font-black text-slate-900">จัดการยอดถุงน้ำแข็งค้าง</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
                  <div className="text-[10px] text-blue-500 font-black mb-1 uppercase tracking-widest">ยอดค้างเดิม</div>
                  <input type="number" value={manualPrevDebt} onChange={(e) => setManualPrevDebt(Number(e.target.value))} className="w-full bg-transparent text-3xl font-black text-blue-900 text-center outline-none" />
                </div>
                <div className="bg-slate-900 p-6 rounded-3xl text-center text-white">
                  <div className="text-[10px] text-blue-400 font-black mb-1 uppercase tracking-widest">ยอดค้างสุทธิ</div>
                  <div className="text-3xl font-black text-white">{manualPrevDebt + deliveredBags - collectedBags}</div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">ลงเพิ่ม (ถุง)</label>
                    <input type="number" value={deliveredBags || ''} onChange={(e) => setDeliveredBags(Number(e.target.value))} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-xl text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">เก็บไป (ถุง)</label>
                    <input type="number" value={collectedBags || ''} onChange={(e) => setCollectedBags(Number(e.target.value))} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-xl text-slate-900" />
                  </div>
                </div>
                <input type="text" value={iceNote} onChange={(e) => setIceNote(e.target.value)} placeholder="หมายเหตุ..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none" />
                <button onClick={handleIceDebtSave} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg active:scale-95 transition-all">บันทึกยอดถุงค้าง</button>
              </div>
            </div>
          </div>
        )}

        {view === 'customer-debt' && (
          <div className="animate-slideUp max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('dashboard')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full">📊</button>
                <h2 className="text-3xl font-black text-slate-900">บันทึกคนค้าง</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">ชื่อลูกค้า</label>
                  <input value={debtCustName} onChange={(e) => setDebtCustName(e.target.value)} placeholder="ระบุชื่อลูกค้า..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-slate-900 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">ของที่ค้าง</label>
                  <input value={debtItemName} onChange={(e) => setDebtItemName(e.target.value)} placeholder="ระบุสินค้าที่ค้าง..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none text-slate-900 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">จำนวน</label>
                    <input type="number" value={debtQty || ''} onChange={(e) => setDebtQty(Number(e.target.value))} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2">ยอดเงิน (บาท)</label>
                    <input type="number" value={debtAmount || ''} onChange={(e) => setDebtAmount(Number(e.target.value))} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-xl" />
                  </div>
                </div>
                <button onClick={handleAddCustomerDebt} disabled={!debtCustName || !debtItemName} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg active:scale-95 disabled:opacity-30">บันทึกคนค้าง</button>
              </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl flex flex-col h-full">
              <h3 className="text-white text-xl font-black mb-6">รายชื่อคนค้าง ({customerDebtEntries.length})</h3>
              <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px]">
                {customerDebtEntries.length === 0 ? (
                  <div className="text-slate-500 text-center py-20 italic">ยังไม่มีข้อมูลคนค้างจ่าย</div>
                ) : (
                  customerDebtEntries.map((item) => (
                    <div key={item.id} className="bg-white/10 p-5 rounded-2xl flex justify-between items-center">
                      <div className="text-white">
                        <div className="font-black text-lg">{item.customerName}</div>
                        <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">{item.itemName}</div>
                        <div className="text-sm opacity-80">{item.quantity} • ฿{item.amount.toLocaleString()}</div>
                      </div>
                      <button onClick={() => deleteCustomerDebt(item.id)} className="w-10 h-10 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">🗑️</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div className="animate-slideUp max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <h2 className="text-3xl font-black text-slate-900">ตั้งค่าระบบ</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">Web App URL (Google Sheets)</label>
                  <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-mono text-xs text-slate-900" />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium leading-relaxed italic">
                    * ต้องใช้ URL ที่ได้จากการ Deploy เป็น Web App ใน Google Apps Script เพื่อส่งข้อมูลลงชีตได้จริง
                  </p>
                </div>
                <button onClick={handleSaveUrl} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg active:scale-95 transition-all">💾 บันทึกการตั้งค่า</button>
              </div>
            </div>
            
            <div className="bg-emerald-600 text-white p-10 rounded-[2.5rem] shadow-2xl space-y-4">
              <h3 className="font-black text-xl">📄 วิธีการ Deploy:</h3>
              <ol className="text-sm space-y-2 opacity-90 list-decimal pl-5">
                <li>เปิด Google Sheets ของคุณ</li>
                <li>ไปที่ Extensions > Apps Script</li>
                <li>วางโค้ดที่ให้ไปในรอบก่อนหน้าลงไป</li>
                <li>กด Deploy > New Deployment > เลือก Web App</li>
                <li>ตั้งค่า 'Who has access' เป็น 'Anyone'</li>
                <li>ก๊อปปี้ URL มาวางในช่องด้านบนนี้</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-4 pb-10 z-40 lg:hidden flex justify-around items-end shadow-2xl">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">📊</span><span className="text-[10px] font-bold">สรุป</span>
        </button>
        <button onClick={() => setView('ice-debt')} className={`flex flex-col items-center gap-1 transition-all ${view === 'ice-debt' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">🧊</span><span className="text-[10px] font-bold">ถุงค้าง</span>
        </button>
        <div className="relative -mt-10">
          <button onClick={() => { setView('entry'); setStep('category'); }} className="bg-blue-600 text-white w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-4xl border-[6px] border-white active:scale-90 transition-all">+</button>
        </div>
        <button onClick={() => setView('customer-debt')} className={`flex flex-col items-center gap-1 transition-all ${view === 'customer-debt' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">👥</span><span className="text-[10px] font-bold">คนค้าง</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">⚙️</span><span className="text-[10px] font-bold">ตั้งค่า</span>
        </button>
      </nav>

      <div className="hidden lg:flex fixed top-1/2 -translate-y-1/2 left-8 flex-col gap-6 z-40">
        <button onClick={() => setView('dashboard')} title="สรุปผล" className={`p-5 rounded-3xl shadow-xl transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}><div className="text-2xl">📊</div></button>
        <button onClick={() => setView('ice-debt')} title="ถุงค้าง" className={`p-5 rounded-3xl shadow-xl transition-all ${view === 'ice-debt' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}><div className="text-2xl">🧊</div></button>
        <button onClick={() => setView('customer-debt')} title="คนค้าง" className={`p-5 rounded-3xl shadow-xl transition-all ${view === 'customer-debt' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}><div className="text-2xl">👥</div></button>
        <button onClick={() => { setView('entry'); setStep('category'); }} title="เพิ่มสินค้า" className={`p-5 rounded-3xl shadow-xl transition-all ${view === 'entry' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}><div className="text-2xl">➕</div></button>
        <button onClick={() => setView('settings')} title="ตั้งค่า" className={`p-5 rounded-3xl shadow-xl transition-all ${view === 'settings' ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-white text-slate-400 hover:bg-slate-50'}`}><div className="text-2xl">⚙️</div></button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;