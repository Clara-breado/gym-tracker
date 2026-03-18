import React from 'react';
import { t } from '../i18n';

export default function BodyPartCard({ bodyPart, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bodyPart.id)}
      className={`
        w-full min-h-[100px] rounded-2xl p-4
        bg-gradient-to-br ${bodyPart.gradient}
        flex flex-col justify-between
        active:scale-95 transition-transform duration-150
        hover:opacity-90
        shadow-lg shadow-black/20
        text-left
      `}
    >
      <span className="text-3xl leading-none">{bodyPart.emoji}</span>
      <span className="text-white font-semibold text-base mt-2">
        {t(bodyPart.nameKey)}
      </span>
    </button>
  );
}
