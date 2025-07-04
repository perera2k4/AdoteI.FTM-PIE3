import { useState } from "react";
import { Dog, Cat, User, MessagesSquare } from "lucide-react";

function Tasks({ tasks }) {
  const [selectedTask, setSelectedTask] = useState(null); // Estado para o item clicado

  const handleItemClick = (task) => {
    setSelectedTask(task); // Atualizar o estado com o item clicado
  };

  const closePopup = () => {
    setSelectedTask(null); // Fechar o popup
  };

  const gerarLinkWhatsApp = (numeroUsuario, nomeUsuario, nomeAnimal) => {
    if (!numeroUsuario) {
      console.error("Número de telefone não fornecido para o usuário.");
      return "#"; // Retorna um link vazio se o número não estiver disponível
    }

    const texto = `Olá, *${nomeUsuario}* tenho interesse na adoção do *${nomeAnimal}*`;
    return `https://api.whatsapp.com/send/?phone=${numeroUsuario}&text=${encodeURIComponent(
      texto
    )}&type=phone_number&app_absent=0`;
  };

  const abrirWhatsApp = (numeroUsuario, nomeUsuario, nomeAnimal) => {
    const url = gerarLinkWhatsApp(numeroUsuario, nomeUsuario, nomeAnimal);
    window.open(url, "_blank"); // Abre o link em uma nova aba
  };

  return (
    <div>
      <ul className="mt-2 space-y-8 p-3 rounded-md">
        {Array.isArray(tasks) && tasks.length > 0 ? (
          tasks.map((task) => (
            <li
              key={task.title}
              className="relative flex flex-col rounded-md p-3 gap-2 bg-purple-400 hover:scale-105 transition-transform duration-300 cursor-pointer"
              onClick={() => handleItemClick(task)}
            >
              <div className="absolute inset-0 top-[-10px] gap-2 flex justify-center text-sm text-gray-600 ">
                <div className="flex justify-center items-center text-white gap-2 bg-purple-600 h-6 w-auto p-4 rounded-xl">
                  <User className="bg-slate-400 p-1 rounded-xl" />
                  <span className="font-medium text-sm sm:text-base">
                    {task.username || "Usuário"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between">
                <div className="flex gap-2 items-center">
                  {task.animalType === "dog" ? (
                    <Dog className="w-6 h-6 text-blue-500" />
                  ) : (
                    <Cat className="w-6 h-6 text-orange-500" />
                  )}
                  <h3 className="text-lg font-bold">{task.title}</h3>
                </div>
              </div>
              <p>{task.description}</p>
              {task.image && (
                <img
                  src={`data:image/jpeg;base64,${task.image}`}
                  alt={task.title}
                  className="w-full h-auto rounded-md shadow-2xl"
                />
              )}
            </li>
          ))
        ) : (
          <p className="text-center text-gray-500">Nenhum post encontrado.</p>
        )}
      </ul>

      {/* Popup */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] max-w-md">
            <div className="flex justify-between items-start">
              <div>
                <div>
                  <div className="flex gap-2 items-center">
                    {selectedTask.animalType === "dog" ? (
                      <Dog className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Cat className="w-6 h-6 text-orange-500" />
                    )}
                    <h3 className="text-lg font-bold">{selectedTask.title}</h3>
                  </div>
                </div>
                <p className="mb-1">{selectedTask.description}</p>
                <button
                  onClick={() =>
                    abrirWhatsApp(
                      selectedTask.phoneNumber,
                      selectedTask.username,
                      selectedTask.title
                    )
                  }
                  className="flex gap-2 my-2 underline text-blue-500"
                >
                  <MessagesSquare /> Fale com: {selectedTask.username}
                </button>
              </div>

              <div>
                <button
                  onClick={closePopup}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"
                >
                  Fechar
                </button>
              </div>
            </div>

            {selectedTask.image && (
              <img
                src={`data:image/jpeg;base64,${selectedTask.image}`}
                alt={selectedTask.title}
                className="w-full h-auto rounded-md shadow"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;