import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Project } from '../api';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.listProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const project = await api.createProject(name.trim(), desc.trim() || undefined);
      setProjects(prev => [project, ...prev]);
      setName('');
      setDesc('');
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este proyecto y todos sus ficheros?')) return;
    await api.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const cardStyle: React.CSSProperties = {
    background: '#1a1a24',
    border: '1px solid #2a2a3a',
    borderRadius: 12,
    padding: 20,
    cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const btnDanger: React.CSSProperties = {
    background: 'transparent',
    color: '#ef4444',
    border: '1px solid #ef444440',
    borderRadius: 6,
    padding: '6px 12px',
    fontSize: 12,
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: '#13131a',
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    color: '#e4e4e7',
    fontSize: 14,
    outline: 'none',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#71717a' }}>Cargando...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>Proyectos</h1>
        <button style={btnPrimary} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Proyecto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ ...cardStyle, cursor: 'default', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              style={inputStyle}
              placeholder="Nombre del proyecto"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            <input
              style={inputStyle}
              placeholder="Descripción (opcional)"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
            <button type="submit" style={{ ...btnPrimary, opacity: creating ? 0.6 : 1 }} disabled={creating}>
              {creating ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60, color: '#71717a',
          background: '#1a1a24', borderRadius: 12, border: '1px dashed #2a2a3a',
        }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>No hay proyectos todavia</p>
          <p style={{ fontSize: 13 }}>Crea tu primer proyecto para empezar a subir documentos</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <div
              key={p.id}
              style={cardStyle}
              onClick={() => navigate(`/projects/${p.id}`)}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#6366f1';
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#2a2a3a';
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{p.name}</h3>
                  {p.description && (
                    <p style={{ fontSize: 13, color: '#71717a' }}>{p.description}</p>
                  )}
                </div>
                <button
                  style={btnDanger}
                  onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                >
                  Eliminar
                </button>
              </div>
              <p style={{ fontSize: 11, color: '#52525b', marginTop: 12 }}>
                {new Date(p.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
