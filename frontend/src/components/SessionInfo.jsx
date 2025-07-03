import { useState, useEffect } from "react";
import authService from "../utils/auth";
import { API_URL } from "../config/api";

export default function SessionInfo() {
  const [sessionData, setSessionData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      if (!authService.isAuthenticated() || isLoading) return;

      setIsLoading(true);
      
      try {
        const response = await authService.authenticatedFetch(`${API_URL}/session-info`);
        
        if (response.ok) {
          const data = await response.json();
          setSessionData(data);
        } else {
          console.log('❌ Erro ao buscar sessão:', response.status);
          setSessionData(null);
        }
      } catch (error) {
        console.log('⚠️ Erro na sessão (componente):', error.message);
        
        // Se for erro de rede em localhost, mostra dados básicos
        if (window.location.hostname === 'localhost' && error.message.includes('Failed to fetch')) {
          const user = authService.getCurrentUser();
          if (user) {
            setSessionData({
              user,
              session: {
                time_remaining: 300, // Mostra 5 minutos como placeholder
                expires_at: new Date(Date.now() + 300000).toISOString()
              }
            });
          }
        } else {
          setSessionData(null);
        }
      }
      
      setIsLoading(false);
    };

    fetchSessionInfo();
    
    // Atualiza a cada 1 minuto (não 30s)
    const interval = setInterval(fetchSessionInfo, 60000);
    
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!sessionData || !authService.isAuthenticated()) return null;

  const timeRemaining = sessionData.session.time_remaining || 300;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed top-20 right-4 z-30">
      <div 
        className="bg-white shadow-lg rounded-lg p-3 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            timeRemaining > 300 ? 'bg-green-400' : 
            timeRemaining > 120 ? 'bg-yellow-400' : 
            'bg-red-400'
          }`}></div>
          <span className="text-sm font-medium">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          {window.location.hostname === 'localhost' && timeRemaining === 300 && (
            <span className="text-xs text-gray-500">(local)</span>
          )}
        </div>
        
        {showDetails && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600">
            <p><strong>Usuário:</strong> {sessionData.user.username}</p>
            <p><strong>Tipo:</strong> {sessionData.user.isAdmin ? 'Admin' : 'Usuário'}</p>
            <p><strong>Expira em:</strong> {minutes}min {seconds}s</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                authService.logout();
              }}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Sair
            </button>
          </div>
        )}
      </div>
    </div>
  );
}