import { Dog, Cat } from "lucide-react";

function Tasks({ tasks }) {
  return (
    <ul className="space-y-4 p-2 rounded-md">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-col rounded-md p-3 gap-2 bg-purple-200">
          <div className="flex items-center gap-2">
            {task.animalType === "dog" ? (
              <Dog className="w-6 h-6 text-blue-500" />
            ) : (
              <Cat className="w-6 h-6 text-orange-500" />
            )}
            <h3 className="text-lg font-bold">{task.title}</h3>
          </div>
          <p>{task.description}</p>
          {task.image && (
            <img
              src={task.image}
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