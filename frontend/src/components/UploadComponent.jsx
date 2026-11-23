import { useState } from 'react';

export default function UploadComponent({ onUpload }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) return;

    const form = event.currentTarget;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      await onUpload(file);
      form.reset();
      setFile(null);
      setMessage('Documento enviado com sucesso.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="file-field">
        <label htmlFor="document-file">Selecione um arquivo</label>
        <input id="document-file" type="file" onChange={(event) => { setFile(event.target.files[0] || null); setMessage(''); setError(''); }} disabled={uploading} required />
      </div>
      <button className="primary-button" type="submit" disabled={!file || uploading}>
        {uploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {message && <p className="form-message success" role="status">{message}</p>}
      {error && <p className="form-message error" role="alert">{error}</p>}
    </form>
  );
}