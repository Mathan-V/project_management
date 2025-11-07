// src/utils/timeCalculations.ts

/**
 * Parse time string (HH:MM:SS) to total seconds
 */
export const parseTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  return (
    parseInt(parts[0] || "0") * 3600 +
    parseInt(parts[1] || "0") * 60 +
    parseInt(parts[2] || "0")
  );
};

/**
 * Format seconds to HH:MM:SS string
 */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Calculate duration between two time strings (HH:MM)
 */
export const calculateDuration = (start: string, end: string): string => {
  const [startHour, startMin] = start.split(":").map(Number);
  const [endHour, endMin] = end.split(":").map(Number);
  
  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
};

/**
 * Format date as YYYY-MM-DD (using local timezone, not UTC)
 */
export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format date for display (e.g., "Mo, Oct 21")
 */
export const formatDisplayDate = (date: Date, dayIndex: number): string => {
  const dayNames = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  return `${dayNames[dayIndex]}, ${month} ${day}`;
};

/**
 * Get week dates starting from Monday
 */
export const getWeekDates = (startDate: Date): Date[] => {
  const dates = [];
  const start = new Date(startDate);
  
  // Find Monday of the week
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
};