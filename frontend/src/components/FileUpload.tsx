import { useState, useRef } from 'react';

interface Props {
  onUpload: (file: File) => Promise<void>;
}

const ALLOWED = '.pdf,.txt,.md,.csv';

export default function FileUpload({ onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#6366f1' : '#2a2a3a'}`,
        borderRadius: 12,
        padding: '32px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? '#6366f110' : '#1a1a24',
        transition: 'all 0.2s',
        marginBottom: 20,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED}
        style={{ display: 'none' }}
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <p style={{ color: '#6366f1', fontSize: 14 }}>Subiendo...</p>
      ) : (
        <>
          <p style={{ color: '#a1a1aa', fontSize: 14, marginBottom: 4 }}>
            Arrastra un fichero o haz clic para seleccionar
          </p>
          <p style={{ color: '#52525b', fontSize: 12 }}>PDF, TXT, Markdown, CSV (max 20MB)</p>
        </>
      )}
    </div>
  );
}
