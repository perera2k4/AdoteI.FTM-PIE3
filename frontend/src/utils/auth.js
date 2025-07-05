import { API_URL } from "../config/api";

class AuthService {
  constructor() {
    this.sessionId = null;
    this.user = null;
    this.sessionCheckInterval = null;
    this.isActive = false; // Controle para evitar requisições desnecessárias

    this.setupActivityTracking();
  }

  // Configurar rastreamento de atividade - SEM SPAM
  setupActivityTracking() {
    let activityTimeout;
    const ACTIVITY_DEBOUNCE = 5000; // 5 segundos entre atualizações

    const events = ["mousedown", "keypress", "click"];

    const handleActivity = () => {
      if (!this.sessionId || !this.isActive) return;

      // Debounce - evita spam de requisições
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        this.updateActivity();
      }, ACTIVITY_DEBOUNCE);
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
  }

  // Atualizar atividade (SEM SPAM)
  async updateActivity() {
    if (!this.sessionId || !this.isActive) return;

    try {
      const response = await fetch(`${API_URL}/session-info`, {
        method: "GET",
        headers: {
          Authorization: `Session ${this.sessionId}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.log("❌ Sessão inválida durante atividade");
        this.logout();
      }
    } catch (error) {
      
      // NÃO faz logout em erro de rede para evitar logout desnecessário
    }
  }

  // Verificar sessão periodicamente - CONTROLADO
  startSessionCheck() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      if (!this.sessionId || !this.isActive) return;

      try {
        const response = await fetch(`${API_URL}/session-info`, {
          method: "GET",
          headers: {
            Authorization: `Session ${this.sessionId}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          this.user = data.user;

          // Aviso apenas quando restam menos de 2 minutos
          if (
            data.session.time_remaining < 120 &&
            data.session.time_remaining > 60
          ) {
            this.showSessionWarning(data.session.time_remaining);
          }
        } else {
          console.log("🔓 Sessão expirada, fazendo logout");
          this.logout();
        }
      } catch (error) {
        console.log("⚠️ Erro na verificação de sessão:", error.message);
        // Em ambiente local com problemas de CORS, não faz logout automático
        if (
          window.location.hostname === "localhost" &&
          error.message.includes("Failed to fetch")
        ) {
          console.log("🏠 Ambiente local - erro de rede ignorado");
          return;
        }
        this.logout();
      }
    }, 60000); // Verifica a cada 1 minuto (não 30s)
  }

  // Para a verificação de sessão
  stopSessionCheck() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // Aviso de sessão prestes a expirar
  showSessionWarning(timeRemaining) {
    const minutes = Math.floor(timeRemaining / 60);

    if (
      confirm(`Sua sessão expirará em ${minutes} minuto(s). Deseja renovar?`)
    ) {
      this.updateActivity(); // Renova a sessão
    }
  }

  // Login
  async login(username, password) {
    try {
      console.log("🔐 Fazendo login...");

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Verifica formato da resposta
        if (data.session_id && data.user) {
          // Formato novo (com sessão)
          this.sessionId = data.session_id;
          this.user = data.user;
          this.isActive = true;
          this.startSessionCheck();
          console.log("✅ Login com sessão realizado:", this.user.username);
        } else if (data.token && (data.username || data.user)) {
          // Formato antigo (compatibilidade)
          this.sessionId = data.token;
          this.user = {
            username: data.username || data.user.username,
            isAdmin: data.isAdmin || data.user?.isAdmin || false,
            phoneNumber: data.user?.phoneNumber,
          };
          this.isActive = true;
          // NÃO inicia verificação para formato antigo (evita CORS)
          console.log("✅ Login compatível realizado:", this.user.username);
        } else {
          console.error("❌ Formato de resposta inválido:", data);
          return { success: false, error: "Formato de resposta inválido" };
        }

        return { success: true, user: this.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("❌ Erro no login:", error);
      return { success: false, error: "Erro de conexão" };
    }
  }

  // Logout
  async logout() {
    console.log("🔓 Iniciando logout...");

    this.isActive = false; // Para todas as verificações
    this.stopSessionCheck();

    try {
      if (this.sessionId) {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: {
            Authorization: `Session ${this.sessionId}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.log("⚠️ Erro no logout (ignorado):", error.message);
    }

    // Limpa dados locais
    this.sessionId = null;
    this.user = null;

    console.log("🔐 Logout realizado");

    // Redireciona para login
    window.location.href = "/";
  }

  // Registrar usuário
  async register(username, password, phoneNumber) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          phoneNumber,
          isAdmin: false,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      return { success: false, error: "Erro de conexão" };
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
      throw new Error("Usuário não autenticado");
    }

    // Constrói URL completa se não for absoluta
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    const headers = {
      Authorization: `Session ${this.sessionId}`,
      ...options.headers,
    };

    // Remove Content-Type se for FormData (deixa o browser definir)
    if (options.body instanceof FormData) {
      delete headers["Content-Type"];
      console.log("🔄 Enviando FormData, removendo Content-Type");
    } else if (!headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    console.log("🔄 Headers da requisição:", headers);
    console.log("🔄 URL completa da requisição:", fullUrl);

    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        console.log("❌ Sessão expirada na requisição");
        this.logout();
        throw new Error("Sessão expirada");
      }

      return response;
    } catch (error) {
      console.error("❌ Erro na requisição autenticada:", error);
      throw error;
    }
  }
}

// Instância singleton
const authService = new AuthService();
export default authService;