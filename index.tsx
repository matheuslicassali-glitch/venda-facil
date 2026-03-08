
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error: any) {
  console.error("Critical error during app mount:", error);
  // Show error on screen for easier debugging if it fails in production
  rootElement.innerHTML = `
    <div style="padding: 40px; background: white; border-radius: 20px; margin: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 2px solid #fee2e2;">
      <h1 style="color: #dc2626; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Falha ao Carregar o App</h1>
      <p style="color: #4b5563; font-weight: 600; font-size: 14px; margin-bottom: 10px;">Erro Detectado:</p>
      <pre style="background: #fdf2f2; padding: 20px; border-radius: 12px; color: #991b1b; font-size: 12px; overflow: auto; white-space: pre-wrap;">${error.message || error}</pre>
      <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">Dica: Verifique se todas as dependências foram instaladas e as variáveis de ambiente (Supabase) estão configuradas no Vercel.</p>
    </div>
  `;
}
