import { useState } from "react";
import { PawPrint, Plus, User } from "lucide-react";
import AddPost from "../AddPost"; // Importar o componente AddPost

export default function HotBar({ onAddPostSubmit }) {
  const [active, setActive] = useState("home");
  const [showModal, setShowModal] = useState(false); // Estado para controlar o modal

  const buttons = [
    { id: "home", icon: <PawPrint className="w-6 h-6" /> },
    { id: "post", icon: <Plus className="w-6 h-6" /> },
    { id: "user", icon: <User className="w-6 h-6" /> },
  ];

  const handleButtonClick = (id) => {
    setActive(id);
    if (id === "post") {
      setShowModal(true); // Mostrar o modal ao clicar no botão "post"
    }
  };

  return (
    <>
      {/* Modal para criar o post */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90%] max-w-md">
            <h2 className="text-lg font-bold mb-4">Criar publicação</h2>
            <AddPost
              onAddPostSubmit={(newPost) => {
                onAddPostSubmit(newPost); // Enviar o post para o App
                setShowModal(false); // Fechar o modal após criar o post
              }}
            />
            <button
              onClick={() => setShowModal(false)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* HotBar */}
      <div className="fixed bottom-0 w-full flex justify-around items-center bg-purple-600 rounded-t-2xl py-3 px-6 z-50">
        {buttons.map(({ id, icon }) => (
          <button
            key={id}
            onClick={() => handleButtonClick(id)}
            className={`p-4 rounded-lg ${
              active === id ? "bg-white bg-opacity-20 text-white" : "text-white"
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </>
  );
}