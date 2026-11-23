import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent.jsx';
import DocumentList from './components/DocumentList.jsx';
import { listDocuments, uploadDocument } from './services/documentApi.js';
import './App.css';

function DocumentWorkspace({ userId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    listDocuments(userId)
      .then((result) => {
        if (active) setDocuments(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [userId, refreshVersion]);

  async function handleUpload(file) {
    await uploadDocument(userId, file);
    setRefreshVersion((version) => version + 1);
  }

  return (
    <>
      <section className="upload-section" aria-labelledby="upload-title">
        <div className="section-heading">
          <div>
            <span className="section-number">01 / ENVIO</span>
            <h2 id="upload-title">Adicionar documento</h2>
          </div>
          <span className="section-note">Arquivos pessoais</span>
        </div>
        <UploadComponent onUpload={handleUpload} />
      </section>

      <section className="documents-section" aria-labelledby="documents-title">
        <div className="section-heading documents-heading">
          <div>
            <span className="section-number">02 / ACERVO</span>
            <h2 id="documents-title">Seus documentos</h2>
          </div>
          <button className="text-button" type="button" onClick={() => setRefreshVersion((version) => version + 1)} disabled={loading}>
            Atualizar lista
          </button>
        </div>
        <DocumentList documents={documents} userId={userId} loading={loading} error={error} />
      </section>
    </>
  );
}

export default function App() {
  const [userInput, setUserInput] = useState('');
  const [userId, setUserId] = useState('');

  function handleUserSubmit(event) {
    event.preventDefault();
    const nextUserId = userInput.trim();
    if (nextUserId) {
      setUserInput(nextUserId);
      setUserId(nextUserId);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="/" aria-label="Arquivo, início">
            <span className="brand-mark" aria-hidden="true">A</span>
            <span>arquivo<span className="brand-dot">.</span></span>
          </a>
          <span className="topbar-label">GESTÃO DE DOCUMENTOS</span>
        </div>
      </header>

      <main className="main-content">
        <div className="page-intro">
          <div>
            <span className="eyebrow">SEU ESPAÇO DE TRABALHO</span>
            <h1>Documentos</h1>
            <p>Seu acervo, organizado em um só lugar.</p>
          </div>
          {userId && <div className="active-user"><span className="status-dot" /> Usuário: <strong>{userId}</strong></div>}
        </div>

        <form className="user-form" onSubmit={handleUserSubmit}>
          <div className="user-field">
            <label htmlFor="user-id">Identificação do usuário</label>
            <input id="user-id" value={userInput} onChange={(event) => setUserInput(event.target.value)} placeholder="Informe seu identificador" required />
          </div>
          <button className="secondary-button" type="submit">Acessar documentos</button>
        </form>

        {userId ? (
          <DocumentWorkspace key={userId} userId={userId} />
        ) : (
          <div className="welcome-state">Informe sua identificação para acessar seus documentos.</div>
        )}
      </main>
      <footer className="footer"><span>ARQUIVO / DOCUMENTOS</span><span>Seu espaço de trabalho</span></footer>
    </div>
  );
}
