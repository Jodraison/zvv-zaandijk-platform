"use client";

import { useId } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { label: string; pct: number };

export function AttendanceBar({ data }: { data: Row[] }) {
  const uid = useId().replace(/:/g, "");
  const gradId = `barGrad-${uid}`;

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 4, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity={0.95} />
              <stop offset="55%" stopColor="#8b5cf6" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#4c1d95" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(15,23,42,0.08)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(51,65,85,0.82)", fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            dy={6}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fill: "rgba(51,65,85,0.82)", fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(15,23,42,0.06)" }}
            contentStyle={{
              background: "rgba(6,8,14,0.94)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              color: "#fff",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
            formatter={(v: number) => [`${v}%`, "Opkomst"]}
          />
          <Bar dataKey="pct" fill={`url(#${gradId})`} radius={[12, 12, 6, 6]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
