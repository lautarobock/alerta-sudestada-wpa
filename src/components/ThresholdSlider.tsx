"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface ThresholdSliderProps {
  min: number;
  max: number;
  step: number;
  values: {
    warning: number;
    alert: number;
    critical: number;
  };
  onChange: (values: { warning: number; alert: number; critical: number }) => void;
  labels: {
    warning: string;
    alert: string;
    critical: string;
  };
}

export default function ThresholdSlider({
  min,
  max,
  step,
  values,
  onChange,
  labels,
}: ThresholdSliderProps) {
  const [isDragging, setIsDragging] = useState<"warning" | "alert" | "critical" | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getPosition = useCallback(
    (value: number) => {
      return ((value - min) / (max - min)) * 100;
    },
    [min, max]
  );

  const getValueFromPosition = useCallback(
    (position: number) => {
      const value = min + (position / 100) * (max - min);
      return Math.round(value / step) * step;
    },
    [min, max, step]
  );

  const handleMouseDown = (type: "warning" | "alert" | "critical") => {
    setIsDragging(type);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newValue = getValueFromPosition(position);

      let newValues = { ...values };

      if (isDragging === "warning") {
        newValues.warning = Math.max(min, Math.min(newValue, values.alert - step));
      } else if (isDragging === "alert") {
        newValues.alert = Math.max(
          values.warning + step,
          Math.min(newValue, values.critical - step)
        );
      } else if (isDragging === "critical") {
        newValues.critical = Math.max(values.alert + step, Math.min(newValue, max));
      }

      onChange(newValues);
    },
    [isDragging, values, min, max, step, getValueFromPosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newValue = getValueFromPosition(position);

      let newValues = { ...values };

      if (isDragging === "warning") {
        newValues.warning = Math.max(min, Math.min(newValue, values.alert - step));
      } else if (isDragging === "alert") {
        newValues.alert = Math.max(
          values.warning + step,
          Math.min(newValue, values.critical - step)
        );
      } else if (isDragging === "critical") {
        newValues.critical = Math.max(values.alert + step, Math.min(newValue, max));
      }

      onChange(newValues);
    },
    [isDragging, values, min, max, step, getValueFromPosition]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  const warningPos = getPosition(values.warning);
  const alertPos = getPosition(values.alert);
  const criticalPos = getPosition(values.critical);

  const getColor = (type: "warning" | "alert" | "critical") => {
    switch (type) {
      case "warning":
        return "bg-yellow-500";
      case "alert":
        return "bg-orange-500";
      case "critical":
        return "bg-red-500";
    }
  };

  return (
    <div className="w-full py-8">
      <div
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
        style={{ touchAction: "none" }}
      >
        {/* Track segments */}
        <div
          className="absolute h-2 bg-green-400 rounded-l-full"
          style={{ width: `${warningPos}%` }}
        />
        <div
          className="absolute h-2 bg-yellow-400"
          style={{
            left: `${warningPos}%`,
            width: `${alertPos - warningPos}%`,
          }}
        />
        <div
          className="absolute h-2 bg-orange-400"
          style={{
            left: `${alertPos}%`,
            width: `${criticalPos - alertPos}%`,
          }}
        />
        <div
          className="absolute h-2 bg-red-400 rounded-r-full"
          style={{
            left: `${criticalPos}%`,
            width: `${100 - criticalPos}%`,
          }}
        />

        {/* Thumbs */}
        {(["warning", "alert", "critical"] as const).map((type) => {
          const pos = getPosition(values[type]);
          return (
            <div
              key={type}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2"
              style={{ left: `${pos}%` }}
            >
              <div
                className={`w-6 h-6 rounded-full ${getColor(type)} border-2 border-white shadow-lg cursor-grab active:cursor-grabbing transition-transform hover:scale-110`}
                onMouseDown={() => handleMouseDown(type)}
                onTouchStart={() => handleMouseDown(type)}
              />
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg">
                  <div className="font-semibold">{labels[type]}</div>
                  <div className="text-center font-mono">{values[type].toFixed(1)}m</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels at bottom */}
      <div className="flex justify-between mt-12 text-sm text-gray-600">
        <div className="text-left">
          <div className="font-semibold">Normal</div>
          <div className="text-xs">&lt; {values.warning.toFixed(1)}m</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Advertencia</div>
          <div className="text-xs">{values.warning.toFixed(1)}m - {values.alert.toFixed(1)}m</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">Alerta</div>
          <div className="text-xs">{values.alert.toFixed(1)}m - {values.critical.toFixed(1)}m</div>
        </div>
        <div className="text-right">
          <div className="font-semibold">Crítico</div>
          <div className="text-xs">≥ {values.critical.toFixed(1)}m</div>
        </div>
      </div>
    </div>
  );
}
