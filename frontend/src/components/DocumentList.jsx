import DownloadButton from './DownloadButton.jsx';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, userId, loading, error }) {
  if (loading) return <p className="list-state" role="status">Carregando documentos...</p>;
  if (error) return <p className="list-state error" role="alert">{error}</p>;
  if (documents.length === 0) return <p className="list-state">Nenhum documento encontrado.</p>;

  return (
    <div className="table-wrap">
      <table className="documents-table">
        <thead><tr><th>Nome</th><th>Tamanho</th><th>Data de envio</th><th><span className="visually-hidden">Ações</span></th></tr></thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id}>
              <td className="document-name">{document.originalName}</td>
              <td>{formatSize(document.size)}</td>
              <td>{new Date(document.uploadedAt).toLocaleDateString('pt-BR')}</td>
              <td className="action-cell"><DownloadButton document={document} userId={userId} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}