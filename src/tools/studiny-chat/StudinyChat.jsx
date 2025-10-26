import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from 'https://esm.sh/@google/genai';
import ReactMarkdown from 'https://esm.sh/react-markdown';
import remarkGfm from 'https://esm.sh/remark-gfm';
import {
  Copy,
  Download,
  FileText,
  Send,
  Loader,
  RefreshCw,
} from 'https://esm.sh/lucide-react';

import AppLogo from './AppLogo';
import './StudinyChat.css';

const defaultApiKey =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_GEMINI_API_KEY
    : undefined;

const externalLibraries = [
  {
    id: 'studiny-chat-jspdf',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    check: () => typeof window !== 'undefined' && !!window.jspdf?.jsPDF,
  },
  {
    id: 'studiny-chat-marked',
    src: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    check: () => typeof window !== 'undefined' && !!window.marked?.lexer,
  },
];

const ensureScript = ({ id, src, check }) => {
  if (check()) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);

    const handleLoad = () => resolve();
    const handleError = () => reject(new Error(`Failed to load ${src}`));

    if (existing) {
      existing.addEventListener('load', handleLoad, { once: true });
      existing.addEventListener('error', handleError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    document.body.appendChild(script);
  });
};

const loadExternalLibraries = () =>
  Promise.all(externalLibraries.map((lib) => ensureScript(lib))).catch(
    (error) => {
      console.error('Failed to load supporting libraries.', error);
    }
  );

const generatePdfFromMarkdown = (markdown, title) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!window.jspdf?.jsPDF || !window.marked?.lexer) {
    alert(
      'The PDF exporter is still loading. Please try again in a moment.'
    );
    return;
  }

  const { jsPDF } = window.jspdf;
  const tokens = window.marked.lexer(markdown || '');
  const docTitle = (title || 'Document').trim() || 'Document';
  const filename = docTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const pdf = new jsPDF('p', 'pt', 'a4');

  const page = {
    width: pdf.internal.pageSize.getWidth(),
    height: pdf.internal.pageSize.getHeight(),
    margin: { top: 72, right: 72, bottom: 72, left: 72 },
  };

  const contentWidth = page.width - page.margin.left - page.margin.right;
  let cursor = { y: page.margin.top };

  const checkPageBreak = (elementHeight) => {
    if (cursor.y + elementHeight > page.height - page.margin.bottom) {
      pdf.addPage();
      cursor.y = page.margin.top;
    }
  };

  pdf.setFont('Helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.text(docTitle, page.margin.left, cursor.y);
  cursor.y += 40;

  tokens.forEach((token) => {
    switch (token.type) {
      case 'heading': {
        const fontSize = 22 - token.depth * 2;
        checkPageBreak(fontSize + 10);
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(token.text, contentWidth);
        pdf.text(lines, page.margin.left, cursor.y);
        cursor.y += lines.length * fontSize * 0.7 + 10;
        break;
      }
      case 'paragraph': {
        checkPageBreak(12);
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(11);
        const text = token.text.replace(/(\r\n|\n|\r)/gm, ' ').replace(/\s+/g, ' ');
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, page.margin.left, cursor.y, { align: 'justify' });
        cursor.y += lines.length * 11 * 0.9 + 12;
        break;
      }
      case 'list': {
        token.items.forEach((item, index) => {
          checkPageBreak(12);
          pdf.setFont('Helvetica', 'normal');
          pdf.setFontSize(11);
          const prefix = token.ordered ? `${index + 1}. ` : '• ';
          const itemText = item.text;
          const lines = pdf.splitTextToSize(itemText, contentWidth - 20);
          pdf.text(prefix, page.margin.left, cursor.y);
          pdf.text(lines, page.margin.left + 20, cursor.y);
          cursor.y += lines.length * 11 * 0.9 + 5;
        });
        cursor.y += 10;
        break;
      }
      case 'space': {
        cursor.y += token.raw.split('\n').length * 8;
        break;
      }
      case 'code': {
        const fontSize = 9;
        const lineHeight = fontSize * 1.2;
        const lines = token.text.split('\n');
        const blockHeight = lines.length * lineHeight + 10;
        checkPageBreak(blockHeight + 20);
        pdf.setFont('Courier', 'normal');
        pdf.setFontSize(fontSize);
        pdf.setFillColor(245, 245, 245);
        pdf.rect(page.margin.left, cursor.y - lineHeight, contentWidth, blockHeight, 'F');
        pdf.setTextColor(50, 50, 50);
        pdf.text(lines, page.margin.left + 10, cursor.y + 5);
        cursor.y += blockHeight;
        pdf.setTextColor(0, 0, 0);
        break;
      }
      case 'hr': {
        checkPageBreak(15);
        pdf.setDrawColor(200, 200, 200);
        pdf.line(
          page.margin.left,
          cursor.y,
          page.width - page.margin.right,
          cursor.y
        );
        cursor.y += 15;
        break;
      }
      default:
        break;
    }
  });

  pdf.save(`${filename || 'studiny-chat-export'}.pdf`);
};

