import { useState, useRef, useEffect } from 'react';
import type { Message } from '../api';
import MessageBubble from './MessageBubble';

interface Props {
  messages: Message[];
  onSend: (message: string) => void;
  sending: boolean;
}

export default function ChatWindow({ messages, onSend, sending }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 220px)',
      background: '#13131a', borderRadius: 12, border: '1px solid #2a2a3a',
      overflow: 'hidden',
    }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#52525b' }}>
            <p style={{ fontSize: 16, marginBottom: 4 }}>Pregunta sobre tus documentos</p>
            <p style={{ fontSize: 13 }}>Sube ficheros primero para poder chatear con ellos</p>
          </div>
        )}
        {messages.map(m => <MessageBubble key={m.id} message={m} />)}
        {sending && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: '#6366f1',
                animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
              }} />
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={{
        display: 'flex', gap: 10, padding: '12px 16px',
        borderTop: '1px solid #2a2a3a', background: '#1a1a24',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          disabled={sending}
          style={{
            flex: 1, padding: '10px 14px',
            background: '#13131a', border: '1px solid #2a2a3a', borderRadius: 8,
            color: '#e4e4e7', fontSize: 14, outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            background: sending ? '#4b5563' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            opacity: !input.trim() ? 0.5 : 1,
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
