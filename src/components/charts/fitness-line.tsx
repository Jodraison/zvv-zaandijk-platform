"use client";

import { useId } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Pt = { label: string; sec: number };

export function FitnessLine({ data }: { data: Pt[] }) {
  const uid = useId().replace(/:/g, "");
  const lineId = `lineGlow-${uid}`;

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 14, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#c4b5fd" />
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
            dataKey="sec"
            tick={{ fill: "rgba(51,65,85,0.82)", fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={44}
            tickFormatter={(v) => `${Number(v).toFixed(1)}s`}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(6,8,14,0.94)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              color: "#fff",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
            formatter={(v: number) => [`${v.toFixed(2)} sec`, "Tijd"]}
          />
          <Line
            type="monotone"
            dataKey="sec"
            stroke={`url(#${lineId})`}
            strokeWidth={2.5}
            dot={{ r: 3.5, fill: "#e9d5ff", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#22d3ee", stroke: "rgba(255,255,255,0.4)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
