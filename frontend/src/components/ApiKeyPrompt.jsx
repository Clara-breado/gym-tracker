import { useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { t } from '../i18n';

export default function ApiKeyPrompt({ onSave }) {
  const [key, setKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) onSave(key.trim());
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-[#0f0f1a] to-[#1a1a2e] flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm text-center space-y-8">
        <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('welcome')}</h1>
          <p className="text-gray-400 text-sm">{t('enter_api_key')}</p>
        </div>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t('your_api_key')}
          className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {t('get_started')} <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
