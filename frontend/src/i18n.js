const translations = {
  'en-US': {
    // Dashboard
    'ready_to_train': 'Ready to Train 💪',
    'this_week': 'This Week',
    'total': 'Total',
    'choose_muscle_group': 'Choose Muscle Group',

    // ApiKeyPrompt
    'welcome': 'Welcome to GymTracker AI',
    'enter_api_key': 'Enter your API key to get started',
    'your_api_key': 'Your API key',
    'get_started': 'Get Started',

    // PreWorkoutModal
    'special_requirements': 'Special Requirements',
    'special_requirements_placeholder': 'e.g., Focus on hip thrusts, Only 30 mins...',
    'body_measurements': 'Body Measurements',
    'height': 'Height',
    'weight': 'Weight',
    'generate_ai_plan': 'Generate AI Plan ✨',
    'error_try_again': 'Something went wrong. Please try again.',

    // ActiveWorkout
    'workout': 'Workout',
    'done': 'done',
    'warmup_routine': 'Warm-up Routine',
    'finish_workout': 'Finish Workout 🎉',
    'saving': 'Saving...',
    'workout_saved': 'Workout Saved!',
    'great_work': 'Great work today!',

    // ExerciseCard
    'actual_weight': 'Actual Weight',
    'sets': 'Sets',
    'form_notes': 'Form Notes',
    'form_notes_placeholder': 'How did this feel? Any form notes...',

    // AiAssistant
    'ai_coach': 'AI Coach 🤖',
    'ask_ai_coach': 'Ask your AI coach...',
    'replace': 'Replace',
    'explain': 'Explain',
    'select': 'Select',
    'watch_on_youtube': 'Watch on YouTube:',
    'finding_alternatives': 'Finding alternatives for',
    'sorry_no_alternatives': "Sorry, I couldn't find alternatives. Try again!",
    'replaced_with': 'Replaced',
    'with': 'with',
    'how_to_perform': 'How do I perform',
    'with_proper_form': 'with proper form?',
    'sorry_no_explain': "Sorry, I couldn't explain that exercise. Try again!",
    'sorry_trouble': 'Sorry, I had trouble responding. Try again!',
    'prompt_form_tips': 'Proper form tips?',
    'prompt_brace_core': 'How to brace core?',
    'prompt_alternatives': 'Alternative exercises?',
    'prompt_recovery': 'Recovery advice?',

    // WeeklyCalendar
    'day_mon': 'Mon',
    'day_tue': 'Tue',
    'day_wed': 'Wed',
    'day_thu': 'Thu',
    'day_fri': 'Fri',
    'day_sat': 'Sat',
    'day_sun': 'Sun',

    // VoiceButton
    'listening': 'Listening...',

    // LoadingSkeleton
    'ai_crafting': 'AI is crafting your perfect workout...',

    // Body parts
    'bp_glutes': 'Glutes',
    'bp_chest': 'Chest',
    'bp_back': 'Back',
    'bp_shoulders': 'Shoulders',
    'bp_arms': 'Arms',
    'bp_legs': 'Legs',
    'bp_core': 'Core',
  },
  'zh-CN': {
    // Dashboard
    'ready_to_train': '准备训练 💪',
    'this_week': '本周',
    'total': '总计',
    'choose_muscle_group': '选择肌肉群',

    // ApiKeyPrompt
    'welcome': '欢迎使用 GymTracker AI',
    'enter_api_key': '输入您的 API 密钥开始使用',
    'your_api_key': '您的 API 密钥',
    'get_started': '开始使用',

    // PreWorkoutModal
    'special_requirements': '特殊要求',
    'special_requirements_placeholder': '例如：专注臀推，只有30分钟...',
    'body_measurements': '身体数据',
    'height': '身高',
    'weight': '体重',
    'generate_ai_plan': '生成 AI 计划 ✨',
    'error_try_again': '出现错误，请重试。',

    // ActiveWorkout
    'workout': '训练',
    'done': '完成',
    'warmup_routine': '热身动作',
    'finish_workout': '完成训练 🎉',
    'saving': '保存中...',
    'workout_saved': '训练已保存！',
    'great_work': '今天表现很棒！',

    // ExerciseCard
    'actual_weight': '实际重量',
    'sets': '组数',
    'form_notes': '动作笔记',
    'form_notes_placeholder': '感觉如何？有什么动作要注意的...',

    // AiAssistant
    'ai_coach': 'AI 教练 🤖',
    'ask_ai_coach': '向 AI 教练提问...',
    'replace': '替换',
    'explain': '讲解',
    'select': '选择',
    'watch_on_youtube': '在 YouTube 观看：',
    'finding_alternatives': '正在查找替代动作：',
    'sorry_no_alternatives': '抱歉，未找到替代动作。请重试！',
    'replaced_with': '已将',
    'with': '替换为',
    'how_to_perform': '如何正确完成',
    'with_proper_form': '这个动作？',
    'sorry_no_explain': '抱歉，无法讲解该动作。请重试！',
    'sorry_trouble': '抱歉，回复出现问题。请重试！',
    'prompt_form_tips': '动作要领？',
    'prompt_brace_core': '如何收紧核心？',
    'prompt_alternatives': '替代动作？',
    'prompt_recovery': '恢复建议？',

    // WeeklyCalendar
    'day_mon': '周一',
    'day_tue': '周二',
    'day_wed': '周三',
    'day_thu': '周四',
    'day_fri': '周五',
    'day_sat': '周六',
    'day_sun': '周日',

    // VoiceButton
    'listening': '聆听中...',

    // LoadingSkeleton
    'ai_crafting': 'AI 正在为您定制完美训练计划...',

    // Body parts
    'bp_glutes': '臀部',
    'bp_chest': '胸部',
    'bp_back': '背部',
    'bp_shoulders': '肩部',
    'bp_arms': '手臂',
    'bp_legs': '腿部',
    'bp_core': '核心',
  },
};

export function getLang() {
  const lang = localStorage.getItem('APP_LANG');
  return lang === 'zh-CN' ? 'zh-CN' : 'en-US';
}

export function t(key) {
  const lang = getLang();
  const dict = translations[lang];
  return dict && dict[key] !== undefined ? dict[key] : key;
}
