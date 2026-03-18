import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, SendHorizontal, RefreshCw, BookOpen, ExternalLink } from 'lucide-react';
import { t } from '../i18n';
import { chatWithAi, suggestAlternatives } from '../api';

function getQuickPrompts() {
  return [
    t('prompt_form_tips'),
    t('prompt_brace_core'),
    t('prompt_alternatives'),
    t('prompt_recovery'),
  ];
}

function BouncingDots() {
  return (
    <div className="flex space-x-1.5 items-center px-1 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function AlternativeCard({ alternative, onSelect }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
      <p className="text-white font-bold text-sm">{alternative.exercise_name}</p>
      <span className="inline-block bg-purple-500/20 text-purple-300 text-xs font-medium rounded-full px-2.5 py-0.5">
        {alternative.target_sets} × {alternative.target_reps}
      </span>
      {alternative.coach_tip && (
        <p className="text-gray-400 text-xs italic">{alternative.coach_tip}</p>
      )}
      <button
        onClick={onSelect}
        className="w-full min-h-[44px] rounded-lg bg-purple-500 text-white text-sm font-medium active:scale-95 transition-transform"
      >
        {t('select')}
      </button>
    </div>
  );
}

export default function AiAssistant({ workoutPlan, onUpdatePlan, currentView, selectedBodyPart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [replacingExercise, setReplacingExercise] = useState(null);
  const [activeExerciseMenu, setActiveExerciseMenu] = useState(null);
  const scrollRef = useRef(null);

  const isWorkoutView = currentView === 'workout' && workoutPlan?.workout_plan;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  async function handleReplace(exerciseName) {
    if (isLoading) return;

    setReplacingExercise(exerciseName);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `${t('finding_alternatives')} ${exerciseName}...`,
        type: 'text',
      },
    ]);
    setIsLoading(true);

    try {
      const { alternatives } = await suggestAlternatives(
        exerciseName,
        selectedBodyPart,
        '',
        workoutPlan.workout_plan,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'alternatives',
          originalExercise: exerciseName,
          alternatives,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('sorry_no_alternatives'), type: 'text' },
      ]);
      setReplacingExercise(null);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectAlternative(alternative) {
    const oldName = replacingExercise;
    onUpdatePlan(oldName, alternative);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `✅ ${t('replaced_with')} ${oldName} ${t('with')} ${alternative.exercise_name}!`,
        type: 'text',
      },
    ]);
    setReplacingExercise(null);
  }

  async function handleExplain(exerciseName) {
    if (isLoading) return;
    setActiveExerciseMenu(null);

    const userContent = `${t('how_to_perform')} ${exerciseName} ${t('with_proper_form')}`;
    const userMsg = { role: 'user', content: userContent, type: 'text' };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const chatMessages = [
        ...messages.filter((m) => m.type !== 'alternatives' && m.type !== 'explanation'),
        userMsg,
      ];
      const { reply } = await chatWithAi(chatMessages);
      const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(exerciseName + ' exercise form tutorial')}`;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'explanation',
          content: reply,
          youtubeUrl,
          exerciseName,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('sorry_no_explain'), type: 'text' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSend(text) {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    // Detect "replace <exercise>" patterns
    const replaceMatch = content.match(/^replace\s+(.+)$/i);
    if (replaceMatch && isWorkoutView) {
      const target = replaceMatch[1].trim();
      const match = workoutPlan.workout_plan.find(
        (ex) => ex.exercise_name.toLowerCase() === target.toLowerCase(),
      );
      if (match) {
        setMessages((prev) => [...prev, { role: 'user', content, type: 'text' }]);
        setInput('');
        await handleReplace(match.exercise_name);
        return;
      }
    }

    const userMsg = { role: 'user', content, type: 'text' };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setIsLoading(true);

    try {
      const textOnly = updated.filter((m) => m.type !== 'alternatives');
      const { reply } = await chatWithAi(textOnly);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, type: 'text' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: t('sorry_trouble'), type: 'text' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-90 transition-transform"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
      </button>

      {/* Bottom Sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[#1a1a2e] rounded-t-3xl max-h-[75vh] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="mx-auto w-10 h-1 rounded-full bg-white/20 absolute left-1/2 -translate-x-1/2 top-2" />
              <h2 className="text-lg font-semibold text-white pt-2">{t('ai_coach')}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Chat Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Exercise Swap Pills (workout view with plan) */}
              {isWorkoutView && (
                <div className="space-y-2 pb-2">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {workoutPlan.workout_plan.map((ex) => (
                      <button
                        key={ex.exercise_name}
                        onClick={() => setActiveExerciseMenu((prev) => prev === ex.exercise_name ? null : ex.exercise_name)}
                        className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs whitespace-nowrap active:scale-95 transition-all ${
                          activeExerciseMenu === ex.exercise_name
                            ? 'bg-purple-500/30 border-purple-400/50 text-purple-200'
                            : 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        {ex.exercise_name}
                      </button>
                    ))}
                  </div>

                  {/* Action Menu */}
                  {activeExerciseMenu && (
                    <div className="flex gap-2 pl-1 animate-fade-in">
                      <button
                        onClick={() => { setActiveExerciseMenu(null); handleReplace(activeExerciseMenu); }}
                        className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 rounded-lg px-3 py-2 text-xs text-orange-300 hover:bg-orange-500/25 active:scale-95 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        {t('replace')}
                      </button>
                      <button
                        onClick={() => handleExplain(activeExerciseMenu)}
                        className="flex items-center gap-1.5 bg-blue-500/15 border border-blue-500/30 rounded-lg px-3 py-2 text-xs text-blue-300 hover:bg-blue-500/25 active:scale-95 transition-all"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        {t('explain')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Prompts (non-workout view or no plan) */}
              {messages.length === 0 && !isWorkoutView && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {getQuickPrompts().map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="bg-white/5 rounded-full px-4 py-2 text-sm text-gray-300 whitespace-nowrap hover:bg-white/10 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((msg, i) =>
                msg.type === 'alternatives' ? (
                  <div key={i} className="mr-auto max-w-[85%] space-y-2">
                    {msg.alternatives.map((alt) => (
                      <AlternativeCard
                        key={alt.exercise_name}
                        alternative={alt}
                        onSelect={() => handleSelectAlternative(alt)}
                      />
                    ))}
                  </div>
                ) : msg.type === 'explanation' ? (
                  <div key={i} className="mr-auto max-w-[85%] space-y-2">
                    <div className="bg-white/5 rounded-2xl rounded-bl-sm p-3 text-sm text-gray-200">
                      {msg.content}
                    </div>
                    <a
                      href={msg.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300 hover:bg-red-500/25 active:scale-[0.98] transition-all"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0" />
                      <span>{t('watch_on_youtube')} <span className="font-medium text-red-200">{msg.exerciseName}</span></span>
                    </a>
                  </div>
                ) : (
                  <div
                    key={i}
                    className={
                      msg.role === 'user'
                        ? 'ml-auto max-w-[80%] bg-purple-500/20 rounded-2xl rounded-br-sm p-3 text-sm text-white'
                        : 'mr-auto max-w-[80%] bg-white/5 rounded-2xl rounded-bl-sm p-3 text-sm text-gray-200'
                    }
                  >
                    {msg.content}
                  </div>
                ),
              )}

              {isLoading && (
                <div className="mr-auto max-w-[80%] bg-white/5 rounded-2xl rounded-bl-sm p-3">
                  <BouncingDots />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-white/10 p-3 bg-[#1a1a2e] flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('ask_ai_coach')}
                className="flex-1 bg-white/5 rounded-xl h-11 px-4 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-purple-500/50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center disabled:opacity-40 transition-opacity"
              >
                <SendHorizontal className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-up animation */}
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
