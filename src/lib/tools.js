export const TOOL_IDS = ['calendar', 'immerse', 'flashcards', 'chat', 'stream', 'summary', 'pomodoro', 'aichat']

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
  chat: {
    title: 'Studiny Chat',
    description: 'AI-powered study assistant for homework help and learning.'
  },
  stream: {
    title: 'Study Stream',
    description: 'Virtual study rooms with video chat and collaborative whiteboard.'
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
  chat: [
    'Get instant answers to your study questions.',
    'Export conversation as PDF for offline review.',
    'Powered by Google Gemini AI for accurate responses.'
  ],
  stream: [
    'Join virtual study rooms with peers.',
    'Collaborate on shared whiteboard in real-time.',
    'Video chat while studying together.'
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
