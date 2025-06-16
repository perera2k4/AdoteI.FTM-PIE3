import { useState, useEffect } from "react";
import { User } from "lucide-react";

export default function Navbar() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Buscar o nome do usuário do localStorage
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  return (
    <nav className="w-full bg-slate-100 shadow-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="../../../public/logo.png"
            alt="Logo"
            className="h-14 w-auto sm:h-16"
          />
        </div>

        {/* Nome do usuário */}
        <div className="text-white flex gap-2 text-right bg-purple-600 p-2 rounded-xl items-center">
          <User className="bg-slate-400 p-1 rounded-xl" />
          <span className="font-medium text-sm sm:text-base">
            {username || "Usuário"}
          </span>
        </div>
      </div>
    </nav>
  );
}