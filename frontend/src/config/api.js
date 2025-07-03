// filepath: frontend/src/config/api.js
// Configuração da API baseada no ambiente
export const API_URL = import.meta.env.PROD 
  ? 'https://your-vercel-app.vercel.app/api'  // Substitua pela sua URL do Vercel
  : 'http://localhost:3000';

// Configuração adicional para produção
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 10000 // 10 segundos
};

console.log('🌐 API URL:', API_URL);
console.log('🏗️ Ambiente:', import.meta.env.MODE);


/* 
// Sempre usa o backend do Render (mesmo em desenvolvimento)
export const API_URL = 'https://adote-iftm-backend.onrender.com';

console.log('🌐 Ambiente:', window.location.hostname);
console.log('🔗 API_URL configurada:', API_URL);




VERSAO ESTÁVEL -----------------


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