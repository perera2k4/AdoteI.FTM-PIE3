import { useEffect, useState } from "react";
import Tasks from "./components/Tasks";
import NavBar from "./components/defaults/NavBar";
import HotBar from "./components/defaults/HotBar";
import { useNavigate } from "react-router-dom";

function App() {
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  // Proteger rota: se não estiver logado, redireciona para login
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.username) {
      navigate("/");
    }
  }, [navigate]);

  // Buscar os posts do backend ao carregar a página
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch("http://localhost:5000/posts");
        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error("Erro ao buscar os posts:", error);
      }
    };

    fetchPosts();
  }, []);

  // Adicionar um novo post ao estado
  const onAddPostSubmit = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  return (
    <div>
      <NavBar />
      <div className="w-full h-full p-2 flex justify-center mb-20">
        <div className="w-[70vh] space-y-4">
          <Tasks tasks={tasks} />
        </div>
      </div>
      <HotBar onAddPostSubmit={onAddPostSubmit} />
    </div>
  );
}

export default App;