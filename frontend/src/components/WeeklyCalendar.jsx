import React, { useMemo } from 'react';
import { t } from '../i18n';

function getDayNames() {
  return [t('day_mon'), t('day_tue'), t('day_wed'), t('day_thu'), t('day_fri'), t('day_sat'), t('day_sun')];
}

function getWeekDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dayName: getDayNames()[i],
      date: d.getDate(),
      fullDate: d.toISOString().split('T')[0], // YYYY-MM-DD
      isToday:
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear(),
    };
  });
}

function getWorkoutDates() {
  try {
    const log = JSON.parse(localStorage.getItem('workoutLog') || '[]');
    const dateMap = {};
    log.forEach(({ date, body_part }) => {
      if (!dateMap[date]) dateMap[date] = [];
      dateMap[date].push(body_part);
    });
    return dateMap;
  } catch {
    return {};
  }
}

export default function WeeklyCalendar() {
  const week = useMemo(getWeekDates, []);
  const workoutDates = useMemo(getWorkoutDates, []);

  return (
    <div className="relative -mx-1">
      {/* Hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto snap-x snap-mandatory px-1 py-1">
        {week.map((day) => {
          const hasWorkout = !!workoutDates[day.fullDate];

          return (
            <div
              key={day.fullDate}
              className={`
                snap-center flex flex-col items-center justify-center flex-shrink-0
                min-h-[44px] w-[52px] rounded-xl transition-transform
                ${
                  day.isToday
                    ? 'bg-purple-500 text-white scale-105 shadow-lg shadow-purple-500/30'
                    : 'bg-white/5 border border-white/10 text-gray-400'
                }
              `}
            >
              <span className="text-[10px] font-medium uppercase tracking-wide">
                {day.dayName}
              </span>
              <span
                className={`text-base font-bold ${
                  day.isToday ? 'text-white' : 'text-gray-200'
                }`}
              >
                {day.date}
              </span>
              {hasWorkout && (
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
