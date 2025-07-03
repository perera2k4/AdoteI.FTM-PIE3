import { useState, useEffect } from "react";
import authService from "../utils/auth";

export default function SessionInfo() {
  const [sessionData, setSessionData] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      if (!authService.isAuthenticated()) return;

      try {
        const response = await authService.authenticatedFetch(`${authService.API_URL}/session-info`);
        const data = await response.json();
        setSessionData(data);
      } catch (error) {
        console.log('Erro ao buscar info da sessão:', error);
      }
    };

    fetchSessionInfo();
    
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchSessionInfo, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!sessionData) return null;

  const timeRemaining = sessionData.session.time_remaining;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed top-20 right-4 z-30">
      <div 
        className="bg-white shadow-lg rounded-lg p-3 cursor-pointer hover:shadow-xl transition-shadow"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${timeRemaining > 300 ? 'bg-green-400' : timeRemaining > 120 ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
          <span className="text-sm font-medium">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
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