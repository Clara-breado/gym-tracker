import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { t } from '../i18n';
import { generatePlan } from '../api';
import { bodyParts, defaultMeasurements } from '../data';
import LoadingSkeleton from './LoadingSkeleton';

export default function PreWorkoutModal({ bodyPart, onClose, onPlanGenerated }) {
  const part = bodyParts.find((b) => b.id === bodyPart) || {};
  const [specialRequest, setSpecialRequest] = useState('');
  const [measurements, setMeasurements] = useState(() => {
    try {
      const saved = localStorage.getItem('measurements');
      return saved ? JSON.parse(saved) : { ...defaultMeasurements };
    } catch {
      return { ...defaultMeasurements };
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const updateMeasurement = (key, value) => {
    const next = { ...measurements, [key]: value };
    setMeasurements(next);
    localStorage.setItem('measurements', JSON.stringify(next));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generatePlan(bodyPart, specialRequest, measurements);
      onPlanGenerated(result);
    } catch (err) {
      setError(err.message || t('error_try_again'));
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full max-w-lg bg-[#1a1a2e] rounded-t-3xl p-6 transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>{part.emoji}</span>
            <span>{t(part.nameKey)}</span>
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-5">
            {/* Special Requirements */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                {t('special_requirements')}
              </label>
              <input
                type="text"
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder={t('special_requirements_placeholder')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            {/* Body Measurements */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                {t('body_measurements')}
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">{t('height')}</label>
                  <input
                    type="text"
                    value={measurements.height}
                    onChange={(e) => updateMeasurement('height', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">{t('weight')}</label>
                  <input
                    type="text"
                    value={measurements.weight}
                    onChange={(e) => updateMeasurement('weight', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center outline-none focus:border-purple-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white text-lg hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {t('generate_ai_plan')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
