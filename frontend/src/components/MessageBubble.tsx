import type { Message } from '../api';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '10px 16px',
        borderRadius: 12,
        background: isUser ? '#6366f1' : '#1e1e2e',
        color: isUser ? '#fff' : '#e4e4e7',
        fontSize: 14,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {message.content}

        {message.sources && message.sources.length > 0 && (
          <div style={{
            marginTop: 10, paddingTop: 10,
            borderTop: `1px solid ${isUser ? '#ffffff30' : '#2a2a3a'}`,
          }}>
            <p style={{ fontSize: 11, color: isUser ? '#c7d2fe' : '#71717a', marginBottom: 6, fontWeight: 600 }}>
              Fuentes:
            </p>
            {message.sources.map((s, i) => (
              <div key={i} style={{
                fontSize: 11, color: isUser ? '#c7d2fe' : '#71717a',
                padding: '4px 8px', background: isUser ? '#ffffff10' : '#13131a',
                borderRadius: 6, marginBottom: 4,
              }}>
                <span style={{ opacity: 0.6 }}>[{(s.score * 100).toFixed(0)}%]</span> {s.text}...
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
