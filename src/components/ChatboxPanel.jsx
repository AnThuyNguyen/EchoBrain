import { useState } from 'react';

function ChatboxPanel({ onGenerateConceptsFromChat, apiUrl }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask me anything about your study material or learning strategies!',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasConversation = messages.some((message) => message.role !== 'assistant' || message.id !== 'welcome');

  const handleSend = async () => {
    const prompt = draft.trim();
    if (!prompt || isLoading) {
      return;
    }

    // Add user message
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: 'user', text: prompt },
    ]);
    setDraft('');
    setIsLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });

      let assistantText = 'Sorry, I could not generate a response. Please try again.';
      if (res.ok) {
        const data = await res.json();
        assistantText = data.response || assistantText;
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: assistantText },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', text: 'Error connecting to AI. Please check the backend.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <aside className="flex min-h-[20rem] w-full flex-1 flex-col rounded-3xl border border-gray-700 bg-[var(--panel)] p-3 shadow-2xl sm:p-5 lg:h-auto lg:flex-1">
      <h2 className="mb-2 text-base font-bold sm:mb-3 sm:text-lg">AI Chatbox</h2>

      <div className="mb-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-2xl bg-[#1a1a1a] p-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'ml-auto bg-[var(--accent)] text-white'
                : 'mr-auto border border-gray-600 bg-[#2a2a2a] text-[var(--text-main)]'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <label htmlFor="chatbox-input" className="sr-only">
        Ask the AI
      </label>
      <div className="mt-1 flex items-center gap-2">
        <textarea
          id="chatbox-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={2}
          placeholder="Ask the AI about this concept..."
          className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-gray-600 bg-[#2a2a2a] p-2.5 text-sm text-[var(--text-main)] outline-none ring-[var(--accent)] transition focus:ring-2 disabled:opacity-50"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={isLoading || !draft.trim()}
          aria-label={isLoading ? 'Sending message' : 'Send message'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] text-xs font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? '...' : '>'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => onGenerateConceptsFromChat(messages)}
        disabled={isLoading || !hasConversation}
        className="mt-2 w-full rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Generate Concepts
      </button>
    </aside>
  );
}

export default ChatboxPanel;
