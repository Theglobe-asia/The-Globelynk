// src/app/report/charts.tsx
"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Charts({
  pie,
  line,
}: {
  pie: { basic: number; silver: number; gold: number };
  line: { date: string; value: number }[];
}) {
  const pieData = [
    { name: "Basic", value: pie.basic },
    { name: "Silver", value: pie.silver },
    { name: "Gold", value: pie.gold },
  ];

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      <div className="rounded-xl border p-4 h-80">
        <div className="text-sm mb-2">Members by Tier</div>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie dataKey="value" data={pieData} innerRadius={50} outerRadius={80} paddingAngle={2}>
              {pieData.map((_e, i) => (
                <Cell key={i} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl border p-4 h-80">
        <div className="text-sm mb-2">Emails sent per day (last 30 days)</div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={line}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" minTickGap={24} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
