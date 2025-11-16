import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import initialGroupData from './initialGroups.json';
import './flashcards.css';

const LOCAL_STORAGE_KEY = 'flashcard_groups_v6_data';
const STORAGE_VERSION = 2;
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent`;
const AI_SETTINGS_STORAGE_KEY = 'flashcard_ai_settings_v1';
const DEFAULT_FLASHCARD_LANGUAGE = 'en';
const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
];
const DEFAULT_GEMINI_API_KEY =
  typeof import.meta !== 'undefined' && import.meta.env
    ? (import.meta.env.VITE_GEMINI_API_KEY || '').trim()
    : '';

const createGroupMap = (groupsArray) => {
  const map = {};
  groupsArray.forEach((group) => {
    map[group.id] = {
      ...group,
      cards: group.cards.map((card) => ({ ...card })),
    };
  });
  return map;
};

const cloneGroupMap = (groupsMap) =>
  Object.fromEntries(
    Object.entries(groupsMap).map(([id, group]) => [
      id,
      {
        ...group,
        cards: group.cards.map((card) => ({ ...card })),
      },
    ]),
  );

const deriveNextIds = (groupsMap, baseNextGroupId, baseNextCardId) => {
  let maxGroupId = (baseNextGroupId ?? 1) - 1;
  let maxCardId = (baseNextCardId ?? 1) - 1;

  Object.values(groupsMap).forEach((group) => {
    maxGroupId = Math.max(maxGroupId, group.id);
    group.cards.forEach((card) => {
      maxCardId = Math.max(maxCardId, card.id);
    });
  });

  return {
    nextGroupId: Math.max(maxGroupId + 1, baseNextGroupId ?? maxGroupId + 1),
    nextCardId: Math.max(maxCardId + 1, baseNextCardId ?? maxCardId + 1),
  };
};

const BASE_GROUPS = createGroupMap(initialGroupData.groups);
const { nextGroupId: BASE_NEXT_GROUP_ID, nextCardId: BASE_NEXT_CARD_ID } = deriveNextIds(
  BASE_GROUPS,
  initialGroupData.nextGroupId,
  initialGroupData.nextCardId,
);

const containsNonAscii = (value) => /[^\x00-\x7F]/.test(value || '');

const cloneBaseGroup = (group) => ({
  ...group,
  cards: group.cards.map((card) => ({ ...card })),
});

const migrateGroups = (rawGroups) => {
  const working = cloneGroupMap(rawGroups || {});

  Object.entries(BASE_GROUPS).forEach(([id, baseGroup]) => {
    const numericId = Number(id);
    const existing = working[numericId];

    if (!existing) {
      working[numericId] = cloneBaseGroup(baseGroup);
      return;
    }

    const nameHasNonAscii = containsNonAscii(existing.name);
    const cardsHaveNonAscii = existing.cards.some(
      (card) =>
        containsNonAscii(card.question) ||
        containsNonAscii(card.answer) ||
        containsNonAscii(card.category),
    );

    if (nameHasNonAscii || cardsHaveNonAscii) {
      working[numericId] = cloneBaseGroup(baseGroup);
    }
  });

  return working;
};

const loadGroups = () => {
  const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      const storedGroups =
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        parsed.groups
          ? parsed.groups
          : parsed;
      const groups = migrateGroups(storedGroups);
      const { nextGroupId, nextCardId } = deriveNextIds(
        groups,
        BASE_NEXT_GROUP_ID,
        BASE_NEXT_CARD_ID,
      );
      return { groups, nextGroupId, nextCardId };
    } catch (e) {
      console.error('Failed to parse groups from localStorage:', e);
    }
  }
  const groups = migrateGroups(BASE_GROUPS);
  const { nextGroupId, nextCardId } = deriveNextIds(
    groups,
    BASE_NEXT_GROUP_ID,
    BASE_NEXT_CARD_ID,
  );
  return { groups, nextGroupId, nextCardId };
};

const getLanguageOption = (value) =>
  LANGUAGE_OPTIONS.find((option) => option.value === value) ?? LANGUAGE_OPTIONS[0];

const sanitizeJsonText = (raw) =>
  (raw || '').replace(/```json/gi, '').replace(/```/g, '').trim();

const parseFlashcardsJson = (rawText, fallbackCategory) => {
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  const sanitized = sanitizeJsonText(rawText);
  const jsonMatch = sanitized.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  const jsonCandidate = jsonMatch ? jsonMatch[0] : sanitized;

  let parsed;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch (error) {
    throw new Error('Unable to parse the AI response. Please try again.');
  }

  const cardsSource = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.cards)
    ? parsed.cards
    : Array.isArray(parsed.flashcards)
    ? parsed.flashcards
    : null;

  if (!cardsSource) {
    throw new Error('The AI response did not include flashcards.');
  }

  const cards = cardsSource
    .map((item) => ({
      question: typeof item.question === 'string' ? item.question.trim() : '',
      answer: typeof item.answer === 'string' ? item.answer.trim() : '',
      category: typeof item.category === 'string' ? item.category.trim() : '',
    }))
    .filter((card) => card.question && card.answer);

  if (cards.length === 0) {
    throw new Error('The AI response did not contain any usable flashcards.');
  }

  return cards.map((card) => ({
    ...card,
    category: card.category || fallbackCategory,
  }));
};

const buildFlashcardPrompt = ({ topic, detail, count, languageLabel }) => {
  const trimmedTopic = topic.trim();
  const trimmedDetail = detail.trim();
  const focusLine = trimmedDetail
    ? `Focus on the subtopic "${trimmedDetail}" while covering the main topic "${trimmedTopic}".`
    : `Cover the most important aspects of "${trimmedTopic}".`;

  return [
    'You are an expert study coach who writes effective flashcards.',
    `Write ${count} flashcards in ${languageLabel}.`,
    focusLine,
    'Respond ONLY with valid JSON that matches this schema:',
    '{',
    '  "cards": [',
    '    { "question": "string", "answer": "string", "category": "string" }',
    '  ]',
    '}',
    'Each question should be a single concise sentence.',
    'Each answer should contain 2-4 sentences or bullet points.',
    'The category should be short (max 5 words) and also written in the requested language.',
    'Do not include explanations, markdown, or code fences outside of the JSON structure.',
  ].join('\n');
};

const requestFlashcardsFromGemini = async ({
  apiKey,
  topic,
  detail,
  count,
  language,
  signal,
}) => {
  const languageOption = getLanguageOption(language);
  const prompt = buildFlashcardPrompt({
    topic,
    detail,
    count,
    languageLabel: languageOption.label,
  });

  const trimmedTopic = topic.trim();
  const trimmedDetail = detail.trim();
  const fallbackCategory =
    trimmedTopic && trimmedDetail ? `${trimmedTopic} / ${trimmedDetail}` : trimmedTopic || 'General';

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.75,
        maxOutputTokens: 768,
      },
    }),
    signal,
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'Gemini request failed.';
    throw new Error(message);
  }

  const replyText = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((part) => (typeof part?.text === 'string' ? part.text.trim() : ''))
    .filter(Boolean)
    .join('\n');

  const cards = parseFlashcardsJson(replyText, fallbackCategory).slice(0, count);

  if (cards.length === 0) {
    throw new Error('No flashcards were generated. Try again with more context.');
  }

  return cards;
};

const loadAiSettings = () => {
  const fallbackLanguage = DEFAULT_FLASHCARD_LANGUAGE;

  if (typeof localStorage === 'undefined') {
    return { language: fallbackLanguage };
  }

  try {
    const stored = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
    if (!stored) {
      return { language: fallbackLanguage };
    }

    const parsed = JSON.parse(stored);
    return {
      language: LANGUAGE_OPTIONS.some((option) => option.value === parsed?.language)
        ? parsed.language
        : fallbackLanguage,
    };
  } catch (error) {
    console.warn('Failed to load flashcard AI settings. Using defaults.', error);
    return { language: fallbackLanguage };
  }
};

const CardFace = ({ content, isFront, category, easyCount }) => {
  const { i18n } = useTranslation();
  const isJa = i18n.language?.startsWith('ja');
  const badge = isFront ? (isJa ? '質問' : 'Question') : isJa ? '回答' : 'Answer';
  const aria = isFront ? (isJa ? '問題面' : 'Question side') : isJa ? '解答面' : 'Answer side';
  const fallbackCategory = isJa ? '未分類' : 'Uncategorised';
  const metaLabel = isJa ? '「かんたん」印' : 'Marked easy';

  return (
    <div
      className={`flashcard-face ${isFront ? 'flashcard-face--front' : 'flashcard-face--back'}`}
      aria-label={aria}
    >
      <span className="flashcard-face__badge">{badge}</span>
      <p className="flashcard-face__category">{category || fallbackCategory}</p>
      <p className="flashcard-face__content">{content}</p>
      {!isFront && <span className="flashcard-face__meta">{metaLabel}: {easyCount}</span>}
    </div>
  );
};

function AddCardForm({ categories, onAddCard, onToggle }) {
  const { t, i18n } = useTranslation();
  const isJa = i18n.language?.startsWith('ja');
  const defaultText = (en, ja) => (isJa ? ja : en);
  const [formData, setFormData] = useState({
    category:
      categories.length > 1
        ? categories.filter((c) => c !== 'All')[0] || ''
        : '',
    question: '',
    answer: '',
    newCategory: '',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    const categoryToUse =
      formData.newCategory.trim() || formData.category.trim();

    if (!formData.question.trim() || !formData.answer.trim() || !categoryToUse) {
      setFormError(
        defaultText(
          'Please provide a question, answer, and category before adding the card.',
          'カードを追加する前に質問・回答・カテゴリを入力してください。',
        ),
      );
      return;
    }

    onAddCard({
      category: categoryToUse,
      question: formData.question.trim(),
      answer: formData.answer.trim(),
    });

    setFormData((prev) => ({
      ...prev,
      question: '',
      answer: '',
      newCategory: '',
      category: categoryToUse,
    }));
  };

  const existingCategories = categories.filter((c) => c !== 'All');

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">
          {t('flashcards.addForm.title', { defaultValue: defaultText('Add Card', 'カードを追加') })}
        </h3>
        <button className="button button--ghost" onClick={onToggle} type="button">
          {t('flashcards.actions.close', { defaultValue: defaultText('Close', '閉じる') })}
        </button>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label className="form-label">
          {t('flashcards.addForm.category', { defaultValue: defaultText('Category', 'カテゴリ') })}
        </label>
        <select
          className="form-control"
          name="category"
          onChange={handleChange}
          value={formData.category}
          disabled={Boolean(formData.newCategory.trim())}
        >
          <option value="">
            {t('flashcards.addForm.categoryHint', {
              defaultValue: defaultText('Select an existing category', '既存のカテゴリを選択'),
            })}
          </option>
          {existingCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <input
          className="form-control"
          name="newCategory"
          onChange={handleChange}
          placeholder={t('flashcards.addForm.categoryPlaceholder', {
            defaultValue: defaultText('Or create a new category', 'または新しいカテゴリを作成'),
          })}
          type="text"
          value={formData.newCategory}
        />

        <label className="form-label" htmlFor="question">
          {t('flashcards.addForm.question', { defaultValue: defaultText('Question', '質問') })}
        </label>
        <textarea
          className="form-control"
          id="question"
          name="question"
          onChange={handleChange}
          placeholder={t('flashcards.addForm.questionPlaceholder', {
            defaultValue: defaultText(
              'e.g. What problem does React solve?',
              '例: React はどんな課題を解決しますか？',
            ),
          })}
          required
          rows={3}
          value={formData.question}
        />

        <label className="form-label" htmlFor="answer">
          {t('flashcards.addForm.answer', { defaultValue: defaultText('Answer', '回答') })}
        </label>
        <textarea
          className="form-control"
          id="answer"
          name="answer"
          onChange={handleChange}
          placeholder={t('flashcards.addForm.answerPlaceholder', {
            defaultValue: defaultText(
              'e.g. It manages complex state transitions in UI.',
              '例: 複雑な UI 状態遷移を管理します。',
            ),
          })}
          required
          rows={3}
          value={formData.answer}
        />

        {formError && <p className="form-error">{formError}</p>}

        <button className="button button--primary" type="submit">
          {t('flashcards.addForm.submit', { defaultValue: defaultText('Add Card', 'カードを追加') })}
        </button>
      </form>
    </div>
  );
}

function AiFlashcardGenerator({
  groups,
  isGenerating,
  lastResult,
  error,
  onGenerate,
  settings,
  onSettingsChange,
}) {
  const { i18n } = useTranslation();
  const isJa = i18n.language?.startsWith('ja');
  const copy = isJa
    ? {
        title: 'AI フラッシュカード生成',
        beta: 'ベータ',
        topicLabel: 'トピック',
        topicPlaceholder: '例: React コンポーネントのパターン',
        detailLabel: '重点（任意）',
        detailPlaceholder: '例: フック、状態管理、テスト',
        countLabel: 'カード枚数',
        countOption: count => `${count} 枚`,
        languageLabel: 'カードの言語',
        languageNames: { en: '英語', es: 'スペイン語', fr: 'フランス語', de: 'ドイツ語', ja: '日本語' },
        modeNew: '新しいグループを作成',
        modeExisting: '既存グループに追加',
        newGroupLabel: 'グループ名',
        newGroupPlaceholder: '例: React 基礎 (AI)',
        defaultGroupName: 'AI 新規グループ',
        newGroupHint: name => `未入力の場合は「${name}」を使用します。`,
        existingGroupLabel: '追加先のグループ',
        existingGroupPlaceholder: 'グループを選択',
        envError: 'AI フラッシュカード機能を使うには .env に VITE_GEMINI_API_KEY を設定してください。',
        topicRequired: 'カードを生成する前にトピックを入力してください。',
        groupRequired: '追加先のグループを選択してください。',
        submit: 'カードを生成',
        generating: '生成中…',
        result: (count, group) => `${group} に ${count} 枚のカードを追加しました。`,
        resultTopic: topic => `トピック: ${topic}`,
        resultDetail: detail => ` - フォーカス: ${detail}`,
        resultLanguage: label => ` - 言語: ${label}`,
      }
    : {
        title: 'AI Flashcard Generator',
        beta: 'Beta',
        topicLabel: 'Topic',
        topicPlaceholder: 'e.g. React component patterns',
        detailLabel: 'Focus (optional)',
        detailPlaceholder: 'e.g. Hooks, state management, testing',
        countLabel: 'Number of cards',
        countOption: count => `${count} cards`,
        languageLabel: 'Flashcard language',
        languageNames: { en: 'English', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese' },
        modeNew: 'Create new group',
        modeExisting: 'Add to existing group',
        newGroupLabel: 'Group name',
        newGroupPlaceholder: 'e.g. React Basics (AI)',
        defaultGroupName: 'New AI Group',
        newGroupHint: name => `If left blank we will use "${name}".`,
        existingGroupLabel: 'Target group',
        existingGroupPlaceholder: 'Choose a group',
        envError: 'Add VITE_GEMINI_API_KEY to your project .env file to enable AI flashcard generation.',
        topicRequired: 'Enter a topic before generating cards.',
        groupRequired: 'Select a group to append the generated cards.',
        submit: 'Generate Cards',
        generating: 'Generating...',
        result: (count, group) => `Added ${count} cards to ${group}.`,
        resultTopic: topic => `Topic: ${topic}`,
        resultDetail: detail => ` - Focus: ${detail}`,
        resultLanguage: label => ` - Language: ${label}`,
      };
  const [mode, setMode] = useState('new');
  const generatorSettings = settings ?? { language: DEFAULT_FLASHCARD_LANGUAGE };
  const updateSettings = onSettingsChange ?? (() => {});
  const resolvedApiKey = (DEFAULT_GEMINI_API_KEY || '').trim();
  const apiKeyMissing = resolvedApiKey.length === 0;
  const [formData, setFormData] = useState({
    topic: '',
    detail: '',
    count: 5,
    targetGroupId: '',
    newGroupName: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.topic.trim() || apiKeyMissing) {
      return;
    }

    onGenerate({
      topic: formData.topic,
      detail: formData.detail,
      count: Number(formData.count),
      mode,
      targetGroupId: formData.targetGroupId,
      newGroupName: formData.newGroupName,
      language: generatorSettings.language,
    });
  };

  const existingGroupOptions = useMemo(
    () =>
      Object.values(groups).map((group) => ({
        id: group.id,
        name: group.name,
      })),
    [groups],
  );

  const suggestedGroupName =
    formData.newGroupName.trim() ||
    (formData.topic.trim() ? `${formData.topic.trim()} (AI)` : '');

  return (
    <div className="stack">
      <div className="stack-header">
        <h2 className="panel-title">{copy.title}</h2>
        <span className="tag">{copy.beta}</span>
      </div>
      <form className="stack-form" onSubmit={handleSubmit}>
        <label className="form-label" htmlFor="ai-topic">
          {copy.topicLabel}
        </label>
        <input
          autoComplete="off"
          className="form-control"
          id="ai-topic"
          name="topic"
          onChange={handleChange}
          placeholder={copy.topicPlaceholder}
          required
          value={formData.topic}
        />

        <label className="form-label" htmlFor="ai-detail">
          {copy.detailLabel}
        </label>
        <input
          autoComplete="off"
          className="form-control"
          id="ai-detail"
          name="detail"
          onChange={handleChange}
          placeholder={copy.detailPlaceholder}
          value={formData.detail}
        />

        <label className="form-label" htmlFor="ai-count">
          {copy.countLabel}
        </label>
        <select
          className="form-control"
          id="ai-count"
          name="count"
          onChange={handleChange}
          value={formData.count}
        >
          {[3, 5, 8, 10].map(count => (
            <option key={count} value={count}>
              {copy.countOption(count)}
            </option>
          ))}
        </select>

        <label className="form-label" htmlFor="ai-language">
          {copy.languageLabel}
        </label>
        <select
          className="form-control"
          id="ai-language"
          name="language"
          onChange={(event) => updateSettings({ language: event.target.value })}
          value={generatorSettings.language}
        >
          {LANGUAGE_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {copy.languageNames[option.value] || option.label}
            </option>
          ))}
        </select>

        <div className="radio-group">
          <label className="radio-option">
            <input
              checked={mode === 'new'}
              name="ai-target"
              onChange={() => setMode('new')}
              type="radio"
            />
            {copy.modeNew}
          </label>
          <label className="radio-option">
            <input
              checked={mode === 'existing'}
              name="ai-target"
              onChange={() => setMode('existing')}
              type="radio"
            />
            {copy.modeExisting}
          </label>
        </div>

        {mode === 'new' ? (
          <>
            <label className="form-label" htmlFor="ai-new-group">
              {copy.newGroupLabel}
            </label>
            <input
              className="form-control"
              id="ai-new-group"
              name="newGroupName"
              onChange={handleChange}
              placeholder={copy.newGroupPlaceholder}
              value={formData.newGroupName}
            />
            <span className="hint">
              {copy.newGroupHint(suggestedGroupName || copy.defaultGroupName)}
            </span>
          </>
        ) : (
          <>
            <label className="form-label" htmlFor="ai-existing-group">
              {copy.existingGroupLabel}
            </label>
            <select
              className="form-control"
              id="ai-existing-group"
              name="targetGroupId"
              onChange={handleChange}
              required={mode === 'existing'}
              value={formData.targetGroupId}
            >
              <option value="">{copy.existingGroupPlaceholder}</option>
              {existingGroupOptions.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </>
        )}

        {apiKeyMissing && !error && <p className="form-error">{copy.envError}</p>}

        {error && <p className="form-error">{error}</p>}

        <button
          className="button button--primary"
          disabled={isGenerating || apiKeyMissing}
          type="submit"
        >
          {isGenerating ? copy.generating : copy.submit}
        </button>
      </form>

      {lastResult ? (
        <div className="result">
          <p>{copy.result(lastResult.cardCount, lastResult.groupName)}</p>
          <p>
            {copy.resultTopic(lastResult.topic)}
            {lastResult.detail ? copy.resultDetail(lastResult.detail) : ''}
            {lastResult.languageLabel ? copy.resultLanguage(lastResult.languageLabel) : ''}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StudyScreen({ group, setGroup, setScreen, nextCardId, setNextCardId }) {
  const { i18n } = useTranslation();
  const isJa = i18n.language?.startsWith('ja');
  const copy = isJa
    ? {
        back: '← グループ一覧へ戻る',
        addCard: 'カードを追加',
        hideForm: 'フォームを閉じる',
        categoryLabel: 'カテゴリ',
        filterAll: 'すべて',
        cardsLabel: count => `カード: ${count}`,
        markedEasy: count => `「かんたん」印: ${count}`,
        emptyCategory: 'このカテゴリのカードはまだありません。',
        complete: 'このカテゴリはすべて学習済みです！',
        restart: 'もう一度行う',
        reviewAgain: 'もう一度見る',
        gotIt: '理解した',
        hint: 'カードをクリックして答えを表示しましょう。',
      }
    : {
        back: '← Back to groups',
        addCard: 'Add card',
        hideForm: 'Hide form',
        categoryLabel: 'Category',
        filterAll: 'All',
        cardsLabel: count => `Cards: ${count}`,
        markedEasy: count => `Marked easy: ${count}`,
        emptyCategory: 'No cards available in this category yet.',
        complete: "You're all caught up for this category!",
        restart: 'Restart session',
        reviewAgain: 'Review again',
        gotIt: 'Got it',
        hint: 'Click the card to reveal the answer.',
      };
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);

  const cards = group.cards;

  const categories = useMemo(() => {
    const all = cards.map((card) => card.category).filter(Boolean);
    const unique = [...new Set(all)].sort((a, b) => a.localeCompare(b));
    return ['All', ...unique];
  }, [cards]);

  const filteredCards = useMemo(() => {
    if (selectedCategory === 'All') {
      return cards;
    }
    return cards.filter((card) => card.category === selectedCategory);
  }, [cards, selectedCategory]);

  const totalEasyCount = useMemo(
    () => cards.reduce((accumulator, card) => accumulator + (card.easyCount || 0), 0),
    [cards],
  );

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategory, cards.length]);

  const displayCard = filteredCards[currentIndex] ?? null;
  const currentFilteredIndex = filteredCards.length > 0 ? currentIndex : -1;

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const moveToNextCard = () => {
    setIsFlipped(false);
    if (filteredCards.length > 0) {
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % filteredCards.length);
      }, 120);
    }
  };

  const handleLearningAction = (action) => {
    if (!displayCard) return;

    if (action === 'easy') {
      const updatedCards = cards.map((card) =>
        card.id === displayCard.id
          ? { ...card, easyCount: (card.easyCount || 0) + 1 }
          : card,
      );
      setGroup({ ...group, cards: updatedCards });
    }

    moveToNextCard();
  };

  const handleAddCard = (newCardData) => {
    const newCard = {
      id: nextCardId,
      ...newCardData,
      easyCount: 0,
    };

    const updatedCards = [...cards, newCard];

    setGroup({ ...group, cards: updatedCards });
    setNextCardId((prevId) => prevId + 1);
    setShowAddForm(false);
    setSelectedCategory(newCard.category);
  };

  return (
    <div className="screen">
      <header className="screen-header">
        <button className="button button--ghost" onClick={() => setScreen('Home')} type="button">
          ? Back to groups
        </button>
        <h1 className="screen-title">{group.name}</h1>
        <button
          className="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          type="button"
        >
          {showAddForm ? 'Hide form' : 'Add card'}
        </button>
      </header>

      <section className="panel panel--thin">
        <div className="inline-controls">
          <label className="control-label" htmlFor="category-select">
            Category
          </label>
          <select
            className="form-control"
            id="category-select"
            onChange={(event) => setSelectedCategory(event.target.value)}
            value={selectedCategory}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="control-text">
            {filteredCards.length > 0
              ? `${currentFilteredIndex + 1} / ${filteredCards.length}`
              : '0 / 0'}
          </span>
          <span className="control-text">Cards: {cards.length}</span>
          <span className="control-text">Marked easy: {totalEasyCount}</span>
        </div>
      </section>

      {showAddForm && (
        <AddCardForm
          categories={categories}
          onAddCard={handleAddCard}
          onToggle={() => setShowAddForm(false)}
        />
      )}

      {filteredCards.length > 0 && displayCard ? (
        <>
          <div
            aria-live="polite"
            className="flashcard-stage"
            onClick={handleFlip}
            onKeyDown={(event) => {
              if (event.key === ' ') {
                event.preventDefault();
                handleFlip();
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className={`flashcard ${isFlipped ? 'flashcard--flipped' : ''}`}>
              <CardFace
                category={displayCard.category}
                content={displayCard.question}
                easyCount={displayCard.easyCount}
                isFront
              />
              <CardFace
                category={displayCard.category}
                content={displayCard.answer}
                easyCount={displayCard.easyCount}
                isFront={false}
              />
            </div>
          </div>

          <div className="study-actions">
            {isFlipped ? (
              <>
                <button
                  className="button button--ghost"
                  onClick={() => handleLearningAction('hard')}
                  type="button"
                >
                  Review again
                </button>
                <button
                  className="button button--secondary"
                  onClick={() => handleLearningAction('easy')}
                  type="button"
                >
                  Got it
                </button>
              </>
            ) : (
              <p className="study-hint">Click the card to reveal the answer.</p>
            )}
          </div>
        </>
      ) : (
        <div className="panel panel--empty">
          <p>No cards available in this category yet.</p>
        </div>
      )}
    </div>
  );
}

function HomeScreen({
  groups,
  onCreateGroup,
  onDeleteGroup,
  onSelectGroup,
  nextGroupId,
  setNextGroupId,
  aiState,
  onGenerateAiCards,
  aiSettings,
  onUpdateAiSettings,
}) {
  const { i18n } = useTranslation();
  const isJa = i18n.language?.startsWith('ja');
  const copy = isJa
    ? {
        title: 'フラッシュカード',
        subtitle: '科目ごとにデッキを作り、AI が数秒で新しいカードを提案します。',
        summary: {
          groups: count => `グループ: ${count}`,
          cards: count => `カード: ${count}`,
          categories: count => `カテゴリ: ${count}`,
        },
        createLabel: '新しいグループを作成',
        createPlaceholder: '例: 物理の公式',
        createButton: '作成',
        groupsTitle: count => `グループ (${count})`,
        empty: 'まだグループがありません。まずは上で作成しましょう。',
        groupMeta: count => `${count} 枚`,
        study: '学習',
        delete: '削除',
      }
    : {
        title: 'Flashcards',
        subtitle: 'Build decks for every subject and let AI draft fresh flashcards in seconds.',
        summary: {
          groups: count => `Groups: ${count}`,
          cards: count => `Cards: ${count}`,
          categories: count => `Categories: ${count}`,
        },
        createLabel: 'Create a new group',
        createPlaceholder: 'e.g. Physics formulas',
        createButton: 'Create',
        groupsTitle: count => `Groups (${count})`,
        empty: 'No groups yet. Start by creating one above.',
        groupMeta: count => `${count} cards`,
        study: 'Study',
        delete: 'Delete',
      };
  const groupList = Object.values(groups);
  const [newGroupName, setNewGroupName] = useState('');

  const totalCards = useMemo(
    () =>
      groupList.reduce((accumulator, current) => accumulator + current.cards.length, 0),
    [groupList],
  );

  const totalCategories = useMemo(() => {
    const categorySet = new Set();
    groupList.forEach((group) =>
      group.cards.forEach((card) => {
        if (card.category) categorySet.add(card.category);
      }),
    );
    return categorySet.size;
  }, [groupList]);

  const handleCreateGroup = (event) => {
    event.preventDefault();
    if (newGroupName.trim() === '') return;

    onCreateGroup(newGroupName.trim(), nextGroupId);
    setNextGroupId((prev) => prev + 1);
    setNewGroupName('');
  };

  const handleDeleteGroup = (groupId) => {
    onDeleteGroup(groupId);
  };

  const recentGroup = groupList[0] ?? null;

  const handleQuickGenerate = () => {
    onGenerateAiCards({
      topic: 'Starter study set',
      detail: 'Productivity habits',
      count: 3,
      mode: 'new',
      targetGroupId: '',
      newGroupName: 'Quick Start Deck (AI)',
      language: aiSettings.language,
    });
  };

  return (
    <div className="screen">
      <header className="home-header">
        <div className="home-hero">
          <h1 className="screen-title">{copy.title}</h1>
          <p className="home-subtitle">{copy.subtitle}</p>
          <div className="home-summary">
            <span>{copy.summary.groups(groupList.length)}</span>
            <span>{copy.summary.cards(totalCards)}</span>
            <span>{copy.summary.categories(totalCategories)}</span>
          </div>
        </div>
        <div className="home-actions">
          <button
            className="button button--primary"
            onClick={handleQuickGenerate}
            type="button"
          >
            Generate sample deck
          </button>
          <button
            className="button button--secondary"
            disabled={!recentGroup}
            onClick={() => {
              if (recentGroup) {
                onSelectGroup(recentGroup.id);
              }
            }}
            type="button"
          >
            Resume recent group
          </button>
        </div>
      </header>

      <section className="panel">
        <AiFlashcardGenerator
          error={aiState.error}
          groups={groups}
          isGenerating={aiState.status === 'generating'}
          lastResult={aiState.lastResult}
          onGenerate={onGenerateAiCards}
          settings={aiSettings}
          onSettingsChange={onUpdateAiSettings}
        />
      </section>

      <section className="panel">
        <form className="form" onSubmit={handleCreateGroup}>
          <label className="form-label" htmlFor="new-group">
            {copy.createLabel}
          </label>
          <div className="form-row">
            <input
              className="form-control"
              id="new-group"
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder={copy.createPlaceholder}
              required
              type="text"
              value={newGroupName}
            />
            <button className="button button--secondary" type="submit">
              {copy.createButton}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <h2 className="panel-title">{copy.groupsTitle(groupList.length)}</h2>
        {groupList.length === 0 ? (
          <p className="panel-text">{copy.empty}</p>
        ) : (
          <ul className="group-list">
            {groupList.map((group) => (
              <li className="group-card" key={group.id}>
                <div>
                  <p className="group-name">{group.name}</p>
                  <span className="group-meta">{copy.groupMeta(group.cards.length)}</span>
                </div>
                <div className="group-actions">
                  <button
                    className="button button--secondary"
                    onClick={() => onSelectGroup(group.id)}
                    type="button"
                  >
                    {copy.study}
                  </button>
                  <button
                    className="button button--ghost"
                    onClick={() => handleDeleteGroup(group.id)}
                    type="button"
                  >
                    {copy.delete}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function FlashcardsPage() {
  const [{ groups, nextGroupId, nextCardId }, setAppState] = useState(loadGroups);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const [studyGroupId, setStudyGroupId] = useState(null);
  const [aiSettings, setAiSettings] = useState(loadAiSettings);
  const aiRequestControllerRef = useRef(null);
  const [aiState, setAiState] = useState({
    status: 'idle',
    lastResult: null,
    error: '',
  });

  useEffect(() => {
    try {
      const payload = {
        version: STORAGE_VERSION,
        groups,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to persist flashcard groups.', error);
    }
  }, [groups]);

  useEffect(() => {
    try {
      localStorage.setItem(
        AI_SETTINGS_STORAGE_KEY,
        JSON.stringify({ language: aiSettings.language }),
      );
    } catch (error) {
      console.warn('Failed to persist flashcard AI settings.', error);
    }
  }, [aiSettings.language]);

  useEffect(() => () => {
    if (aiRequestControllerRef.current) {
      try {
        aiRequestControllerRef.current.abort();
      } catch (error) {
        console.warn('Failed to abort in-flight Gemini request.', error);
      }
    }
  }, []);

  const handleAiSettingsChange = (partial) => {
    setAiSettings((previous) => {
      const next = { ...previous };
      if (Object.prototype.hasOwnProperty.call(partial, 'language')) {
        next.language = getLanguageOption(partial.language).value;
      }
      return next;
    });
  };

  const setNextGroupIdValue = (updater) => {
    setAppState((prev) => {
      const nextValue =
        typeof updater === 'function' ? updater(prev.nextGroupId) : updater;
      return { ...prev, nextGroupId: nextValue };
    });
  };

  const setNextCardIdValue = (updater) => {
    setAppState((prev) => {
      const nextValue =
        typeof updater === 'function' ? updater(prev.nextCardId) : updater;
      return { ...prev, nextCardId: nextValue };
    });
  };

  const updateGroupCards = (groupId, newGroupData) => {
    setAppState((prev) => ({
      ...prev,
      groups: {
        ...prev.groups,
        [groupId]: newGroupData,
      },
    }));
  };

  const handleCreateGroup = (groupName, id) => {
    const newGroup = {
      id,
      name: groupName,
      cards: [],
    };
    setAppState((prev) => ({
      ...prev,
      groups: { ...prev.groups, [id]: newGroup },
    }));
  };

  const handleDeleteGroup = (groupId) => {
    setAppState((prev) => {
      const newGroups = { ...prev.groups };
      delete newGroups[groupId];
      return { ...prev, groups: newGroups };
    });
  };

  const handleSelectGroup = (groupId) => {
    setStudyGroupId(groupId);
    setCurrentScreen('Study');
  };

const handleGenerateAiCards = async ({
  topic,
  detail,
  count,
  mode,
  targetGroupId,
  newGroupName,
  language,
}) => {
  const trimmedTopic = (topic || '').trim();
  const trimmedDetail = (detail || '').trim();
  const selectedLanguageOption = getLanguageOption(language ?? aiSettings.language);
  const selectedLanguage = selectedLanguageOption.value;
  const resolvedApiKey = (DEFAULT_GEMINI_API_KEY || '').trim();

  if (!trimmedTopic) {
    setAiState({
      status: 'error',
      lastResult: null,
      error: copy.topicRequired,
    });
    return;
  }

  if (!resolvedApiKey) {
    setAiState({
      status: 'error',
      lastResult: null,
      error: copy.envError,
    });
    return;
  }

  if (mode === 'existing' && !targetGroupId) {
    setAiState({
      status: 'error',
      lastResult: null,
      error: copy.groupRequired,
    });
    return;
  }

  const numericCount = Number(count);
  const safeCount = Number.isFinite(numericCount) && numericCount > 0 ? Math.min(numericCount, 10) : 5;

  setAiState((prev) => ({ ...prev, status: 'generating', error: '' }));

  if (aiRequestControllerRef.current) {
    try {
      aiRequestControllerRef.current.abort();
    } catch (error) {
      console.warn('Failed to cancel previous Gemini request.', error);
    }
  }

  const controller = new AbortController();
  aiRequestControllerRef.current = controller;

  try {
    const cards = await requestFlashcardsFromGemini({
      apiKey: resolvedApiKey,
      topic: trimmedTopic,
      detail: trimmedDetail,
      count: safeCount,
      language: selectedLanguage,
      signal: controller.signal,
    });

    let resultSummary = null;
    let errorMessage = null;

    setAppState((prev) => {
      const cardsWithIds = cards.map((card, index) => ({
        id: prev.nextCardId + index,
        category: card.category,
        question: card.question,
        answer: card.answer,
        easyCount: 0,
      }));

      if (cardsWithIds.length === 0) {
        errorMessage = 'The AI did not return any cards. Try again with more detail.';
        return prev;
      }

      if (mode === 'existing') {
        const numericId = Number(targetGroupId);
        const targetGroup = prev.groups[numericId];

        if (!targetGroup) {
          errorMessage = 'The selected group could not be found. Please refresh and try again.';
          return prev;
        }

        const updatedGroup = {
          ...targetGroup,
          cards: [...targetGroup.cards, ...cardsWithIds],
        };

        resultSummary = {
          groupName: targetGroup.name,
          cardCount: cardsWithIds.length,
          topic: trimmedTopic,
          detail: trimmedDetail,
          languageLabel: selectedLanguageOption.label,
        };

        return {
          ...prev,
          groups: {
            ...prev.groups,
            [numericId]: updatedGroup,
          },
          nextCardId: prev.nextCardId + cardsWithIds.length,
        };
      }

      const assignedGroupId = prev.nextGroupId;
      const resolvedName = (newGroupName || '').trim() || `${trimmedTopic} (AI)`;
      const newGroup = {
        id: assignedGroupId,
        name: resolvedName,
        cards: cardsWithIds,
      };

      resultSummary = {
        groupName: resolvedName,
        cardCount: cardsWithIds.length,
        topic: trimmedTopic,
        detail: trimmedDetail,
        languageLabel: selectedLanguageOption.label,
      };

      return {
        ...prev,
        groups: {
          ...prev.groups,
          [assignedGroupId]: newGroup,
        },
        nextGroupId: prev.nextGroupId + 1,
        nextCardId: prev.nextCardId + cardsWithIds.length,
      };
    });

    if (errorMessage) {
      setAiState({
        status: 'error',
        lastResult: null,
        error: errorMessage,
      });
      return;
    }

    if (resultSummary) {
      setAiState({
        status: 'success',
        lastResult: resultSummary,
        error: '',
      });
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }
    console.error('Failed to generate flashcards with Gemini:', error);
    setAiState({
      status: 'error',
      lastResult: null,
      error:
        error?.message || 'Something went wrong while generating flashcards. Please try again.',
    });
  } finally {
    if (aiRequestControllerRef.current === controller) {
      aiRequestControllerRef.current = null;
    }
  }
};

  const currentGroup = studyGroupId ? groups[studyGroupId] : null;

  let content;

  if (currentScreen === 'Study' && currentGroup) {
    content = (
      <StudyScreen
        group={currentGroup}
        nextCardId={nextCardId}
        setGroup={(newGroupData) => updateGroupCards(studyGroupId, newGroupData)}
        setNextCardId={setNextCardIdValue}
        setScreen={setCurrentScreen}
      />
    );
  } else {
    if (currentScreen === 'Study' && !currentGroup) {
      console.warn(
        'Active study group data was not found. Returning to the overview screen.',
      );
      setCurrentScreen('Home');
    }

    content = (
      <HomeScreen
        aiSettings={aiSettings}
        aiState={aiState}
        groups={groups}
        nextGroupId={nextGroupId}
        onCreateGroup={handleCreateGroup}
        onDeleteGroup={handleDeleteGroup}
        onGenerateAiCards={handleGenerateAiCards}
        onSelectGroup={handleSelectGroup}
        onUpdateAiSettings={handleAiSettingsChange}
        setNextGroupId={setNextGroupIdValue}
      />
    );
  }

  return <div className="app-shell"><div className="app-shell__content">{content}</div></div>;
}
