// Sempre usa o backend do Render (mesmo em desenvolvimento)
export const API_URL = 'https://adote-iftm-backend.onrender.com';

//console.log('🌐 Ambiente:', window.location.hostname);
//console.log('🔗 API_URL configurada:', API_URL);

/* VERSAO ESTÁVEL
// Detecta automaticamente o ambiente
const getApiUrl = () => {
  // Se estiver em produção (Vercel), usa a URL do backend
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://adote-iftm-backend.onrender.com/'; // SUBSTITUA pela sua URL real do Render
  }
  
  // Se estiver em desenvolvimento local
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  // Fallback para variável de ambiente
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

export const API_URL = getApiUrl();

console.log('🌐 Ambiente:', window.location.hostname);
console.log('🔗 API_URL configurada:', API_URL);
console.log('📝 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
*/