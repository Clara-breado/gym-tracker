import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, X, Flame, Loader2 } from 'lucide-react';
import { t } from '../i18n';
import { saveWorkout } from '../api';
import { bodyParts, defaultMeasurements } from '../data';
import ExerciseCard from './ExerciseCard';
import VoiceButton from './VoiceButton';

export default function ActiveWorkout({ plan, bodyPart, onFinish }) {
  const part = bodyParts.find((b) => b.id === bodyPart) || {};
  const exercises = plan.workout_plan || [];

  const [exerciseStates, setExerciseStates] = useState(() =>
    exercises.map((ex) => ({
      name: ex.exercise_name,
      actual_weight: ex.suggested_weight || '',
      actual_sets: 0,
      actual_reps: ex.target_reps,
      form_cues: '',
      completedSets: new Set(),
    }))
  );
  const [showWarmup, setShowWarmup] = useState(!!plan.warm_up_routine);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync exerciseStates when plan changes externally (e.g., exercise replacement)
  useEffect(() => {
    const newExercises = plan.workout_plan || [];
    setExerciseStates((prev) => {
      const prevByName = Object.fromEntries(prev.map((s) => [s.name, s]));
      const updated = newExercises.map((ex) => {
        const existing = prevByName[ex.exercise_name];
        if (existing) return existing;
        return {
          name: ex.exercise_name,
          actual_weight: ex.suggested_weight || '',
          actual_sets: 0,
          actual_reps: ex.target_reps,
          form_cues: '',
          completedSets: new Set(),
        };
      });
      // Only update if names actually changed to avoid unnecessary re-renders
      const prevNames = prev.map((s) => s.name).join(',');
      const newNames = updated.map((s) => s.name).join(',');
      if (prevNames === newNames) return prev;
      return updated;
    });
  }, [plan]);

  const handleExerciseUpdate= useCallback((index, data) => {
    setExerciseStates((prev) => {
      const next = [...prev];
      next[index] = data;
      return next;
    });
  }, []);

  // Progress calculation
  const totalSets = exercises.reduce(
    (sum, ex) => sum + (parseInt(ex.target_sets, 10) || 3),
    0
  );
  const completedSetsCount = exerciseStates.reduce(
    (sum, s) => sum + (s.completedSets?.size || 0),
    0
  );
  const progressPercent = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0;
  const doneExercises = exerciseStates.filter(
    (s) => s.completedSets?.size >= (parseInt(exercises.find((e) => e.exercise_name === s.name)?.target_sets, 10) || 3)
  ).length;

  const handleFinish = async () => {
    setSaving(true);
    try {
      let measurements;
      try {
        const saved = localStorage.getItem('measurements');
        measurements = saved ? JSON.parse(saved) : defaultMeasurements;
      } catch {
        measurements = defaultMeasurements;
      }

      const payload = {
        body_part: bodyPart,
        user_body_measurements: measurements,
        exercises: exerciseStates.map((s) => ({
          name: s.name,
          actual_weight: s.actual_weight,
          actual_sets: s.actual_sets,
          actual_reps: s.actual_reps,
          form_cues: s.form_cues,
        })),
        ai_summary: '',
      };

      await saveWorkout(payload);

      // Save to local workout log
      try {
        const log = JSON.parse(localStorage.getItem('workoutLog') || '[]');
        log.push({ date: new Date().toISOString().split('T')[0], body_part: bodyPart });
        localStorage.setItem('workoutLog', JSON.stringify(log));
      } catch {
        // Ignore localStorage errors
      }

      setSaved(true);
      setTimeout(() => onFinish(), 1200);
    } catch (err) {
      console.error('Failed to save workout:', err);
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="min-h-dvh bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold text-white">{t('workout_saved')}</h2>
          <p className="text-gray-400">{t('great_work')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#0f0f1a] pb-24">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#0f0f1a]/95 backdrop-blur-sm border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={onFinish}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold text-white capitalize">
            {part.emoji} {t(part.nameKey) || bodyPart} {t('workout')}
          </h1>
          <span className="text-sm text-gray-400">
            {doneExercises}/{exercises.length} {t('done')}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Warm-up card */}
        {showWarmup && plan.warm_up_routine && (
          <div className="bg-amber-500/10 rounded-2xl p-4 relative">
            <button
              onClick={() => setShowWarmup(false)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
            <div className="flex items-start gap-3">
              <Flame size={20} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-amber-300 font-semibold text-sm mb-1">
                  {t('warmup_routine')}
                </h3>
                <p className="text-amber-200/80 text-sm whitespace-pre-line">
                  {plan.warm_up_routine}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Exercise list */}
        {exercises.map((exercise, i) => (
          <ExerciseCard
            key={i}
            exercise={exercise}
            index={i}
            onUpdate={(data) => handleExerciseUpdate(i, data)}
          >
            <VoiceButton
              onTranscript={(text) => {
                setExerciseStates((prev) => {
                  const next = [...prev];
                  next[i] = {
                    ...next[i],
                    form_cues: next[i].form_cues
                      ? `${next[i].form_cues} ${text}`
                      : text,
                  };
                  return next;
                });
              }}
            />
          </ExerciseCard>
        ))}
      </div>

      {/* Finish button */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-[#0f0f1a] via-[#0f0f1a] to-transparent">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full max-w-lg mx-auto block h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white text-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={20} className="animate-spin" />
              {t('saving')}
            </span>
          ) : (
            t('finish_workout')
          )}
        </button>
      </div>
    </div>
  );
}
