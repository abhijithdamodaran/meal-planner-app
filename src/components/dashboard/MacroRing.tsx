"use client";

interface Props {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
  ringColor: string; // tailwind text color for the stroke
}

export function MacroRing({ label, value, goal, unit, ringColor }: Props) {
  const pct = goal ? Math.min((value / goal) * 100, 100) : 0;
  const over = goal != null && value > goal;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-16 w-16">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="6" />
          {goal && (
            <circle
              cx="32"
              cy="32"
              r={radius}
              fill="none"
              stroke={over ? "#f87171" : undefined}
              className={over ? undefined : ringColor}
              strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-sm font-bold ${over ? "text-red-500" : "text-gray-900"}`}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="text-xs text-gray-400">
        {goal ? `/ ${goal} ${unit}` : unit}
      </p>
    </div>
  );
}
