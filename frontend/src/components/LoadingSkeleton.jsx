import { t } from '../i18n';

export default function LoadingSkeleton() {
  return (
    <div className="space-y-4 py-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-white/5 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/10 rounded-lg w-8 h-8" />
            <div className="bg-white/10 rounded-full h-4 w-3/4" />
          </div>
          <div className="flex gap-2">
            <div className="bg-white/10 rounded-full h-4 w-1/2" />
            <div className="bg-white/10 rounded-full h-4 w-1/4" />
          </div>
          <div className="bg-white/10 rounded-full h-4 w-full" />
        </div>
      ))}

      <p className="text-center text-gray-400 italic text-sm pt-2">
        {t('ai_crafting')}
      </p>
    </div>
  );
}
