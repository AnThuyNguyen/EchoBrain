import { useState } from 'react';

function ChatboxPanel({ onGenerateConceptsFromChat }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask me anything about your study material. AI responses are placeholder for now.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const userMessages = messages.filter((message) => message.role === 'user');

  const handleSend = () => {
    const prompt = draft.trim();
    if (!prompt) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: prompt },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Placeholder AI response: this is where EchoBrain coaching will appear.',
      },
    ]);
    setDraft('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="rounded-3xl border border-white/70 bg-[var(--panel)] p-5 shadow-2xl backdrop-blur-md sm:p-6">
      <h2 className="mb-4 text-lg font-bold">AI Chatbox</h2>

      <div className="mb-4 flex max-h-80 min-h-72 flex-col gap-3 overflow-y-auto rounded-2xl bg-white/70 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'ml-auto bg-[var(--accent)] text-white'
                : 'mr-auto border border-teal-100 bg-white text-[var(--text-main)]'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <label htmlFor="chatbox-input" className="sr-only">
        Ask the AI
      </label>
      <textarea
        id="chatbox-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        placeholder="Ask the AI about this concept..."
        className="w-full resize-none rounded-xl border border-teal-100 bg-white/90 p-3 text-sm text-[var(--text-main)] outline-none ring-[var(--accent)] transition focus:ring-2"
      />

      <button
        type="button"
        onClick={handleSend}
        className="mt-3 w-full rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
      >
        Send
      </button>

      <button
        type="button"
        onClick={() => onGenerateConceptsFromChat(userMessages.map((message) => message.text))}
        className="mt-2 w-full rounded-xl border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent)] transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Generate Concepts From AI Chat
      </button>
    </aside>
  );
}

export default ChatboxPanel;
