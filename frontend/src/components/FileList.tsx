import type { FileRecord } from '../api';

interface Props {
  files: FileRecord[];
  onDelete: (fileId: string) => void;
}

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fbbf2420', text: '#fbbf24' },
    processing: { bg: '#3b82f620', text: '#3b82f6' },
    indexed: { bg: '#22c55e20', text: '#22c55e' },
    error: { bg: '#ef444420', text: '#ef4444' },
  };
  const c = colors[status] || colors.pending;
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase',
    }}>
      {status}
    </span>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileList({ files, onDelete }: Props) {
  if (files.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#52525b', fontSize: 13 }}>
        No hay ficheros subidos
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {files.map(f => (
        <div key={f.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 10, padding: '12px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: '#2a2a3a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, color: '#a1a1aa', flexShrink: 0,
            }}>
              {f.original_name.split('.').pop()?.toUpperCase() || '?'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 500, color: '#e4e4e7',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {f.original_name}
              </p>
              <p style={{ fontSize: 11, color: '#52525b' }}>
                {formatSize(f.size_bytes)}
                {f.chunk_count > 0 && ` · ${f.chunk_count} chunks`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {statusBadge(f.status)}
            <button
              onClick={() => onDelete(f.id)}
              style={{
                background: 'transparent', border: 'none', color: '#52525b',
                cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '4px',
              }}
              title="Eliminar"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
