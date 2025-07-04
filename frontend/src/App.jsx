import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/defaults/NavBar';
import Tasks from './components/Tasks';
import SessionInfo from './components/SessionInfo';
import Profile from './components/Profile';
import AddPost from './components/AddPost';
import HotBar from './components/defaults/HotBar';
import authService from './utils/auth';
import { API_URL } from './config/api';

function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    console.log('App: rota atual:', location.pathname);
    
    // Verificar se está autenticado
    if (!authService.isAuthenticated()) {
      console.log('App: usuário não autenticado, redirecionando...');
      window.location.href = '/';
      return;
    }

    // Só carregar posts na página inicial ou posts
    if (location.pathname === '/' || location.pathname === '/posts') {
      fetchPosts();
    } else {
      setLoading(false);
    }
  }, [location.pathname]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        console.error('Erro ao carregar posts');
      }
    } catch (error) {
      console.error('Erro ao conectar com o servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Página de loading apenas para as rotas principais
  if (loading && (location.pathname === '/' || location.pathname === '/posts')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Carregando posts...</p>
        </div>
      </div>
    );
  }

  // Componente principal para mostrar posts
  const PostsPage = () => (
    <div className="max-w-6xl mx-auto px-4">
      <Tasks tasks={posts} />
    </div>
  );

  // Verificar se é página especial para não mostrar navbar
  const isSpecialPage = location.pathname === '/profile' || location.pathname === '/create-post';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar e SessionInfo apenas se não for página especial */}
      {!isSpecialPage && (
        <>
          <Navbar />
          <SessionInfo />
        </>
      )}
      
      <div className={`${!isSpecialPage ? 'pt-20' : ''}`}>
        <Routes>
          {/* Rota principal */}
          <Route path="/" element={<PostsPage />} />
          
          {/* Rota de posts */}
          <Route path="/posts" element={<PostsPage />} />
          
          {/* Rota de perfil */}
          <Route path="/profile" element={<Profile />} />
          
          {/* Rota de criar post */}
          <Route path="/create-post" element={<AddPost onAddPostSubmit={handleAddPost} />} />
          
          
          {/* Rota de fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      
      {/* HotBar sempre visível */}
      <HotBar />
    </div>
  );
}

export default App;