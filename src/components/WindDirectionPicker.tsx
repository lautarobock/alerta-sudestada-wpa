"use client";

import { WIND_DIRECTIONS } from "@/lib/windDirection";

interface WindDirectionPickerProps {
  directions: boolean[];
  onChange: (directions: boolean[]) => void;
  disabled?: boolean;
}

const CARDINALS: { label: string; index: number }[] = [
  { label: "N", index: 0 },
  { label: "E", index: 4 },
  { label: "S", index: 8 },
  { label: "O", index: 12 },
];

export default function WindDirectionPicker({
  directions,
  onChange,
  disabled = false,
}: WindDirectionPickerProps) {
  const toggle = (index: number) => {
    if (disabled) return;
    const next = [...directions];
    next[index] = !next[index];
    onChange(next);
  };

  const cx = 120;
  const cy = 120;
  const outerR = 88;
  const innerR = 26;
  const labelR = outerR + 22;
  const pad = 28;
  const vbSize = 240;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={vbSize}
        height={vbSize}
        viewBox={`${-pad} ${-pad} ${vbSize + pad * 2} ${vbSize + pad * 2}`}
        className="overflow-visible"
      >
        {WIND_DIRECTIONS.map((label, i) => {
          const startAngle = ((i * 22.5 - 90 - 11.25) * Math.PI) / 180;
          const endAngle = ((i * 22.5 - 90 + 11.25) * Math.PI) / 180;
          const x1 = cx + innerR * Math.cos(startAngle);
          const y1 = cy + innerR * Math.sin(startAngle);
          const x2 = cx + outerR * Math.cos(startAngle);
          const y2 = cy + outerR * Math.sin(startAngle);
          const x3 = cx + outerR * Math.cos(endAngle);
          const y3 = cy + outerR * Math.sin(endAngle);
          const x4 = cx + innerR * Math.cos(endAngle);
          const y4 = cy + innerR * Math.sin(endAngle);
          const isCardinal = i % 4 === 0;
          const active = directions[i];

          return (
            <g key={`sector-${i}`}>
              <path
                d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerR} ${outerR} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerR} ${innerR} 0 0 0 ${x1} ${y1}`}
                fill={active ? "#f59e0b" : "#e2e8f0"}
                stroke="#94a3b8"
                strokeWidth={1}
                className={disabled ? "cursor-not-allowed" : "cursor-pointer"}
                onClick={() => toggle(i)}
              />
              {!isCardinal && (
                <text
                  x={cx + labelR * Math.cos(((i * 22.5 - 90) * Math.PI) / 180)}
                  y={cy + labelR * Math.sin(((i * 22.5 - 90) * Math.PI) / 180)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={9}
                  fontWeight={500}
                  fill="#475569"
                  pointerEvents="none"
                >
                  {label}
                </text>
              )}
            </g>
          );
        })}

        {CARDINALS.map(({ label, index }) => {
          const angle = ((index * 22.5 - 90) * Math.PI) / 180;
          return (
            <text
              key={`cardinal-${label}`}
              x={cx + (labelR + 10) * Math.cos(angle)}
              y={cy + (labelR + 10) * Math.sin(angle)}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={14}
              fontWeight={700}
              fill="#1e40af"
              pointerEvents="none"
            >
              {label}
            </text>
          );
        })}

        <circle cx={cx} cy={cy} r={innerR - 2} fill="#fff" stroke="#cbd5e1" />
      </svg>
      <p className="text-xs text-gray-500 text-center max-w-xs">
        Tocá cada sector para incluir o excluir esa dirección de origen del viento.
      </p>
    </div>
  );
}
