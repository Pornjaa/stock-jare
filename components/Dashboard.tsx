import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { ProductEntry, CategoryType } from '../types.ts';

interface DashboardProps {
  entries: ProductEntry[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

type TimeFilter = 'day' | 'week' | 'month' | 'year' | 'all';

export const Dashboard: React.FC<DashboardProps> = ({ entries }) => {
  const [filter, setFilter] = useState<TimeFilter>('all');

  // กรองข้อมูลตามช่วงเวลา (ใช้ตรรกะแบบเดียวกับ App.tsx เพื่อความแม่นยำ)
  const filteredEntries = useMemo(() => {
    const now = new Date();
    
    // กำหนดวันที่ปัจจุบันแบบแยกหน่วย
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();
    
    const weekStart = new Date(todayYear, todayMonth, todayDate);
    weekStart.setDate(weekStart.getDate() - 6);
    
    return entries.filter(entry => {
      const d = new Date(entry.timestamp);
      
      if (filter === 'day') {
        // เฉพาะวันนี้เท่านั้น (เปรียบเทียบ ปี-เดือน-วัน ตรงกัน)
        return d.getFullYear() === todayYear && 
               d.getMonth() === todayMonth && 
               d.getDate() === todayDate;
      }
      if (filter === 'week') {
        // 7 วันล่าสุดรวมวันนี้
        return d >= weekStart;
      }
      if (filter === 'month') {
        // เฉพาะเดือนนี้
        return d.getMonth() === todayMonth && d.getFullYear() === todayYear;
      }
      if (filter === 'year') {
        // เฉพาะปีนี้
        return d.getFullYear() === todayYear;
      }
      return true;
    });
  }, [entries, filter]);

  // สรุปยอดตามหมวดหมู่
  const categoryData = useMemo(() => {
    return Object.values(CategoryType).map(cat => ({
      name: cat,
      amount: filteredEntries.filter(e => e.category === cat).reduce((sum, e) => sum + e.totalPrice, 0),
      quantity: filteredEntries.filter(e => e.category === cat).reduce((sum, e) => sum + e.quantity, 0),
    })).filter(d => d.amount > 0 || d.quantity > 0);
  }, [filteredEntries]);

  // สรุปยอดรายตัวสินค้า (Product Item Summary)
  const productSummary = useMemo(() => {
    const summaryMap: Record<string, { quantity: number; amount: number; category: string }> = {};
    
    filteredEntries.forEach(entry => {
      if (!summaryMap[entry.productName]) {
        summaryMap[entry.productName] = { quantity: 0, amount: 0, category: entry.category };
      }
      summaryMap[entry.productName].quantity += entry.quantity;
      summaryMap[entry.productName].amount += entry.totalPrice;
    });

    return Object.entries(summaryMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredEntries]);

  const totalAmount = filteredEntries.reduce((sum, e) => sum + e.totalPrice, 0);
  const totalQuantity = filteredEntries.reduce((sum, e) => sum + e.quantity, 0);

  // ข้อมูลกราฟเส้นรายวัน
  const dailyData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filteredEntries.forEach(curr => {
      const date = new Date(curr.timestamp).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' });
      dataMap[date] = (dataMap[date] || 0) + curr.totalPrice;
    });
    return Object.entries(dataMap).map(([date, amount]) => ({ date, amount }));
  }, [filteredEntries]);

  return (
    <div className="space-y-6">
      {/* ส่วนเลือกตัวกรองเวลา */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'day', label: 'วันนี้' },
            { id: 'week', label: '7 วันล่าสุด' },
            { id: 'month', label: 'เดือนนี้' },
            { id: 'year', label: 'ปีนี้' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as TimeFilter)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                filter === t.id 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
          ช่วงเวลาที่แสดง: {filter === 'all' ? 'ข้อมูลทั้งหมด' : filter}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm mb-1 font-medium">ยอดเงินรวมในช่วงนี้</span>
          <span className="text-4xl font-bold text-blue-600">฿{totalAmount.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm mb-1 font-medium">จำนวนสินค้าทั้งหมดในช่วงนี้</span>
          <span className="text-4xl font-bold text-emerald-600">{totalQuantity.toLocaleString()} หน่วย</span>
        </div>
      </div>

      {/* ตารางสรุปรายตัวสินค้า */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">สรุปยอดรวมแยกตามรายชื่อสินค้า</h3>
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
            {productSummary.length} รายการ
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                <th className="px-6 py-4">ชื่อสินค้า</th>
                <th className="px-6 py-4">หมวดหมู่</th>
                <th className="px-6 py-4 text-right">จำนวนรวม</th>
                <th className="px-6 py-4 text-right">ยอดเงินรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productSummary.length > 0 ? (
                productSummary.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{item.category}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">{item.quantity.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900">฿{item.amount.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">-- ไม่มีข้อมูลในช่วงเวลานี้ --</td>
                </tr>
              )}
            </tbody>
            {productSummary.length > 0 && (
              <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td colSpan={2} className="px-6 py-4 font-bold text-sm">ยอดรวมสุทธิ</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-400">{totalQuantity.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-black text-blue-400">฿{totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-bold mb-4 text-slate-800 uppercase text-xs tracking-widest text-slate-400">สัดส่วนหมวดหมู่ (บาท)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} interval={0} />
              <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-bold mb-4 text-slate-800 uppercase text-xs tracking-widest text-slate-400">สัดส่วนจำนวนสินค้า</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="quantity"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
        <h3 className="text-lg font-bold mb-4 text-slate-800 uppercase text-xs tracking-widest text-slate-400">แนวโน้มยอดขาย</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" fontSize={10} tick={{ fill: '#64748b' }} />
            <YAxis fontSize={10} tick={{ fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};