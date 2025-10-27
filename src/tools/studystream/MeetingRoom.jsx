import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import sampleData from './sampleData.json';

const INITIAL_PARTICIPANTS = sampleData.meeting.participants.map((participant) => ({ ...participant }));

const IconMicrophone = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5v1a6.5 6.5 0 0013 0v-1" />
    <path d="M12 21v-3.5" />
  </svg>
);

const IconMicrophoneOff = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5v1a6.5 6.5 0 0013 0v-1" />
    <path d="M12 21v-3.5" />
    <path d="M4.5 4.5l15 15" />
  </svg>
);

const IconCamera = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="7" width="12" height="10" rx="2" />
    <path d="M16 9.5l4-2.5v11l-4-2.5z" />
  </svg>
);

const IconCameraOff = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="7" width="12" height="10" rx="2" />
    <path d="M16 9.5l4-2.5v11l-4-2.5z" />
    <path d="M4 4l16 16" />
  </svg>
);

const IconScreenShare = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M12 8v5" />
    <path d="M9.5 10.5L12 8l2.5 2.5" />
    <path d="M7 20h10" />
    <path d="M12 16v4" />
  </svg>
);

const IconScreenShareStop = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M9 9l6 6" />
    <path d="M15 9l-6 6" />
    <path d="M7 20h10" />
    <path d="M12 16v4" />
  </svg>
);

const IconChat = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M6 6.5H18V15.5H11L8 18.5V15.5H6Z" />
    <path d="M9 10.5H15" />
    <path d="M9 13.5h4" />
  </svg>
);

const IconSparkles = (props) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4z" />
    <path d="M6 14l0.8 2 2 0.8-2 0.8L6 19.6 5.2 17.6 3.2 16l2-0.8z" />
    <path d="M18 12l0.8 2 2 0.8-2 0.8L18 17.6 17.2 15.6 15.2 14l2-0.8z" />
  </svg>
);


const now = Date.now();

