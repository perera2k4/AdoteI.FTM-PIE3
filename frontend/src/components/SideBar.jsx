import { useState, useEffect } from "react";
import { User } from "lucide-react";

const menuItems = [
  {
    icon: <i className="fa-solid fa-user"></i>,
    label: "Meu Perfil",
    href: "#",
  },
  {
    icon: <i className="fa-solid fa-image"></i>,
    label: "Publicações",
    href: "#",
  },
  {
    icon: <i className="fa-solid fa-bell"></i>,
    label: "Adoções",
    href: "#",
  },
  {
    icon: <i className="fa-solid fa-gear"></i>,
    label: "Configurações",
    href: "#",
  },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Busca o username do localStorage salvo no login
    const user = JSON.parse(localStorage.getItem("user"));
    setUsername(user?.username || "Usuário");
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 h-full z-40 transition-all duration-300 ${
        open ? "w-60" : "w-16"
      } bg-white shadow-lg flex flex-col justify-between`}
    >
      <div>
        {/* Logo e usuário */}
        <div className="flex flex-col items-center py-6 border-b border-slate-200">
          <div className="bg-[#5e17eb33] rounded-full p-2 mb-2">
            <img
              src="assets/logo.png"
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          {open && (
            <div className="flex items-center gap-2 mt-2">
              <User className="bg-slate-400 p-1 rounded-xl text-white" />
              <span className="font-medium text-purple-700 text-base">
                {username}
              </span>
            </div>
          )}
        </div>

        {/* Menu */}
        <ul className="mt-6 space-y-2">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <a
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                  open
                    ? "hover:bg-purple-100 text-purple-700"
                    : "justify-center text-purple-700"
                }`}
              >
                {item.icon}
                {open && <span className="font-medium">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer: Toggle e Logout */}
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="mb-4 p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          aria-label="Abrir/Fechar menu"
        >
          <i
            className={`fa-solid fa-chevron-${open ? "left" : "right"}`}
          ></i>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors ${
            open ? "" : "justify-center"
          }`}
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          {open && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </nav>
  );
}