import { Dog, Cat, Trash, User } from "lucide-react";

function Tasks({ tasks, onDeletePost }) {
  return (
    <ul className="space-y-6 p-3 rounded-md">
      {tasks.map((task) => (
        <li
          key={task.title}
          className="relative flex flex-col rounded-md p-3 gap-2 bg-purple-400"
        >
          {/* flex gap-2 text-right  p-2 rounded-xl items-center*/}
          <div className="absolute flex inset-0 top-[-10px] gap-2 flex justify-center text-sm text-gray-600 ">
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

            { /* 
            <button
              onClick={() => onDeletePost(task.title)}
              className="bg-red-500 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <Trash className="w-4 h-4" />
              Deletar
            </button>
            */}
          </div>
          <p>{task.description}</p>
          {task.image && (
            <img
              src={`data:image/jpeg;base64,${task.image}`}
              alt={task.title}
              className="w-full h-auto rounded-md shadow"
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export default Tasks;
