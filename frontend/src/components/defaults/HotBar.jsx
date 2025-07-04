import { useState } from "react";
import { Heart, Plus, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import AddPost from "../AddPost"; // Importar o componente AddPost

export default function HotBar({ onAddPostSubmit }) {
  const [active, setActive] = useState("home");
  const [showModal, setShowModal] = useState(false); // Estado para controlar o modal
  const navigate = useNavigate();
  const location = useLocation();

  const buttons = [
    { id: "home", icon: <Heart className="w-6 h-6" /> },
    { id: "post", icon: <Plus className="w-6 h-6" /> },
    { id: "user", icon: <User className="w-6 h-6" /> },
  ];

  const handleButtonClick = (id) => {
    setActive(id);

    if (id === "post") {
      setShowModal(true); // Mostrar o modal ao clicar no botão "post"
    } else if (id === "user") {
      console.log("HotBar: navegando para o perfil");
      navigate("/profile"); // Navegar para a página de perfil
    } else if (id === "home") {
      console.log("HotBar: navegando para home");
      navigate("/posts"); // Navegar para a página inicial
    }
  };

  // Função para verificar se o botão está ativo baseado na rota atual
  const isActive = (id) => {
    if (
      id === "home" &&
      (location.pathname === "/" || location.pathname === "/posts")
    ) {
      return true;
    }
    if (id === "user" && location.pathname === "/profile") {
      return true;
    }
    return active === id;
  };

  return (
    <>
      {/* Modal para criar o post */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-3 z-50">
          <div className="bg-white px-5 py-3 rounded-lg shadow-lg w-[90%] max-w-md">
            <div className="flex place-content-between items-center pb-2">
              <div>
                <h2 className="text-lg font-bold">Criar publicação</h2>
                <h3 className="text-xs">Encontre um novo lar para o seu Pet</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="bg-red-500 text-white px-4 py-2 rounded-md"
              >
                Fechar
              </button>
            </div>

            <AddPost
              onAddPostSubmit={(newPost) => {
                onAddPostSubmit(newPost); // Enviar o post para o App
                setShowModal(false); // Fechar o modal após criar o post
              }}
            />
          </div>
        </div>
      )}

      {/* HotBar */}
      <div className="fixed bottom-0 w-full flex justify-around items-center bg-purple-600 rounded-t-2xl py-2 px-6 z-50">
        {buttons.map(({ id, icon }) => (
          <button
            key={id}
            onClick={() => handleButtonClick(id)}
            className={`p-4 rounded-lg transition-colors duration-200 ${
              isActive(id)
                ? "bg-white bg-opacity-20 text-white"
                : "text-white hover:bg-white hover:bg-opacity-10"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </>
  );
}
