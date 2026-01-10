// Version: 1.0.1 - Fixed React 18 Compatibility & Time-based Summary
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
  
  // ใช้ String เพื่อให้พิมพ์และลบตัวเลขได้ง่าย
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
      const canPush = window.location.protocol.startsWith('http') && 
                      !window.location.origin.includes('usercontent.goog') &&
                      !window.location.origin.includes('localhost:0');

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
    try {
      const saved = localStorage.getItem('shop_entries');
      const savedIce = localStorage.getItem('ice_debt_entries');
      const savedCust = localStorage.getItem('customer_debt_entries');
      if (saved) setEntries(JSON.parse(saved));
      if (savedIce) setIceDebtEntries(JSON.parse(savedIce));
      if (savedCust) setCustomerDebtEntries(JSON.parse(savedCust));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('shop_entries', JSON.stringify(entries));
      localStorage.setItem('ice_debt_entries', JSON.stringify(iceDebtEntries));
      localStorage.setItem('customer_debt_entries', JSON.stringify(customerDebtEntries));
    } catch (e) {}
  }, [entries, iceDebtEntries, customerDebtEntries]);

  // คำนวณยอดค้างล่าสุดเพื่อใช้เป็นค่าเริ่มต้น
  const currentIceDebt = iceDebtEntries.length > 0 ? iceDebtEntries[0].currentDebt : 0;

  useEffect(() => {
    if (view === 'ice-debt') {
      setManualPrevDebt(currentIceDebt.toString());
    }
  }, [view, currentIceDebt]);

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
    if (!sheetUrl.includes('/exec')) {
      alert('⚠️ URL ต้องลงท้ายด้วย /exec');
      return;
    }
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
    const prev = parseFloat(manualPrevDebt) || 0;
    const del = parseFloat(deliveredBags) || 0;
    const col = parseFloat(collectedBags) || 0;
    const currentDebtValue = prev + del - col;
    
    const newIceEntry: IceDebtEntry = {
      id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString(),
      previousDebt: prev, deliveredBags: del, collectedBags: col, currentDebt: currentDebtValue,
      note: iceNote, isSynced: false
    };
    setIceDebtEntries(prevArr => [newIceEntry, ...prevArr]);
    setDeliveredBags(''); setCollectedBags(''); setIceNote('');
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
      quantity: parseFloat(debtQty) || 0,
      amount: parseFloat(debtAmount) || 0,
      isSynced: false
    };
    setCustomerDebtEntries(prev => [newEntry, ...prev]);
    setDebtCustName(''); setDebtItemName(''); setDebtQty(''); setDebtAmount('');
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
      const payload = { 
        products: unsyncedEntries, 
        iceDebt: unsyncedIce, 
        customerDebt: unsyncedCust 
      };
      
      await fetch(sheetUrl, { 
        method: 'POST', 
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify(payload) 
      });
      
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

  const gasCode = `
// Google Apps Script v1.0.1
function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (data.products && data.products.length > 0) {
    var sheet = ss.getSheetByName("Products") || ss.insertSheet("Products");
    if (sheet.getLastRow() == 0) {
      sheet.appendRow(["วันที่", "หมวดหมู่", "ชื่อสินค้า", "จำนวน", "ยอดเงินรวม", "ID"]);
    }
    data.products.forEach(function(p) {
      sheet.appendRow([new Date(p.timestamp), p.category, p.productName, p.quantity, p.totalPrice, p.id]);
    });
    // เรียกใช้ฟังก์ชันสรุปยอดแบบละเอียดแยกตามชื่อสินค้าและช่วงเวลา
    updateTimeBasedSummary(ss);
  }

  if (data.iceDebt && data.iceDebt.length > 0) {
    var iceSheet = ss.getSheetByName("IceDebt") || ss.insertSheet("IceDebt");
    if (iceSheet.getLastRow() == 0) {
      iceSheet.appendRow(["วันที่", "ยอดเดิม", "ส่งเพิ่ม", "เก็บคืน", "ยอดค้างสุทธิ", "หมายเหตุ"]);
    }
    data.iceDebt.forEach(function(i) {
      iceSheet.appendRow([new Date(i.timestamp), i.previousDebt, i.deliveredBags, i.collectedBags, i.currentDebt, i.note]);
    });
  }

  if (data.customerDebt && data.customerDebt.length > 0) {
    var custSheet = ss.getSheetByName("CustomerDebt") || ss.insertSheet("CustomerDebt");
    if (custSheet.getLastRow() == 0) {
      custSheet.appendRow(["วันที่", "ชื่อลูกค้า", "สินค้า", "จำนวน", "ยอดเงิน", "ID"]);
    }
    data.customerDebt.forEach(function(c) {
      custSheet.appendRow([new Date(c.timestamp), c.customerName, c.itemName, c.quantity, c.amount, c.id]);
    });
  }

  return ContentService.createTextOutput("Success");
}

function updateTimeBasedSummary(ss) {
  var summarySheet = ss.getSheetByName("Summary") || ss.insertSheet("Summary");
  summarySheet.clear();
  
  var sourceSheet = ss.getSheetByName("Products");
  if (!sourceSheet) return;
  var data = sourceSheet.getDataRange().getValues();
  if (data.length <= 1) return;

  var now = new Date();
  var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  var yearStart = new Date(now.getFullYear(), 0, 1);

  var periods = [
    { title: "📊 สรุปยอดรายวัน (วันนี้)", start: todayStart },
    { title: "📊 สรุปยอดรายสัปดาห์ (7 วันล่าสุด)", start: weekStart },
    { title: "📊 สรุปยอดรายเดือน (เดือนนี้)", start: monthStart },
    { title: "📊 สรุปยอดรายปี (ปีนี้)", start: yearStart }
  ];

  summarySheet.appendRow(["รายงานสรุปยอดขายแยกรายสินค้าตามช่วงเวลา"]);
  summarySheet.getRange("A1").setFontWeight("bold").setFontSize(18).setFontColor("#1E293B");
  summarySheet.appendRow(["อัปเดตล่าสุด: " + Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm")]);
  summarySheet.appendRow([""]);

  periods.forEach(function(period) {
    var items = {};
    var totalQty = 0;
    var totalAmt = 0;

    for (var i = 1; i < data.length; i++) {
      var rowDate = new Date(data[i][0]);
      if (rowDate >= period.start) {
        var productName = data[i][2]; // ชื่อสินค้า (เช่น เบียร์ช้าง)
        var qty = Number(data[i][3]) || 0;
        var amt = Number(data[i][4]) || 0;
        
        if (!items[productName]) items[productName] = { qty: 0, amt: 0 };
        items[productName].qty += qty;
        items[productName].amt += amt;
        
        totalQty += qty;
        totalAmt += amt;
      }
    }
    
    // พิมพ์หัวข้อช่วงเวลา
    summarySheet.appendRow([period.title]);
    summarySheet.getRange(summarySheet.getLastRow(), 1, 1, 3).setFontWeight("bold").setFontSize(14).setBackground("#F1F5F9");
    
    // พิมพ์หัวตาราง
    summarySheet.appendRow(["ชื่อสินค้า", "จำนวนรวม", "ยอดเงินรวม (บาท)"]);
    summarySheet.getRange(summarySheet.getLastRow(), 1, 1, 3).setBackground("#4A90E2").setFontColor("white").setFontWeight("bold");
    
    var sortedNames = Object.keys(items).sort();
    if (sortedNames.length === 0) {
      summarySheet.appendRow(["-- ไม่มีรายการสินค้าในช่วงเวลานี้ --", 0, 0]);
    } else {
      sortedNames.forEach(function(name) {
        summarySheet.appendRow([name, items[name].qty, items[name].amt]);
      });
    }
    
    // พิมพ์ยอดรวมสุทธิของช่วงเวลานี้
    summarySheet.appendRow(["ยอดรวมสุทธิ (" + period.title.split(" ")[1] + ")", totalQty, totalAmt]);
    var footerRange = summarySheet.getRange(summarySheet.getLastRow(), 1, 1, 3);
    footerRange.setBackground("#E2E8F0").setFontWeight("bold");
    
    summarySheet.appendRow([""]); // เว้นบรรทัดระหว่างช่วงเวลา
  });
  
  summarySheet.autoResizeColumns(1, 3);
}
  `;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 lg:pb-8 text-slate-900 font-['Kanit']">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
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
            <button onClick={() => setView('settings')} className="text-slate-400 hover:bg-slate-100 w-10 h-10 flex items-center justify-center rounded-full transition-colors">⚙️</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {view === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <h2 className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-1">DASHBOARD OVERVIEW</h2>
                  <p className="text-2xl font-bold">ระบบบันทึกยอดร้านค้าอัจฉริยะ</p>
                  <div className="flex gap-2 mt-4 relative z-10">
                    <button onClick={() => setView('customer-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors">👤 จัดการคนค้าง</button>
                    <button onClick={() => setView('ice-debt')} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors">🧊 จัดการถุงค้าง</button>
                  </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col justify-center items-center text-center">
                <span className="text-slate-400 text-sm font-bold mb-2">🧊 ถุงน้ำแข็งค้าง</span>
                <span className="text-5xl font-black text-slate-900">{currentIceDebt.toLocaleString()}</span>
                <button onClick={() => setView('ice-debt')} className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors">อัปเดตยอดถุง</button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(categorySummary).map(([cat, data]) => (
                <div key={cat} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                  <span className="text-[10px] text-slate-500 font-bold text-center h-8 flex items-center">{cat}</span>
                  <span className="text-sm font-black text-blue-600">฿{data.amount.toLocaleString()}</span>
                </div>
              ))}
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
                  <button onClick={() => setStep('category')} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">⬅️</button>
                  <h2 className="text-2xl font-black text-slate-900">{selectedCategory}</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-3 uppercase">ชื่อสินค้า</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedCategory && PRODUCTS_BY_CATEGORY[selectedCategory]?.map(name => (
                        <button key={name} onClick={() => setProductName(name)} 
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${productName === name ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{name}</button>
                      ))}
                    </div>
                    <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="ระบุชื่อสินค้า..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold focus:border-blue-300 transition-colors" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">จำนวน (หน่วย)</label>
                      <input type="number" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-lg focus:border-blue-300 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-slate-700 mb-2">รวมเงิน (พิมพ์ราคาได้เลย)</label>
                      <input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black text-lg focus:border-blue-300 transition-colors border-2 border-blue-100 shadow-inner" />
                    </div>
                  </div>
                  <button onClick={saveProductDirectly} disabled={!productName || !quantity} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg disabled:opacity-30 hover:bg-blue-700 active:scale-[0.98] transition-all">บันทึกข้อมูล</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'settings' && (
          <div className="animate-slideUp max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl space-y-8">
              <h2 className="text-3xl font-black text-slate-900">ตั้งค่าระบบ Google Sheets</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase">Google Sheets Web App URL</label>
                  <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-mono text-xs focus:border-blue-300" />
                </div>
                <button onClick={handleSaveUrl} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:bg-slate-800 transition-all">💾 บันทึก URL</button>
              </div>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2rem] text-white">
              <h3 className="font-bold mb-2">Google Apps Script (คัดลอกโค้ดนี้ไปวางที่ Extensions > Apps Script):</h3>
              <pre className="text-[10px] overflow-auto max-h-80 bg-slate-800 p-4 rounded-xl">{gasCode}</pre>
              <button onClick={() => { navigator.clipboard.writeText(gasCode); alert('คัดลอกโค้ดแล้ว!'); }} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all">📋 คัดลอกโค้ด</button>
            </div>
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
                 <label className="block text-sm font-black text-blue-700 mb-2 uppercase">ยอดค้างเดิม (อ้างอิงล่าสุดอัตโนมัติ)</label>
                 <input 
                   type="number" 
                   inputMode="decimal"
                   value={manualPrevDebt} 
                   onChange={(e) => setManualPrevDebt(e.target.value)} 
                   className="w-full px-5 py-4 rounded-2xl bg-blue-50 border border-blue-100 outline-none font-black text-blue-900 focus:border-blue-300 transition-colors" 
                   placeholder="ระบุยอดค้างเดิม..."
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-black text-slate-700 mb-2 uppercase">ส่งเพิ่มวันนี้</label>
                   <input type="number" inputMode="decimal" value={deliveredBags} onChange={(e) => setDeliveredBags(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black" />
                 </div>
                 <div>
                   <label className="block text-sm font-black text-slate-700 mb-2 uppercase">เก็บคืนวันนี้</label>
                   <input type="number" inputMode="decimal" value={collectedBags} onChange={(e) => setCollectedBags(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-black" />
                 </div>
               </div>
               <div className="pt-4 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-4">
                   <span className="font-bold text-slate-500">ยอดค้างใหม่สุทธิ:</span>
                   <span className="text-2xl font-black text-slate-900">{(parseFloat(manualPrevDebt)||0) + (parseFloat(deliveredBags)||0) - (parseFloat(collectedBags)||0)} ถุง</span>
                 </div>
                 <button onClick={handleIceDebtSave} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-blue-700 transition-all">ยืนยันการบันทึก</button>
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
                   <input value={debtCustName} onChange={(e) => setDebtCustName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-300" />
                 </div>
                 <div>
                   <label className="block text-sm font-black text-slate-700 mb-2">สินค้าที่ค้าง</label>
                   <input value={debtItemName} onChange={(e) => setDebtItemName(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-300" />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-black text-slate-700 mb-2">จำนวน</label>
                   <input type="number" inputMode="decimal" value={debtQty} onChange={(e) => setDebtQty(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-300" />
                 </div>
                 <div>
                   <label className="block text-sm font-black text-slate-700 mb-2">ยอดเงิน</label>
                   <input type="number" inputMode="decimal" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-blue-300" />
                 </div>
               </div>
               <button onClick={handleAddCustomerDebt} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-lg hover:bg-slate-800 transition-all">บันทึกรายการ</button>
             </div>
           </div>
         </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 p-4 pb-10 z-40 flex justify-around items-end lg:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition-all ${view === 'dashboard' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">📊</span><span className="text-[10px] font-bold uppercase tracking-tighter">Dashboard</span>
        </button>
        <button onClick={() => setView('customer-debt')} className={`flex flex-col items-center gap-1 transition-all ${view === 'customer-debt' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">👤</span><span className="text-[10px] font-bold uppercase tracking-tighter">Debt</span>
        </button>
        <div className="relative -mt-10">
          <button onClick={() => { setView('entry'); setStep('category'); }} className="bg-blue-600 text-white w-20 h-20 rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.4)] flex items-center justify-center text-4xl border-[6px] border-white active:scale-90 transition-all font-light">+</button>
        </div>
        <button onClick={() => setView('ice-debt')} className={`flex flex-col items-center gap-1 transition-all ${view === 'ice-debt' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">🧊</span><span className="text-[10px] font-bold uppercase tracking-tighter">Ice</span>
        </button>
        <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 transition-all ${view === 'settings' ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
          <span className="text-2xl">⚙️</span><span className="text-[10px] font-bold uppercase tracking-tighter">Set</span>
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