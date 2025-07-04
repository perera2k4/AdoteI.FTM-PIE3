import { useEffect, useState } from 'react';
import { User, Clock, Shield } from 'lucide-react';
import authService from '../utils/auth';

const SessionInfo = () => {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessionInfo = async () => {
    try {
      console.log('📋 Buscando informações da sessão...');
      
      // Primeiro, tentar obter dados do usuário localmente
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        console.log('👤 Usuário local encontrado:', currentUser);
        setSessionData({
          username: currentUser.username,
          isAdmin: currentUser.isAdmin,
          loginTime: currentUser.loginTime || new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      // Se não houver dados locais, tentar buscar do servidor
      const response = await authService.authenticatedFetch('/session-info');
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados da sessão do servidor:', data);
        setSessionData(data);
      } else {
        console.warn('⚠️ Erro ao buscar sessão do servidor, usando dados locais');
        // Fallback para dados locais se servidor não responder
        const fallbackUser = authService.getCurrentUser();
        if (fallbackUser) {
          setSessionData({
            username: fallbackUser.username,
            isAdmin: fallbackUser.isAdmin,
            loginTime: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ Erro na sessão (componente):', err.message);
      
      // Fallback para dados locais em caso de erro
      const fallbackUser = authService.getCurrentUser();
      if (fallbackUser) {
        setSessionData({
          username: fallbackUser.username,
          isAdmin: fallbackUser.isAdmin,
          loginTime: new Date().toISOString()
        });
      } else {
        setError('Não foi possível carregar dados da sessão');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionInfo();
  }, []);

  const formatLoginTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('pt-BR');
    } catch {
      return 'Agora';
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-red-700">
            <Shield size={16} />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-blue-600" />
              <span className="font-medium text-gray-900">{sessionData.username}</span>
              {sessionData.isAdmin && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                  ADMIN
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} />
            <span className="text-sm">
              Conectado em {formatLoginTime(sessionData.loginTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionInfo;