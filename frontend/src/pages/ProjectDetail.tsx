import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Project, type FileRecord, type Message, type ChatResponse } from '../api';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';
import ChatWindow from '../components/ChatWindow';

type Tab = 'files' | 'chat';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<Tab>('files');
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    api.getProject(id).then(setProject).catch(() => navigate('/'));
    api.listFiles(id).then(setFiles);
    api.getMessages(id).then(setMessages);
  }, [id, navigate]);

  useEffect(() => {
    if (!id) return;
    const hasPending = files.some(f => f.status === 'processing');
    if (hasPending) {
      pollRef.current = setInterval(async () => {
        const updated = await api.listFiles(id);
        setFiles(updated);
        if (!updated.some(f => f.status === 'processing')) {
          clearInterval(pollRef.current);
        }
      }, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [id, files]);

  const handleUpload = async (file: File) => {
    if (!id) return;
    const result = await api.uploadFile(id, file);
    setFiles(prev => [{
      id: result.id,
      project_id: id,
      filename: '',
      original_name: result.original_name,
      mime_type: '',
      size_bytes: file.size,
      chunk_count: 0,
      status: result.status,
      created_at: new Date().toISOString(),
    }, ...prev]);
  };

  const handleDeleteFile = async (fileId: string) => {
    await api.deleteFile(fileId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSend = async (message: string) => {
    if (!id || sending) return;
    setSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      project_id: id,
      role: 'user',
      content: message,
      sources: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res: ChatResponse = await api.chat(id, message);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        project_id: id,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        project_id: id,
        role: 'assistant',
        content: 'Error al generar respuesta. Intenta de nuevo.',
        sources: null,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  if (!project) return <div style={{ textAlign: 'center', padding: 60, color: '#71717a' }}>Cargando...</div>;

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    background: active ? '#6366f1' : 'transparent',
    color: active ? '#fff' : '#71717a',
    borderRadius: 8,
    transition: 'all 0.2s',
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8,
            color: '#71717a', padding: '6px 12px', fontSize: 13, cursor: 'pointer',
          }}
        >
          &larr; Volver
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{project.name}</h1>
          {project.description && <p style={{ fontSize: 13, color: '#71717a' }}>{project.description}</p>}
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: '#13131a', padding: 4, borderRadius: 10, width: 'fit-content',
      }}>
        <button style={tabStyle(tab === 'files')} onClick={() => setTab('files')}>
          Ficheros ({files.length})
        </button>
        <button style={tabStyle(tab === 'chat')} onClick={() => setTab('chat')}>
          Chat
        </button>
      </div>

      {tab === 'files' ? (
        <div>
          <FileUpload onUpload={handleUpload} />
          <FileList files={files} onDelete={handleDeleteFile} />
        </div>
      ) : (
        <ChatWindow messages={messages} onSend={handleSend} sending={sending} />
      )}
    </div>
  );
}