const ChatInput = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 140;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, [input]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="studiny-chat__input-area">
      <div className="studiny-chat__input-wrapper">
        <form className="studiny-chat__form" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder="Generate a document about..."
            className="studiny-chat__textarea"
            rows={1}
            disabled={isLoading}
            aria-label="Chat input"
          />
          <button
            type="submit"
            className="studiny-chat__send-button"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
          >
            {isLoading ? <Loader size={18} className="studiny-chat__spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

const Skeleton = () => (
  <div className="studiny-chat__skeleton" aria-hidden="true">
    <div className="studiny-chat__skeleton-line studiny-chat__skeleton-line--long" />
    <div className="studiny-chat__skeleton-line studiny-chat__skeleton-line--medium" />
    <div className="studiny-chat__skeleton-line studiny-chat__skeleton-line--long" />
    <div className="studiny-chat__skeleton-line studiny-chat__skeleton-line--short" />
  </div>
);

export default function StudinyChat({
  apiKey = defaultApiKey,
  className = '',
  title = 'Studiny Chat',
  onBackClick,
}) {
  const [markdownContent, setMarkdownContent] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    loadExternalLibraries();
  }, []);

  const initChat = useCallback(() => {
    if (!apiKey) {
      console.error('VITE_GEMINI_API_KEY environment variable not set.');
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      chatRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
      });
    } catch (error) {
      console.error('Error initializing chat:', error);
      alert(
        'Failed to initialise the chat service. Check your API key and console for details.'
      );
    }
  }, [apiKey]);

  useEffect(() => {
    initChat();
  }, [initChat]);

  const handleSend = async (userInput) => {
    if (!apiKey) {
      alert('API Key is not configured. Please provide a Gemini API key.');
      return;
    }

    if (!chatRef.current) {
      alert('Chat is not initialised yet. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setLastPrompt(userInput);
    setMarkdownContent('');

    try {
      const result = await chatRef.current.sendMessageStream({
        message: `Generate a comprehensive document about the following topic. Format the entire response in Markdown. Topic: "${userInput}"`,
      });
      let text = '';
      for await (const chunk of result) {
        text += chunk.text;
        setMarkdownContent(text);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMarkdownContent(
        'Sorry, I encountered an error while generating the document. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (lastPrompt && !isLoading) {
      handleSend(lastPrompt);
    }
  };

  const handleCopy = () => {
    if (!navigator?.clipboard) {
      alert('Clipboard access is not available in this browser.');
      return;
    }
    navigator.clipboard.writeText(markdownContent || '');
  };

  const handleExportMarkdown = () => {
    const blob = new Blob([markdownContent], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const filename = (lastPrompt || 'studiny-chat-export')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename || 'studiny-chat-export'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    generatePdfFromMarkdown(markdownContent, lastPrompt);
  };

  const containerClassName = ['studiny-chat', className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      <header className="studiny-chat__header">
        <div className="studiny-chat__header-content">
          <button
            type="button"
            className="studiny-chat__back-button"
            onClick={onBackClick}
          >
            Back to Tools
          </button>
          <div className="studiny-chat__brand">
            <AppLogo className="studiny-chat__logo" />
            <h1 className="studiny-chat__title">{title}</h1>
          </div>
        </div>
      </header>

      <main className="studiny-chat__main">
        <div className="studiny-chat__container">
          {!lastPrompt && !isLoading ? (
            <div className="studiny-chat__empty">
              <div className="studiny-chat__empty-avatar">
                <AppLogo className="studiny-chat__logo" />
              </div>
              <h2 className="studiny-chat__empty-title">{title}</h2>
              <p className="studiny-chat__empty-description">
                Generate a document by typing a topic below.
              </p>
              {!apiKey && (
                <p className="studiny-chat__empty-description studiny-chat__muted">
                  Add your Gemini API key to begin.
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="studiny-chat__panel-header">
                <h2 className="studiny-chat__panel-title" title={lastPrompt}>
                  {lastPrompt}
                </h2>
                <div className="studiny-chat__panel-actions">
                  <button
                    type="button"
                    className="studiny-chat__icon-button"
                    onClick={handleRegenerate}
                    disabled={isLoading}
                    title="Regenerate response"
                  >
                    <RefreshCw
                      size={16}
                      className={isLoading ? 'studiny-chat__spin' : undefined}
                    />
                  </button>
                  <button
                    type="button"
                    className="studiny-chat__icon-button"
                    onClick={handleCopy}
                    title="Copy"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    type="button"
                    className="studiny-chat__icon-button"
                    onClick={handleExportMarkdown}
                    title="Export as Markdown"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    type="button"
                    className="studiny-chat__icon-button"
                    onClick={handleExportPdf}
                    title="Export as PDF"
                  >
                    <FileText size={16} />
                  </button>
                </div>
              </div>

              {isLoading && !markdownContent && <Skeleton />}

              <div className="studiny-chat__markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {markdownContent}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </main>

      <ChatInput onSend={handleSend} isLoading={isLoading} />
      <div className="studiny-chat__footer-space" />
      <span className="studiny-chat__sr-only" aria-live="polite">
        {isLoading ? 'Generating response' : 'Ready'}
      </span>
    </div>
  );
}
