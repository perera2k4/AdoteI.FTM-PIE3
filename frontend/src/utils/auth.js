import { API_URL } from '../config/api';

class AuthService {
  constructor() {
    this.user = null;
    this.isLoggedIn = false;
    this.sessionCheckInterval = null;
    this.activityCheckInterval = null;
    this.lastActivity = Date.now();
    
    // Inicializar o serviço
    this.init();
  }

  init() {
    console.log('🔐 Inicializando AuthService...');
    
    // Verificar se há uma sessão salva
    this.loadFromStorage();
    
    // Configurar monitoramento de atividade
    this.setupActivityMonitoring();
    
    // Verificar sessão no servidor
    this.verifySession();
  }

  loadFromStorage() {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        this.user = JSON.parse(savedUser);
        this.isLoggedIn = true;
        console.log('👤 Usuário carregado do localStorage:', this.user);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados do localStorage:', error);
      this.clearStorage();
    }
  }

  saveToStorage() {
    try {
      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user));
        console.log('💾 Dados salvos no localStorage');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar no localStorage:', error);
    }
  }

  clearStorage() {
    try {
      localStorage.removeItem('user');
      console.log('🗑️ localStorage limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar localStorage:', error);
    }
  }

  setupActivityMonitoring() {
    // Atualizar atividade em eventos do usuário
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      this.lastActivity = Date.now();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Verificar atividade periodicamente
    this.activityCheckInterval = setInterval(() => {
      this.updateActivity();
    }, 60000); // A cada minuto
  }

  async updateActivity() {
    if (!this.isLoggedIn) return;

    try {
      const response = await fetch(`${API_URL}/session-info`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Sessão expirada');
      }

      const data = await response.json();
      if (data.username) {
        this.user = data;
        this.saveToStorage();
      }
    } catch (error) {
      console.log('⚠️ Erro na atualização de atividade (ignorado):', error.message);
    }
  }

  async verifySession() {
    if (!this.isLoggedIn) return;

    try {
      const response = await fetch(`${API_URL}/session-info`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data;
        this.isLoggedIn = true;
        this.saveToStorage();
        console.log('✅ Sessão verificada:', data.username);
      } else {
        throw new Error('Sessão inválida');
      }
    } catch (error) {
      console.log('⚠️ Erro na verificação de sessão:', error.message);
      
      // Se estivermos em ambiente local, ignorar erro de rede
      if (window.location.hostname === 'localhost') {
        console.log('🏠 Ambiente local - erro de rede ignorado');
        return;
      }
      
      // Em produção, limpar dados inválidos
      this.logout();
    }
  }

  async login(credentials) {
    try {
      console.log('🔐 Fazendo login...');
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        this.user = data.user;
        this.isLoggedIn = true;
        this.saveToStorage();
        console.log('✅ Login com sessão realizado:', data.user.username);
        return { success: true, user: data.user };
      } else {
        console.error('❌ Erro no login:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erro na requisição de login:', error);
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  }

  async register(userData) {
    try {
      console.log('📝 Registrando usuário...');
      
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Usuário registrado com sucesso');
        return { success: true, message: data.message };
      } else {
        console.error('❌ Erro no registro:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erro na requisição de registro:', error);
      return { success: false, error: 'Erro de conexão com o servidor' };
    }
  }

  async logout() {
    try {
      console.log('👋 Fazendo logout...');
      
      // Limpar dados locais primeiro
      this.user = null;
      this.isLoggedIn = false;
      this.clearStorage();

      // Limpar intervalos
      if (this.sessionCheckInterval) {
        clearInterval(this.sessionCheckInterval);
      }
      if (this.activityCheckInterval) {
        clearInterval(this.activityCheckInterval);
      }

      // Tentar fazer logout no servidor
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.log('⚠️ Erro ao fazer logout no servidor (ignorado):', error.message);
      }

      console.log('✅ Logout realizado');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      return { success: false, error: 'Erro no logout' };
    }
  }

  getCurrentUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.isLoggedIn && this.user !== null;
  }

  isAdmin() {
    return this.isAuthenticated() && this.user.isAdmin === true;
  }

  getToken() {
    // Para autenticação baseada em sessão, não precisamos de token
    return null;
  }

  async authenticatedFetch(url, options = {}) {
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      // Se não autenticado, redirecionar para login
      if (response.status === 401) {
        console.log('🔐 Não autenticado, redirecionando...');
        this.logout();
        window.location.href = '/';
        return;
      }

      return response;
    } catch (error) {
      console.error('❌ Erro na requisição autenticada:', error);
      throw error;
    }
  }
}

// Instância única do serviço
const authService = new AuthService();

export default authService;