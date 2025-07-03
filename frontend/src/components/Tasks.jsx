import { Phone, MapPin, Calendar, User } from "lucide-react";

export default function Tasks({ tasks, onRefresh }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'cachorros':
        return 'bg-blue-100 text-blue-800';
      case 'gatos':
        return 'bg-orange-100 text-orange-800';
      case 'outros':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <User size={64} className="mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhum animal disponível para adoção
        </h3>
        <p className="text-gray-500">
          Seja o primeiro a publicar um animal para adoção!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Animais para Adoção
        </h2>
        <p className="text-gray-600">
          {tasks.length} {tasks.length === 1 ? 'animal disponível' : 'animais disponíveis'}
        </p>
      </div>

      <div className="grid gap-6">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {task.image && (
              <div className="h-64 overflow-hidden">
                <img
                  src={task.image}
                  alt={task.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-semibold text-gray-800">
                  {task.title}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(task.category)}`}>
                  {task.category}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4 leading-relaxed">
                {task.description}
              </p>
              
              <div className="space-y-2 text-sm text-gray-500">
                {task.contact && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} />
                    <span>{task.contact}</span>
                  </div>
                )}
                
                {task.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{task.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>Publicado em {formatDate(task.createdAt)}</span>
                </div>
                
                {task.username && (
                  <div className="flex items-center gap-2">
                    <User size={16} />
                    <span>Por {task.username}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}