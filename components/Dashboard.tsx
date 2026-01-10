
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { ProductEntry, CategoryType } from '../types';

interface DashboardProps {
  entries: ProductEntry[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#64748B'];

export const Dashboard: React.FC<DashboardProps> = ({ entries }) => {
  const categoryData = Object.values(CategoryType).map(cat => ({
    name: cat,
    amount: entries.filter(e => e.category === cat).reduce((sum, e) => sum + e.totalPrice, 0),
    quantity: entries.filter(e => e.category === cat).reduce((sum, e) => sum + e.quantity, 0),
  })).filter(d => d.amount > 0);

  const totalAmount = entries.reduce((sum, e) => sum + e.totalPrice, 0);
  const totalQuantity = entries.reduce((sum, e) => sum + e.quantity, 0);

  // Group by date for line chart
  const dailyData = entries.reduce((acc: any, curr) => {
    const date = new Date(curr.timestamp).toLocaleDateString('th-TH');
    acc[date] = (acc[date] || 0) + curr.totalPrice;
    return acc;
  }, {});

  const lineChartData = Object.entries(dailyData).map(([date, amount]) => ({ date, amount }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm mb-1 font-medium">ยอดเงินรวมทั้งหมด</span>
          <span className="text-4xl font-bold text-blue-600">฿{totalAmount.toLocaleString()}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
          <span className="text-slate-500 text-sm mb-1 font-medium">จำนวนสินค้าทั้งหมด</span>
          <span className="text-4xl font-bold text-emerald-600">{totalQuantity.toLocaleString()} หน่วย</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">ยอดขายแยกตามประเภท (บาท)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={12} tick={{ fill: '#64748b' }} />
              <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
              <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">สัดส่วนจำนวนสินค้า</h3>
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
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
        <h3 className="text-lg font-semibold mb-4 text-slate-800">แนวโน้มยอดขายรายวัน</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: '#64748b' }} />
            <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
