export const TOOL_IDS = ['calendar', 'immerse', 'flashcards', 'summary', 'pomodoro', 'aichat']

export const TOOL_DEFAULTS = {
  calendar: {
    title: 'Calendar Planner',
    description: 'Plan study sessions, deadlines, and key reminders in one place.'
  },
  immerse: {
    title: 'Immerse Mode',
    description: 'Switch to a distraction-free layout for deep focus.'
  },
  flashcards: {
    title: 'Flashcards',
    description: 'Quickly drill important terms and definitions.'
  },
  summary: {
    title: 'Summary AI',
    description: 'Generate concise study notes from your materials.'
  },
  pomodoro: {
    title: 'Pomodoro Coach',
    description: 'Structure sessions with focus and break timers.'
  },
  aichat: {
    title: 'AI Chat',
    description: 'Chat with AI to get help with your studies.'
  }
}

export const TOOL_FEATURES = {
  flashcards: [
    'Create decks for each subject and chapter.',
    'Review cards with spaced repetition-inspired sessions.',
    'Track streaks and confidence to spot weak spots quickly.'
  ],
  summary: [
    'Paste notes or upload text to generate concise takeaways.',
    'Highlight key sentences and action items automatically.',
    'Export summaries to share with your study partners.'
  ],
  pomodoro: [
    'Customize focus and break lengths to match your rhythm.',
    'Log completed cycles to visualize productivity trends.',
    'Queue quick notes between sessions so you never lose ideas.'
  ],
  aichat: [
    'Ask questions about your study materials and get instant answers.',
    'Get explanations for complex topics in simple terms.',
    'Practice problem-solving with step-by-step guidance.'
  ]
}

export function getToolCopy(t, toolId) {
  const defaults = TOOL_DEFAULTS[toolId] ?? { title: toolId, description: '' }
  return {
    title: t(`tools.apps.${toolId}.title`, { defaultValue: defaults.title }),
    description: t(`tools.apps.${toolId}.description`, { defaultValue: defaults.description })
  }
}

export function getToolFeatures(toolId) {
  return TOOL_FEATURES[toolId] ?? []
}
