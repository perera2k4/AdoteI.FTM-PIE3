// Configuração correta da API (SEM barra no final)
const getApiUrl = () => {
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://adote-iftm-backend.onrender.com'; // SEM barra no final
  }
  
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

export const API_URL = getApiUrl();

console.log('🌐 Ambiente:', window.location.hostname);
console.log('🔗 API_URL configurada:', API_URL);
console.log('📝 REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// Teste de conexão
fetch(`${API_URL}/`)
  .then(response => response.json())
  .then(data => console.log('✅ API conectada:', data))
  .catch(error => console.log('❌ Erro na API:', error));