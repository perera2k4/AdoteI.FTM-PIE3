import { useState, useEffect } from "react";
import { Bell, User } from "lucide-react";
import authService from "../../utils/auth";

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Obtém usuário da sessão
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Escuta mudanças na autenticação
    const checkUser = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
    };

    const interval = setInterval(checkUser, 1000);
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
        <div className="bg-[#5e17eb33] rounded-full p-2">
          <img
            src="/assets/logo.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-purple-700">AdoteI.FTM</h1>
      </div>

      <div className="flex items-center gap-4">
        <Bell className="w-6 h-6 text-purple-700 cursor-pointer hover:text-purple-900" />
        
        <div className="flex items-center gap-2">
          <User className="bg-slate-400 p-1 rounded-xl text-white" />
          <span className="font-medium text-purple-700">
            {currentUser?.username || 'Carregando...'}
          </span>
          {currentUser?.isAdmin && (
            <span className="bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
              ADMIN
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm"
        >
          Sair
        </button>
      </div>
    </nav>
  );
}