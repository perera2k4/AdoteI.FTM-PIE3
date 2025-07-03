import { useState, useEffect } from "react";
import { Bell, User } from "lucide-react";
import authService from "../../utils/auth";

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Obtém usuário da sessão
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Verifica mudanças na autenticação a cada 5 segundos (não 1s)
    const checkUser = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };

    const interval = setInterval(checkUser, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      authService.logout();
    }
  };

  return (
    <nav className="w-full bg-white shadow-md p-4 flex justify-between items-center fixed top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="bg-purple-100 rounded-full p-2">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            A
          </div>
        </div>
        <h1 className="text-xl font-bold text-purple-700">AdoteI.FTM</h1>
      </div>

      <div className="flex items-center gap-4">
        <Bell className="w-6 h-6 text-purple-700 cursor-pointer hover:text-purple-900 transition-colors" />
        
        <div className="flex items-center gap-2">
          <User className="w-8 h-8 bg-gray-400 p-1 rounded-full text-white" />
          <div className="text-right">
            <span className="block font-medium text-purple-700 text-sm">
              {currentUser?.username || 'Carregando...'}
            </span>
            {currentUser?.isAdmin && (
              <span className="bg-yellow-400 text-yellow-800 px-2 py-0.5 rounded-full text-xs font-bold">
                ADMIN
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}