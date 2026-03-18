import { useState, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { t } from '../i18n';

export default function ExerciseCard({ exercise, index, onUpdate, children }) {
  const {
    exercise_name,
    target_sets,
    target_reps,
    suggested_weight,
    coach_tip,
  } = exercise;

  const numSets = parseInt(target_sets, 10) || 3;

  const [actualWeight, setActualWeight] = useState(suggested_weight || '');
  const [completedSets, setCompletedSets] = useState(new Set());
  const [formCues, setFormCues] = useState('');

  const emitUpdate = useCallback(
    (weight, sets, cues) => {
      onUpdate?.({
        name: exercise_name,
        actual_weight: weight,
        actual_sets: sets.size,
        actual_reps: target_reps,
        form_cues: cues,
        completedSets: new Set(sets),
      });
    },
    [exercise_name, target_reps, onUpdate]
  );

  useEffect(() => {
    emitUpdate(actualWeight, completedSets, formCues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actualWeight, completedSets, formCues]);

  const toggleSet = (setIndex) => {
    setCompletedSets((prev) => {
      const next = new Set(prev);
      if (next.has(setIndex)) {
        next.delete(setIndex);
      } else {
        next.add(setIndex);
      }
      return next;
    });
  };

  return (
    <div className="bg-white/5 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-purple-500/20 text-purple-400 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold">
          {index + 1}
        </div>
        <h3 className="font-semibold text-white text-base">{exercise_name}</h3>
      </div>

      {/* Target details */}
      <div className="flex flex-wrap gap-2">
        <span className="bg-white/10 rounded-full px-3 py-1 text-sm text-gray-300">
          {target_sets} × {target_reps}
        </span>
        {suggested_weight && (
          <span className="bg-white/10 rounded-full px-3 py-1 text-sm text-gray-300">
            {suggested_weight}
          </span>
        )}
      </div>

      {/* Coach tip */}
      {coach_tip && (
        <div className="bg-amber-500/10 border-l-2 border-amber-500 p-3 rounded-r-lg">
          <p className="text-amber-200 text-sm italic">{coach_tip}</p>
        </div>
      )}

      {/* Weight input */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">{t('actual_weight')}</label>
        <input
          type="text"
          inputMode="numeric"
          value={actualWeight}
          onChange={(e) => setActualWeight(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl h-11 w-full text-center text-lg text-white outline-none focus:border-purple-500/50 transition-colors"
        />
      </div>

      {/* Set checkboxes */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">{t('sets')}</label>
        <div className="flex gap-2 flex-wrap">
          {[...Array(numSets)].map((_, i) => {
            const done = completedSets.has(i);
            return (
              <button
                key={i}
                onClick={() => toggleSet(i)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/40'
                }`}
              >
                {done ? <Check size={18} /> : i + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form cues + optional voice button */}
      <div className="relative">
        <label className="block text-xs text-gray-400 mb-1">{t('form_notes')}</label>
        <div className="relative">
          <textarea
            value={formCues}
            onChange={(e) => setFormCues(e.target.value)}
            placeholder={t('form_notes_placeholder')}
            rows={2}
            className="bg-white/5 border border-white/10 rounded-xl p-3 pr-14 w-full text-white text-sm placeholder-white/30 outline-none focus:border-purple-500/50 transition-colors resize-none"
          />
          {/* Slot for VoiceButton */}
          {children && (
            <div className="absolute right-2 bottom-2">{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
