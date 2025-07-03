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
        console.log('❌ Não autenticado, redirecionando...');
        navigate("/");
        return;
      }

      console.log('✅ Usuário autenticado:', authService.getCurrentUser()?.username);
      
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
      console.error("❌ Erro ao buscar os posts:", error);
      // Define array vazio em caso de erro
      setTasks([]);
    }
  };

  // Adicionar novo post
  const onAddPostSubmit = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  // Atualizar lista de posts (usado quando um post é arquivado)
  const refreshPosts = () => {
    fetchPosts();
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-600 to-purple-800">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-lg">Carregando posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <SessionInfo />
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <Tasks tasks={tasks} onRefresh={refreshPosts} />
        </div>
      </div>
      <HotBar onAddPostSubmit={onAddPostSubmit} />
    </div>
  );
}

export default App;