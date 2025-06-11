import { useEffect, useState } from "react";
import Tasks from "./components/Tasks";
import NavBar from "./components/defaults/NavBar";
import HotBar from "./components/defaults/HotBar";

function App() {
  const [tasks, setTasks] = useState([]);

  // Buscar os posts do backend ao carregar a página
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:5000/posts");
        const data = await response.json();
        setTasks(data); // Atualizar o estado com os posts do backend
      } catch (error) {
        console.error("Erro ao buscar os posts:", error);
      }
    };

    fetchPosts();
  }, []);

  // Adicionar um novo post ao estado
  function onAddPostSubmit(newTask) {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  }

  return (
    <body >
      <NavBar />
      <div className="w-full h-full p-2 flex justify-center mb-20">
        <div className="w-[70vh] space-y-4">
          <Tasks tasks={tasks} />
        </div>
      </div>
      <HotBar onAddPostSubmit={onAddPostSubmit} />
    </body>
  );
}

export default App;