import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Tasks from "./components/Tasks";
import NavBar from "./components/defaults/NavBar";
import HotBar from "./components/defaults/HotBar";
import SessionInfo from "./components/SessionInfo";
import authService from "./utils/auth";
import { API_URL } from "./config/api";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Proteger rota e buscar dados
  useEffect(() => {
    const initializeApp = async () => {
      // Verifica se está autenticado
      if (!authService.isAuthenticated()) {
        navigate("/");
        return;
      }

      // Busca os posts
      await fetchPosts();
      setLoading(false);
    };

    initializeApp();
  }, [navigate]);

  // Buscar posts do backend
  const fetchPosts = async () => {
    try {
      console.log('📋 Buscando posts...');
      const response = await fetch(`${API_URL}/posts`, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTasks(data);
      console.log(`✅ ${data.length} posts carregados`);
    } catch (error) {
      console.error("Erro ao buscar os posts:", error);
    }
  };

  // Adicionar novo post
  const onAddPostSubmit = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-purple-700">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <SessionInfo />
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