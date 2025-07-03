import { API_URL } from '../config/api';

class AuthService {
  constructor() {
    this.sessionId = null;
    this.user = null;
    this.activityTimer = null;
    this.sessionCheckInterval = null;
    this.inactivityTimeout = 10 * 60 * 1000; // 10 minutos em ms
    this.sessionCheckInterval = 30 * 1000; // Verifica sessão a cada 30s
    
    this.setupActivityTracking();
    this.startSessionCheck();
  }

  // Configurar rastreamento de atividade
  setupActivityTracking() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const resetTimer = () => {
      if (this.sessionId) {
        this.updateActivity();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });
  }

  // Atualizar atividade (renova a sessão)
  async updateActivity() {
    if (!this.sessionId) return;

    try {
      const response = await fetch(`${API_URL}/session-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Session ${this.sessionId}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        this.logout();
      }
    } catch (error) {
      console.log('Erro ao atualizar atividade:', error);
    }
  }

  // Verificar sessão periodicamente
  startSessionCheck() {
    this.sessionCheckInterval = setInterval(async () => {
      if (this.sessionId) {
        try {
          const response = await fetch(`${API_URL}/session-info`, {
            method: 'GET',
            headers: {
              'Authorization': `Session ${this.sessionId}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            this.user = data.user;
            
            // Se restam menos de 2 minutos, avisa o usuário
            if (data.session.time_remaining < 120) {
              this.showSessionWarning(data.session.time_remaining);
            }
          } else {
            this.logout();
          }
        } catch (error) {
          console.log('Erro na verificação de sessão:', error);
        }
      }
    }, this.sessionCheckInterval);
  }

  // Aviso de sessão prestes a expirar
  showSessionWarning(timeRemaining) {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    if (timeRemaining <= 60) {
      alert(`Sua sessão expirará em ${seconds} segundos. Clique em OK para renovar.`);
      this.updateActivity(); // Renova a sessão
    }
  }

  // Login
  async login(username, password) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        this.sessionId = data.session_id;
        this.user = data.user;
        
        console.log('✅ Login realizado:', this.user.username);
        return { success: true, user: this.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  // Logout
  async logout() {
    try {
      if (this.sessionId) {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Session ${this.sessionId}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.log('Erro no logout:', error);
    }

    // Limpa dados locais
    this.sessionId = null;
    this.user = null;

    // Para os timers
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Redireciona para login
    window.location.href = '/';
  }

  // Registrar usuário
  async register(username, password, phoneNumber) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username, 
          password, 
          phoneNumber,
          isAdmin: false 
        })
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  // Verificar se está logado
  isAuthenticated() {
    return this.sessionId !== null && this.user !== null;
  }

  // Obter usuário atual
  getCurrentUser() {
    return this.user;
  }

  // Obter session ID para requisições
  getSessionId() {
    return this.sessionId;
  }

  // Fazer requisição autenticada
  async authenticatedFetch(url, options = {}) {
    if (!this.sessionId) {
      throw new Error('Usuário não autenticado');
    }

    const headers = {
      'Authorization': `Session ${this.sessionId}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Sessão expirada');
    }

    return response;
  }
}

// Instância singleton
const authService = new AuthService();
export default authService;