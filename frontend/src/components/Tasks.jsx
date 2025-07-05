import { useState } from "react";
import { Dog, Cat, User, MessageSquare, Calendar, X } from "lucide-react";

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
      //console.error("Número de telefone não fornecido para o usuário.");
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Data não disponível';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (err) {
      return 'Data inválida';
    }
  };

  return (
    <div>
      {/* Lista de publicações com estilização do Profile */}
      <div className="mb-24 space-y-8 p-2">
        {Array.isArray(tasks) && tasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div
                key={task._id || task.title}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 cursor-pointer"
                onClick={() => handleItemClick(task)}
              >
                {/* Image */}
                <div className="h-48 bg-gray-100 relative">
                  {task.image ? (
                    <img
                      src={`data:image/jpeg;base64,${task.image}`}
                      alt={task.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {task.animalType === "dog" ? (
                        <Dog size={40} className="text-blue-500" />
                      ) : (
                        <Cat size={40} className="text-orange-500" />
                      )}
                    </div>
                  )}
                  
                  {/* User Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="flex items-center gap-2 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      <User size={14} />
                      <span>{task.username || "Usuário"}</span>
                    </div>
                  </div>

                  {/* Animal Type Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {task.animalType === 'dog' ? 'Cachorro' : 'Gato'}
                    </span>
                  </div>

                  {/* WhatsApp Button */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que o clique abra o popup
                        abrirWhatsApp(
                          task.phoneNumber,
                          task.username,
                          task.title
                        );
                      }}
                      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm transition-colors duration-200"
                      title="Falar no WhatsApp"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar size={14} />
                      <span>Publicado em {formatDate(task.created_at)}</span>
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {task.description.length > 100
                        ? `${task.description.substring(0, 100)}...`
                        : task.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Dog size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma publicação encontrada
            </h3>
            <p className="text-gray-600">
              Ainda não há pets disponíveis para adoção.
            </p>
          </div>
        )}
      </div>

      {/* Popup melhorado */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header do popup */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {selectedTask.animalType === "dog" ? (
                    <Dog className="w-8 h-8 text-blue-500" />
                  ) : (
                    <Cat className="w-8 h-8 text-orange-500" />
                  )}
                  <h3 className="text-xl font-bold text-gray-900">{selectedTask.title}</h3>
                </div>
                <button
                  onClick={closePopup}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Imagem */}
              {selectedTask.image && (
                <div className="mb-6">
                  <img
                    src={`data:image/jpeg;base64,${selectedTask.image}`}
                    alt={selectedTask.title}
                    className="w-full h-auto rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Informações */}
              <div className="space-y-4">
                {/* Usuário */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedTask.username || "Usuário"}</p>
                    <p className="text-sm text-gray-500">Responsável pelo pet</p>
                  </div>
                </div>

                {/* Data de publicação */}
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Calendar size={16} />
                  <span>Publicado em {formatDate(selectedTask.created_at)}</span>
                </div>

                {/* Descrição */}
                {selectedTask.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descrição:</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedTask.description}</p>
                  </div>
                )}

                {/* Tipo de animal */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Tipo:</span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedTask.animalType === 'dog' ? 'Cachorro' : 'Gato'}
                  </span>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closePopup}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Fechar
                </button>
                <button
                  onClick={() =>
                    abrirWhatsApp(
                      selectedTask.phoneNumber,
                      selectedTask.username,
                      selectedTask.title
                    )
                  }
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  Falar no WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;