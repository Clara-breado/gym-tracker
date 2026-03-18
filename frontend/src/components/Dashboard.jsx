import React, { useMemo, useState } from 'react';
import { Calendar, Trophy } from 'lucide-react';
import { t, getLang } from '../i18n';
import { bodyParts } from '../data';
import WeeklyCalendar from './WeeklyCalendar';
import BodyPartCard from './BodyPartCard';

function getWorkoutStats() {
  try {
    const log = JSON.parse(localStorage.getItem('workoutLog') || '[]');
    const total = log.length;

    // Count workouts this week (Mon–Sun)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const thisWeek = log.filter(({ date }) => {
      const d = new Date(date + 'T00:00:00');
      return d >= monday && d <= sunday;
    }).length;

    return { total, thisWeek };
  } catch {
    return { total: 0, thisWeek: 0 };
  }
}

function formatDate() {
  const d = new Date();
  return d.toLocaleDateString(getLang(), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function Dashboard({ onSelectBodyPart }) {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('APP_LANG');
    if (stored) return stored;
    const browserLang = navigator.language || 'en-US';
    return browserLang.startsWith('zh') ? 'zh-CN' : 'en-US';
  });

  const stats = useMemo(getWorkoutStats, [lang]);
  const dateStr = useMemo(formatDate, [lang]);

  const toggleLang = () => {
    const newLang = lang === 'en-US' ? 'zh-CN' : 'en-US';
    setLang(newLang);
    localStorage.setItem('APP_LANG', newLang);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] max-w-[430px] mx-auto">
      <div className="px-5 pt-[env(safe-area-inset-top,44px)] pb-24">
        {/* Header */}
        <div className="pt-4 pb-5 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {t('ready_to_train')}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{dateStr}</p>
          </div>
          <button
            onClick={toggleLang}
            className="mt-1 flex items-center bg-white/5 rounded-full text-xs font-medium overflow-hidden border border-white/10"
          >
            <span className={`px-2.5 py-1.5 transition-colors ${lang === 'en-US' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}>
              EN
            </span>
            <span className={`px-2.5 py-1.5 transition-colors ${lang === 'zh-CN' ? 'bg-purple-500 text-white' : 'text-gray-400'}`}>
              中文
            </span>
          </button>
        </div>

        {/* Weekly Calendar */}
        <div className="mb-5">
          <WeeklyCalendar />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
              <Calendar className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
              <p className="text-xs text-gray-400">{t('this_week')}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
              <Trophy className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">{t('total')}</p>
            </div>
          </div>
        </div>

        {/* Body Part Grid */}
        <div className="mb-2">
          <h2 className="text-lg font-semibold text-white mb-3">
            {t('choose_muscle_group')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {bodyParts.map((bp) => (
              <BodyPartCard
                key={bp.id}
                bodyPart={bp}
                onSelect={onSelectBodyPart}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