const SAMPLE_MESSAGES = [
  {
    id: 'm1',
    authorId: 'maya',
    author: 'Maya Singh',
    body: 'Remember to capture the problem constraints.',
    createdAt: new Date(now - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'm2',
    authorId: 'self',
    author: 'You',
    body: 'On it! I will outline the solution on the whiteboard.',
    createdAt: new Date(now - 1000 * 60 * 6).toISOString(),
  },
  {
    id: 'm3',
    authorId: 'liam',
    author: 'Liam Chen',
    body: 'Let’s summarise open questions before we wrap.',
    createdAt: new Date(now - 1000 * 60 * 4).toISOString(),
  },
];

const AI_SUGGESTIONS = [
  'Summarise the last 5 minutes of discussion.',
  'Draft a study plan for the upcoming exam.',
  'Generate follow-up questions for today’s topic.',
];

const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_ASSISTANT_HISTORY = 8;

const MeetingRoom = () => {
  const navigate = useNavigate();
  const { id: meetingId } = useParams();
  const [participants, setParticipants] = useState(INITIAL_PARTICIPANTS);
  const [isExitPromptOpen, setIsExitPromptOpen] = useState(false);
  const [pendingDestination, setPendingDestination] = useState('/');
  const [cameraStream, setCameraStream] = useState(null);
  const [micStream, setMicStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [shareExpanded, setShareExpanded] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMessagePanelOpen, setIsMessagePanelOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [messages, setMessages] = useState(() => [...SAMPLE_MESSAGES]);
  const [messageDraft, setMessageDraft] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([]);
  const [assistantDraft, setAssistantDraft] = useState('');
  const [assistantIsLoading, setAssistantIsLoading] = useState(false);
  const [assistantError, setAssistantError] = useState(null);
  const lastShareIdRef = useRef(null);
  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const toolsMenuRef = useRef(null);
  const messageListRef = useRef(null);
  const messageInputRef = useRef(null);
  const assistantScrollRef = useRef(null);
  const assistantInputRef = useRef(null);
  const assistantMessagesRef = useRef([]);
  const geminiApiKey = React.useMemo(
    () => (import.meta.env.VITE_GEMINI_API_KEY || '').trim(),
    []
  );

  const updateSelf = useCallback((changes) => {
    setParticipants((previous) =>
      previous.map((participant) =>
        participant.id === 'self' ? { ...participant, ...changes } : participant
      )
    );
  }, []);

  const openExitPrompt = useCallback((target = '/') => {
    setPendingDestination(target);
    setIsExitPromptOpen(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setIsExitPromptOpen(false);
  }, []);

  const handleConfirmExit = useCallback(() => {
    setIsExitPromptOpen(false);
    navigate(pendingDestination);
  }, [navigate, pendingDestination]);

  const toggleMic = useCallback(async () => {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
      updateSelf({ micMuted: true });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('Media devices API not supported for microphone access.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      updateSelf({ micMuted: false });
    } catch (error) {
      console.error('Unable to access microphone', error);
    }
  }, [micStream, updateSelf]);

  const toggleCamera = useCallback(async () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      updateSelf({ cameraOn: false });
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error('Media devices API not supported for camera access.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      updateSelf({ cameraOn: true });
    } catch (error) {
      console.error('Unable to access camera', error);
    }
  }, [cameraStream, updateSelf]);

  const toggleScreenShare = useCallback(async () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      updateSelf({ isSharingScreen: false });
      return;
    }
    if (!navigator.mediaDevices?.getDisplayMedia) {
      console.error('Screen sharing is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
      setParticipants((previous) =>
        previous.map((participant) =>
          participant.id === 'self'
            ? { ...participant, isSharingScreen: true }
            : { ...participant, isSharingScreen: false }
        )
      );
      const [track] = stream.getVideoTracks();
      if (track) {
        track.addEventListener('ended', () => {
          setScreenStream(null);
          updateSelf({ isSharingScreen: false });
        });
      }
    } catch (error) {
      console.error('Unable to share screen', error);
    }
  }, [screenStream, updateSelf]);

  const selfParticipant = participants.find((participant) => participant.id === 'self');
  const selfDisplayName = selfParticipant?.name ?? 'You';
  const micMuted = selfParticipant?.micMuted ?? true;
  const cameraOn = selfParticipant?.cameraOn ?? false;
  const isSharingScreen = selfParticipant?.isSharingScreen ?? false;
  const sharingParticipant = participants.find((participant) => participant.isSharingScreen);
  const totalParticipants = participants.length;
  const isDrawerOpen = isMessagePanelOpen || isAiChatOpen;
  const drawerMode = isAiChatOpen ? 'assistant' : isMessagePanelOpen ? 'messages' : null;
  const meetingPageClasses = ['meeting-page', 'meeting-page--minimal'];
  const messageInputId = meetingId ? `meeting-message-input-${meetingId}` : 'meeting-message-input';
  const isSendDisabled = messageDraft.trim().length === 0;
  const assistantInputId = meetingId
    ? `assistant-message-input-${meetingId}`
    : 'assistant-message-input';
  const isAssistantSendDisabled = assistantIsLoading || assistantDraft.trim().length === 0;

  if (shareExpanded && sharingParticipant) {
    meetingPageClasses.push('meeting-page--share-expanded');
  }
  const sidebarParticipants = React.useMemo(() => {
    if (!sharingParticipant) {
      return participants;
    }
    const others = participants.filter((participant) => participant.id !== sharingParticipant.id);
    if (sharingParticipant.id === 'self') {
      return [sharingParticipant, ...others];
    }
    return others;
  }, [participants, sharingParticipant]);

  useEffect(() => {
    const currentShareId = sharingParticipant?.id ?? null;
    // Expanded mode only toggled explicitly; remember last sharer for auto focus.
    lastShareIdRef.current = currentShareId;
  }, [sharingParticipant]);

  useEffect(() => {
    if (!isExitPromptOpen) {
      return;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCancelExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCancelExit, isExitPromptOpen]);

  useEffect(() => {
    const node = cameraVideoRef.current;
    if (!node) return;
    if (cameraStream) {
      node.srcObject = cameraStream;
      node.play().catch(() => {});
    } else {
      node.srcObject = null;
    }
  }, [cameraStream]);

  useEffect(() => {
    const node = screenVideoRef.current;
    if (!node) return;
    if (screenStream) {
      node.srcObject = screenStream;
      node.play().catch(() => {});
    } else {
      node.srcObject = null;
    }
  }, [screenStream, shareExpanded, sharingParticipant?.id]);

  useEffect(
    () => () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    },
    [cameraStream]
  );

  useEffect(
    () => () => {
      screenStream?.getTracks().forEach((track) => track.stop());
    },
    [screenStream]
  );

  useEffect(
    () => () => {
      micStream?.getTracks().forEach((track) => track.stop());
    },
    [micStream]
  );

  const getInitials = (name) =>
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase();

  const handleToggleShareLayout = useCallback(() => {
    if (sharingParticipant) {
      setShareExpanded((previous) => !previous);
    }
  }, [sharingParticipant]);

  const handleToggleTools = useCallback(() => {
    setIsToolsOpen((previous) => !previous);
  }, []);

  const handleToggleMessagePanel = useCallback(() => {
    setIsMessagePanelOpen((previous) => {
      const next = !previous;
      if (next) {
        setIsAiChatOpen(false);
      }
      return next;
    });
  }, []);

  const handleToggleAiChat = useCallback(() => {
    setIsAiChatOpen((previous) => {
      const next = !previous;
      if (next) {
        setIsMessagePanelOpen(false);
      }
      return next;
    });
  }, []);

  const handleSelectTool = useCallback(
    (toolId) => {
      if (toolId === 'whiteboard') {
        if (typeof window !== 'undefined') {
          const whiteboardUrl = new URL('/tools/stream/whiteboard', window.location.origin);
          if (meetingId) {
            whiteboardUrl.searchParams.set('meetingId', meetingId);
          }
          window.open(whiteboardUrl.toString(), '_blank', 'noopener,noreferrer');
        }
      } else if (toolId === 'invite') {
        if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
          const shareUrl = window.location.href;
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(shareUrl).catch((error) => {
              console.error('Unable to copy invite link', error);
            });
          }
        }
      }
      setIsToolsOpen(false);
    },
    [meetingId]
  );

  useEffect(() => {
    if (!isToolsOpen) {
      return;
    }
    const handleClickAway = (event) => {
      if (!toolsMenuRef.current?.contains(event.target)) {
        setIsToolsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsToolsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickAway);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickAway);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isToolsOpen]);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMessagePanelOpen(false);
        setIsAiChatOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen || drawerMode !== 'messages') {
      return;
    }
    const handle = window.setTimeout(() => {
      messageInputRef.current?.focus();
    }, 150);
    return () => window.clearTimeout(handle);
  }, [drawerMode, isDrawerOpen]);

  useEffect(() => {
    if (drawerMode !== 'messages') {
      return;
    }
    const node = messageListRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [drawerMode, messages]);

  useEffect(() => {
    if (drawerMode !== 'messages') {
      return;
    }
    const textarea = messageInputRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [drawerMode, messageDraft]);

  useEffect(() => {
    assistantMessagesRef.current = assistantMessages;
  }, [assistantMessages]);

  useEffect(() => {
    if (!isDrawerOpen || drawerMode !== 'assistant') {
      return;
    }
    const handle = window.setTimeout(() => {
      assistantInputRef.current?.focus();
    }, 150);
    return () => window.clearTimeout(handle);
  }, [drawerMode, isDrawerOpen]);

  useEffect(() => {
    if (drawerMode !== 'assistant') {
      return;
    }
    const node = assistantScrollRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [assistantMessages, assistantIsLoading, drawerMode]);

  useEffect(() => {
    if (drawerMode !== 'assistant') {
      return;
    }
    const textarea = assistantInputRef.current;
    if (!textarea) {
      return;
    }
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [assistantDraft, drawerMode]);

  const handleMessageDraftChange = useCallback((event) => {
    setMessageDraft(event.target.value);
  }, []);

  const sendMessage = useCallback(() => {
    const trimmed = messageDraft.trim();
    if (!trimmed) {
      return;
    }
    const newMessage = {
      id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: 'self',
      author: selfDisplayName,
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((previous) => [...previous, newMessage]);
    setMessageDraft('');
  }, [messageDraft, selfDisplayName]);

  const handleMessageSubmit = useCallback(
    (event) => {
      event.preventDefault();
      sendMessage();
    },
    [sendMessage]
  );

  const handleMessageKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleAssistantDraftChange = useCallback((event) => {
    setAssistantDraft(event.target.value);
  }, []);

  const sendAssistantPrompt = useCallback(
    async (inputText) => {
      const trimmed = inputText.trim();
      if (!trimmed || assistantIsLoading) {
        return;
      }
      if (!geminiApiKey) {
        setAssistantError('Gemini API key not found. Add VITE_GEMINI_API_KEY to your environment.');
        return;
      }
      const userMessage = {
        id: `assistant-user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      setAssistantMessages((previous) => [...previous, userMessage]);
      setAssistantDraft('');
      setAssistantError(null);
      setAssistantIsLoading(true);
      try {
        const historyForRequest = [
          ...assistantMessagesRef.current.slice(-MAX_ASSISTANT_HISTORY),
          userMessage,
        ];
        const payload = {
          contents: historyForRequest.map(({ role, text }) => ({
            role: role === 'assistant' ? 'model' : 'user',
            parts: [{ text }],
          })),
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 512,
          },
        };
        const response = await fetch(`${GEMINI_ENDPOINT}?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          const message = data?.error?.message ?? 'Gemini request failed.';
          throw new Error(message);
        }
        const replyParts = data?.candidates?.[0]?.content?.parts ?? [];
        const replyText = replyParts
          .map((part) => part?.text?.trim())
          .filter(Boolean)
          .join('\n\n')
          .trim();
        if (!replyText) {
          throw new Error('Gemini returned an empty response.');
        }
        const assistantMessage = {
          id: `assistant-model-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'assistant',
          text: replyText,
          createdAt: new Date().toISOString(),
        };
        setAssistantMessages((previous) => [...previous, assistantMessage]);
      } catch (error) {
        console.error('Gemini request failed', error);
        setAssistantError(error.message || 'Something went wrong while contacting Gemini.');
      } finally {
        setAssistantIsLoading(false);
      }
    },
    [assistantIsLoading, geminiApiKey]
  );

  const handleAssistantSubmit = useCallback(
    (event) => {
      event.preventDefault();
      sendAssistantPrompt(assistantDraft);
    },
    [assistantDraft, sendAssistantPrompt]
  );

  const handleAssistantKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendAssistantPrompt(assistantDraft);
      }
    },
    [assistantDraft, sendAssistantPrompt]
  );

  const handleAssistantSuggestion = useCallback(
    (prompt) => {
      sendAssistantPrompt(prompt);
    },
    [sendAssistantPrompt]
  );

  const renderParticipantTile = (
    participant,
    { showFullscreen = false, featured = false, variant = 'default' } = {}
  ) => {
    const { id, name, isSharingScreen: sharing, micMuted: muted, cameraOn: camOn } = participant;
    const ariaDescriptor = [
      sharing ? 'sharing screen' : null,
      muted ? 'muted' : 'unmuted',
      camOn ? 'camera on' : 'camera off',
    ]
      .filter(Boolean)
      .join(', ');

    const isSelf = id === 'self';

    let mediaContent = null;
    if (sharing) {
      if (isSelf && screenStream) {
        mediaContent = (
          <video
            ref={screenVideoRef}
            className="screen-video"
            autoPlay
            muted
            playsInline
          />
        );
      } else {
        mediaContent = (
          <div className="screen-placeholder">
            <span>{`${name}'s screen`}</span>
          </div>
        );
      }
    } else if (camOn) {
      if (isSelf && cameraStream) {
        mediaContent = (
          <video
            ref={cameraVideoRef}
            className="tile-video"
            autoPlay
            muted
            playsInline
          />
        );
      } else {
        mediaContent = (
          <div className="remote-camera-placeholder">
            <span>{getInitials(name)}</span>
          </div>
        );
      }
    } else {
      mediaContent = (
        <div className="tile-placeholder">
          <span className="tile-avatar" aria-hidden="true">
            {getInitials(name)}
          </span>
          <span className="tile-placeholder-name">{name}</span>
        </div>
      );
    }

    if (variant === 'sidebar') {
      let sidebarMedia = null;
      if (camOn) {
        if (isSelf && cameraStream) {
          sidebarMedia = (
            <video
              ref={cameraVideoRef}
              className="participant-card__video"
              autoPlay
              muted
              playsInline
            />
          );
        } else {
          sidebarMedia = (
            <div className="participant-card__video-placeholder" aria-hidden="true">
              <span>{getInitials(name)}</span>
            </div>
          );
        }
      } else {
        sidebarMedia = (
          <div className="participant-card__avatar" aria-hidden="true">
            {getInitials(name)}
          </div>
        );
      }

      return (
        <div
          key={id}
          className={`participant-card${isSelf ? ' participant-card--self' : ''}${
            muted ? ' participant-card--muted' : ''
          }${camOn ? ' participant-card--camera' : ''}`}
          aria-label={`${name}${ariaDescriptor ? `, ${ariaDescriptor}` : ''}`}
        >
          <div className="participant-card__media">{sidebarMedia}</div>
          <div className="participant-card__body">
            <div className="participant-card__name-row">
              <span className="participant-card__name">
                {name}
                {isSelf ? ' (You)' : ''}
              </span>
            </div>
            <div className="participant-card__status">
              <span className={`status-pill ${muted ? 'status-pill--muted' : 'status-pill--live'}`}>
                {muted ? 'Muted' : 'Live'}
              </span>
              <span className={`status-pill ${camOn ? 'status-pill--live' : 'status-pill--muted'}`}>
                {camOn ? 'Cam on' : 'Cam off'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <article
        key={id}
        className={`video-tile ${
          sharing ? 'video-tile--screen' : camOn ? 'video-tile--camera' : 'video-tile--voice'
        }${featured ? ' video-tile--featured' : ''}`}
        aria-label={`${name}${ariaDescriptor ? `, ${ariaDescriptor}` : ''}`}
      >
        <div className="tile-body" aria-hidden="true">
          {mediaContent}
        </div>
        {variant !== 'sidebar' && (
          <div className="tile-footer">
            <div className="tile-meta">
              <span className="name">{name}</span>
            </div>
            <div className="device-indicators">
              {id === 'self' ? (
                showFullscreen && (
                  <button
                    type="button"
                    className="device-pill device-pill--button"
                    onClick={handleToggleShareLayout}
                  >
                    {shareExpanded ? 'Exit fullscreen' : 'Fullscreen'}
                  </button>
                )
              ) : (
                <>
                  <span className={`device-pill ${muted ? 'device-pill--off' : 'device-pill--live'}`}>
                    {muted ? 'Muted' : 'Unmuted'}
                  </span>
                  <span className={`device-pill ${camOn ? 'device-pill--live' : 'device-pill--off'}`}>
                    {camOn ? 'Camera on' : 'Camera off'}
                  </span>
                  {showFullscreen && (
                    <button
                      type="button"
                      className="device-pill device-pill--button"
                      onClick={handleToggleShareLayout}
                    >
                      {shareExpanded ? 'Exit fullscreen' : 'Fullscreen'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </article>
    );
  };

  const controlActions = [
    {
      id: 'mic',
      isActive: !micMuted,
      onClick: toggleMic,
      icon: micMuted ? (
        <IconMicrophoneOff className="control-button__icon" />
      ) : (
        <IconMicrophone className="control-button__icon" />
      ),
      label: micMuted ? 'Unmute microphone' : 'Mute microphone',
    },
    {
      id: 'camera',
      isActive: cameraOn,
      onClick: toggleCamera,
      icon: cameraOn ? (
        <IconCamera className="control-button__icon" />
      ) : (
        <IconCameraOff className="control-button__icon" />
      ),
      label: cameraOn ? 'Turn camera off' : 'Turn camera on',
    },
    {
      id: 'screen',
      isActive: isSharingScreen,
      onClick: toggleScreenShare,
      icon: isSharingScreen ? (
        <IconScreenShareStop className="control-button__icon" />
      ) : (
        <IconScreenShare className="control-button__icon" />
      ),
      label: isSharingScreen ? 'Stop screen share' : 'Start screen share',
    },
    {
      id: 'chat',
      isActive: isMessagePanelOpen,
      onClick: handleToggleMessagePanel,
      icon: <IconChat className="control-button__icon" />,
      label: isMessagePanelOpen ? 'Hide meeting chat' : 'Show meeting chat',
    },
    {
      id: 'assistant',
      isActive: isAiChatOpen,
      onClick: handleToggleAiChat,
      icon: <IconSparkles className="control-button__icon" />,
      label: isAiChatOpen ? 'Hide AI assistant' : 'Show AI assistant',
    },
  ];

  return (
    <div className={meetingPageClasses.join(' ')}>
      <main className="meeting-main">
        <div
          className={[
            'meeting-stage',
            isDrawerOpen ? 'meeting-stage--with-panel' : null,
            drawerMode === 'assistant' && isDrawerOpen ? 'meeting-stage--assistant-open' : null,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="meeting-stage__primary">
            {shareExpanded && sharingParticipant ? (
              <section
                className={`share-layout${isDrawerOpen ? ' share-layout--solo' : ''}`}
                aria-label="Participants"
              >
                <div className="share-main">
                  {renderParticipantTile(sharingParticipant, {
                    showFullscreen: true,
                    featured: true,
                    variant: 'featured',
                  })}
                </div>
                {!isDrawerOpen && (
                  <aside className="share-sidebar" aria-label="Meeting participants">
                    <header className="share-sidebar__header">
                      <h2 className="share-sidebar__title">In this meeting</h2>
                      <span className="share-sidebar__count">
                        {totalParticipants} {totalParticipants === 1 ? 'person' : 'people'}
                      </span>
                    </header>
                    <div className="share-sidebar__list">
                      <div className="share-sidebar__scroll">
                        <div className="share-sidebar__items">
                          {sidebarParticipants.map((participant) =>
                            renderParticipantTile(participant, {
                              variant: 'sidebar',
                            })
                          )}
                          {sidebarParticipants.length === 0 && (
                            <div className="share-sidebar__empty">Waiting for others to join</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </aside>
                )}
              </section>
            ) : (
              <section className="video-grid" aria-label="Participants">
                {participants.map((participant) =>
                  renderParticipantTile(participant, {
                    showFullscreen: participant.id === sharingParticipant?.id,
                  })
                )}
              </section>
            )}
          </div>

          {isDrawerOpen && drawerMode && (
            <aside
              className={`meeting-drawer meeting-drawer--${drawerMode}`}
              role="complementary"
              aria-label={drawerMode === 'assistant' ? 'AI assistant panel' : 'Meeting chat panel'}
            >
              <header className="meeting-drawer__header">
                <h2 className="meeting-drawer__title">
                  {drawerMode === 'assistant' ? 'Studygo AI' : 'Meeting chat'}
                </h2>
              </header>
              <div
                className={[
                  'meeting-drawer__body',
                  drawerMode === 'messages' ? 'meeting-drawer__body--chat' : 'meeting-drawer__body--scroll',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {drawerMode === 'assistant' ? (
                  <div className="assistant-panel">
                    <div className="assistant-panel__intro">
                      <p className="assistant-panel__lead">
                        Ask Studygo AI to summarise ideas, polish notes, or suggest next study steps.
                      </p>
                      <ul className="assistant-suggestions">
                        {AI_SUGGESTIONS.map((prompt) => (
                          <li key={prompt}>
                            <button
                              type="button"
                              className="assistant-suggestion"
                              onClick={() => handleAssistantSuggestion(prompt)}
                              disabled={assistantIsLoading}
                            >
                              {prompt}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="assistant-thread" ref={assistantScrollRef} aria-live="polite">
                      {assistantMessages.length === 0 && !assistantIsLoading ? (
                        <div className="assistant-panel__empty">
                          <p className="assistant-panel__empty-title">No assistant replies yet</p>
                          <p className="assistant-panel__empty-copy">
                            Use a quick prompt above or ask Studygo AI anything related to your session.
                          </p>
                        </div>
                      ) : (
                        assistantMessages.map(({ id, role, text, createdAt }) => {
                          const timestamp = createdAt ? new Date(createdAt) : null;
                          const timeLabel =
                            timestamp && !Number.isNaN(timestamp.getTime())
                              ? timestamp.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                              : null;
                          return (
                            <div
                              key={id}
                              className={`assistant-message${
                                role === 'user' ? ' assistant-message--user' : ' assistant-message--model'
                              }`}
                            >
                              <div className="assistant-message__meta">
                                <span className="assistant-message__author">
                                  {role === 'user' ? 'You' : 'Studygo AI'}
                                </span>
                                {timeLabel ? (
                                  <time className="assistant-message__timestamp" dateTime={timestamp?.toISOString()}>
                                    {timeLabel}
                                  </time>
                                ) : null}
                              </div>
                              <p className="assistant-message__body">{text}</p>
                            </div>
                          );
                        })
                      )}
                      {assistantIsLoading && (
                        <div className="assistant-panel__status">
                          <span className="assistant-panel__spinner" aria-hidden="true" />
                          <span>Gemini is thinking…</span>
                        </div>
                      )}
                    </div>
                    {assistantError ? (
                      <div className="assistant-panel__error" role="alert">
                        {assistantError}
                      </div>
                    ) : null}
                    <form className="assistant-composer" onSubmit={handleAssistantSubmit}>
                      <div className="assistant-composer__field">
                        <label className="sr-only" htmlFor={assistantInputId}>
                          Ask Studygo AI
                        </label>
                        <textarea
                          id={assistantInputId}
                          ref={assistantInputRef}
                          className="assistant-composer__input"
                          value={assistantDraft}
                          onChange={handleAssistantDraftChange}
                          onKeyDown={handleAssistantKeyDown}
                          placeholder={
                            geminiApiKey
                              ? 'Ask a question or request a summary'
                              : 'Add your Gemini API key to enable the assistant'
                          }
                          disabled={assistantIsLoading}
                          rows={1}
                          autoComplete="off"
                        />
                        <button
                          type="submit"
                          className="assistant-composer__send"
                          disabled={isAssistantSendDisabled}
                        >
                          {assistantIsLoading ? 'Sending…' : 'Send'}
                        </button>
                      </div>
                      <p className="assistant-composer__hint">
                        Press Enter to send. Shift+Enter adds a new line.
                      </p>
                    </form>
                  </div>
                ) : (
                  <div className="message-panel">
                    <div className="message-panel__scroll" ref={messageListRef} aria-live="polite">
                      {messages.length === 0 ? (
                        <div className="message-panel__empty">
                          <p className="message-panel__empty-title">No messages yet</p>
                          <p className="message-panel__empty-copy">
                            Start the conversation by sending a message below.
                          </p>
                        </div>
                      ) : (
                        <ul className="message-list">
                          {messages.map(({ id, author, authorId, body, createdAt }) => {
                            const isSelfMessage = authorId === 'self';
                            let timestampNode = null;
                            if (createdAt) {
                              const date = new Date(createdAt);
                              if (!Number.isNaN(date.getTime())) {
                                const timeLabel = date.toLocaleTimeString([], {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                });
                                timestampNode = (
                                  <time className="message-item__timestamp" dateTime={date.toISOString()}>
                                    {timeLabel}
                                  </time>
                                );
                              }
                            }
                            return (
                              <li
                                key={id}
                                className={`message-item${isSelfMessage ? ' message-item--self' : ''}`}
                              >
                                <div className="message-item__meta">
                                  <span className="message-item__author">
                                    {isSelfMessage ? 'You' : author}
                                  </span>
                                  {timestampNode}
                                </div>
                                <p className="message-item__body">{body}</p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                    <form className="message-composer" onSubmit={handleMessageSubmit}>
                      <div className="message-composer__field">
                        <label className="sr-only" htmlFor={messageInputId}>
                          Message everyone
                        </label>
                        <textarea
                          id={messageInputId}
                          ref={messageInputRef}
                          className="message-composer__input"
                          value={messageDraft}
                          onChange={handleMessageDraftChange}
                          onKeyDown={handleMessageKeyDown}
                          placeholder="Type a message"
                          rows={1}
                          autoComplete="off"
                        />
                        <button type="submit" className="message-composer__send" disabled={isSendDisabled}>
                          Send
                        </button>
                      </div>
                      <p className="message-composer__hint">Press Enter to send. Shift+Enter adds a new line.</p>
                    </form>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </main>

      <footer className="meeting-controls">
        <div className="tools-menu" ref={toolsMenuRef}>
          <button
            type="button"
            className={`tools-button${isToolsOpen ? ' tools-button--active' : ''}`}
            onClick={handleToggleTools}
            aria-haspopup="true"
            aria-expanded={isToolsOpen}
          >
            <span className="tools-button__label">Tools</span>
            <span className="tools-button__chevron" aria-hidden="true" />
          </button>
          {isToolsOpen && (
            <div className="tools-panel" role="menu" aria-label="Meeting tools">
              <p className="tools-panel__headline">Quick actions</p>
              <button
                type="button"
                className="tools-panel__item"
                onClick={() => handleSelectTool('whiteboard')}
                role="menuitem"
              >
                <span className="tools-panel__title">Launch whiteboard</span>
                <span className="tools-panel__hint">Sketch ideas together</span>
              </button>
              <button
                type="button"
                className="tools-panel__item"
                onClick={() => handleSelectTool('notes')}
                role="menuitem"
              >
                <span className="tools-panel__title">Open shared notes</span>
                <span className="tools-panel__hint">Capture meeting follow-ups</span>
              </button>
              <button
                type="button"
                className="tools-panel__item"
                onClick={() => handleSelectTool('invite')}
                role="menuitem"
              >
                <span className="tools-panel__title">Copy invite link</span>
                <span className="tools-panel__hint">Share this room with others</span>
              </button>
            </div>
          )}
        </div>
        <div className="control-buttons" role="group" aria-label="Meeting controls">
          {controlActions.map(({ id, isActive, onClick, icon, label }) => (
            <button
              key={id}
              type="button"
              className={`control-button${isActive ? ' control-button--active' : ''}`}
              onClick={onClick}
              aria-pressed={isActive}
              title={label}
              data-control={id}
            >
              {icon}
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="leave-button"
          onClick={() => openExitPrompt('/')}
        >
          Leave
        </button>
      </footer>

      {isExitPromptOpen && (
        <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="exit-dialog-title">
          <div className="confirm-dialog">
            <h2 id="exit-dialog-title">Leave meeting?</h2>
            <p>Any unsaved changes will be lost. Are you sure you want to exit this meeting?</p>
            <div className="confirm-actions">
              <button type="button" className="confirm-button" onClick={handleCancelExit}>
                Stay in meeting
              </button>
              <button type="button" className="confirm-button confirm-button--danger" onClick={handleConfirmExit}>
                Leave meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;
