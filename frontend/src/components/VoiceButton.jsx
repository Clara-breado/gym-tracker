import { useEffect } from 'react';
import { Mic } from 'lucide-react';
import { t } from '../i18n';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export default function VoiceButton({ onTranscript }) {
  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useSpeechRecognition();

  useEffect(() => {
    if (!isListening && transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [isListening, transcript, onTranscript, resetTranscript]);

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isListening && (
        <span className="text-xs text-red-400 animate-pulse">{t('listening')}</span>
      )}
      <button
        type="button"
        onClick={toggle}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
          isListening
            ? 'bg-red-500 animate-pulse'
            : 'bg-white/10 hover:bg-white/20'
        }`}
      >
        <Mic size={18} className={isListening ? 'text-white' : 'text-gray-400'} />
      </button>
    </div>
  );
}
