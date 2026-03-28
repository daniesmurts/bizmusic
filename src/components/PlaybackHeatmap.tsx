import React from "react";
import { HeatMapGrid } from "react-grid-heatmap";

interface PlaybackHeatmapProps {
  data: Array<{ day_of_week: number; hour_of_day: number; play_count: number }>;
}

const days = [
  "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"
];
const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);

function buildMatrix(data: PlaybackHeatmapProps["data"]) {
  // PostgreSQL DOW: 0=Sunday, 1=Monday, ..., 6=Saturday
  // We want: 0=Monday, ..., 6=Sunday (ru-RU)
  const matrix = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxVal = 0;
  data.forEach((row) => {
    const dow = Number(row.day_of_week);
    const hour = Number(row.hour_of_day);
    const count = Number(row.play_count);
    // Map Postgres DOW (0=Sun) to ru-RU (0=Mon, 6=Sun)
    const ruDay = dow === 0 ? 6 : dow - 1;
    if (ruDay >= 0 && ruDay < 7 && hour >= 0 && hour < 24) {
      matrix[ruDay][hour] = count;
      if (count > maxVal) maxVal = count;
    }
  });
  return { matrix, maxVal };
}

export const PlaybackHeatmap: React.FC<PlaybackHeatmapProps> = ({ data }) => {
  const { matrix, maxVal } = buildMatrix(data);
  return (
    <div className="w-full min-h-[340px] overflow-x-auto">
      <HeatMapGrid
        data={matrix}
        xLabels={hours}
        yLabels={days}
        cellHeight="36px"
        square={false}
        cellStyle={(_x, _y, value) => {
          const ratio = maxVal > 0 ? value / maxVal : 0;
          return {
            background: value > 0
              ? `rgba(52, 211, 153, ${Math.max(ratio * 0.9, 0.15)})`
              : "rgba(255, 255, 255, 0.03)",
            color: ratio > 0.5 ? "#fff" : "#666",
            fontWeight: 700,
            borderRadius: 4,
            fontSize: "11px",
            transition: "background 0.3s ease",
          };
        }}
        cellRender={(_x, _y, value) => (value > 0 ? String(value) : "")}
        xLabelsStyle={() => ({
          fontSize: "10px",
          color: "#888",
          paddingBottom: "6px",
        })}
        yLabelsStyle={() => ({
          fontSize: "12px",
          color: "#fff",
          fontWeight: 700,
          paddingRight: "8px",
          lineHeight: "36px",
        })}
      />
    </div>
  );
};
