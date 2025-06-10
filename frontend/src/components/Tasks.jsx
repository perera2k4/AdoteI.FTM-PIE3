function Tasks({ tasks }) {
  return (
    <ul className="space-y-4 rounded-md">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-col rounded-md p-3 gap-2 bg-purple-400 shadow-purple-700 shadow-sm">
          <h3 className="text-lg font-bold">{task.title}</h3>
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