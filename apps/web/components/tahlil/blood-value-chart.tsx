"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";

type TahlilValue = {
  name: string;
  value: number;
  unit?: string | null;
  referenceMin?: number | null;
  referenceMax?: number | null;
};
type TahlilRow = { testDate?: string | Date | null; values?: TahlilValue[] | null };

const dFmt = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" });

/**
 * Kan/laboratuvar değerlerinin zaman-trend grafiği. Birden çok tahlil kaydındaki
 * AYNI değer adı (örn. "Hemoglobin") tarih ekseninde çizilir; referans alt/üst
 * bir bant (ReferenceArea) olarak gösterilir. Veri katmanı tahlil.list'ten gelir.
 */
export function BloodValueChart({ records }: { records: TahlilRow[] }) {
  const valueNames = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) for (const v of r.values ?? []) set.add(v.name);
    return [...set];
  }, [records]);

  const [selected, setSelected] = useState("");
  useEffect(() => {
    if (valueNames.length > 0 && !valueNames.includes(selected)) setSelected(valueNames[0]!);
  }, [valueNames, selected]);

  const { data, refMin, refMax, unit } = useMemo(() => {
    const pts: { ts: number; label: string; value: number }[] = [];
    let rMin: number | undefined;
    let rMax: number | undefined;
    let u: string | undefined;
    for (const r of records) {
      const v = (r.values ?? []).find((x) => x.name === selected);
      if (!v || !r.testDate) continue;
      const ts = new Date(r.testDate).getTime();
      if (Number.isNaN(ts)) continue;
      pts.push({ ts, label: dFmt.format(new Date(ts)), value: v.value });
      if (v.referenceMin != null) rMin = v.referenceMin;
      if (v.referenceMax != null) rMax = v.referenceMax;
      if (v.unit) u = v.unit;
    }
    pts.sort((a, b) => a.ts - b.ts);
    return { data: pts, refMin: rMin, refMax: rMax, unit: u };
  }, [records, selected]);

  if (valueNames.length === 0) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <LineChartIcon className="size-4 text-primary" aria-hidden /> Değer trendi
        </h3>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Değer seç"
          className="h-9 rounded-[var(--radius)] border border-input bg-card px-2 text-xs text-foreground focus-visible:border-ring focus-visible:outline-none"
        >
          {valueNames.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      {data.length < 2 ? (
        <p className="py-8 text-center text-xs text-text-3">
          Trend için en az 2 ölçüm gerekir{unit ? ` (${unit})` : ""}.
        </p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(145 14% 88%)" />
              {refMin != null && refMax != null ? (
                <ReferenceArea
                  y1={refMin}
                  y2={refMax}
                  fill="hsl(150 46% 36%)"
                  fillOpacity={0.08}
                  stroke="hsl(150 46% 36%)"
                  strokeOpacity={0.25}
                  strokeDasharray="4 4"
                />
              ) : null}
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(150 12% 52%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(150 12% 52%)" }} width={44} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid hsl(145 14% 88%)",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v}${unit ? " " + unit : ""}`, selected]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#306a4f"
                strokeWidth={2}
                dot={{ r: 3, fill: "#306a4f" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {refMin != null && refMax != null ? (
        <p className="mt-2 text-center text-[11px] text-text-3">
          Referans aralığı: {refMin}–{refMax}
          {unit ? ` ${unit}` : ""}
        </p>
      ) : null}
    </div>
  );
}
