import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Calendar, Trash2, ArrowLeft } from 'lucide-react';
import authService from '../utils/auth';
import { API_URL } from '../config/api';

const Profile = () => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    //console.log('Profile: useEffect executado');
    
    try {
      const user = authService.getCurrentUser();
      //console.log('Profile: usuário atual:', user);
      
      if (!user) {
        //console.log('Profile: usuário não encontrado, redirecionando...');
        navigate('/');
        return;
      }
      
      setCurrentUser(user);
      fetchUserPosts(user);
    } catch (err) {
      //console.error('Profile: erro no useEffect:', err);
      setError('Erro ao carregar dados do usuário');
      setLoading(false);
    }
  }, [navigate]);

  const fetchUserPosts = async (user) => {
    try {
      //console.log('Profile: buscando posts do usuário:', user.username);
      setLoading(true);
      
      const response = await authService.authenticatedFetch(`${API_URL}/posts`);
      //console.log('Profile: resposta da API:', response);
      
      if (response.ok) {
        const allPosts = await response.json();
        //console.log('Profile: todos os posts:', allPosts);
        
        // Filtrar posts do usuário atual
        const userPosts = allPosts.filter(post => post.username === user.username);
        //console.log('Profile: posts do usuário:', userPosts);
        
        // Ordenar por data de criação (mais recente primeiro)
        userPosts.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA;
        });
        
        setUserPosts(userPosts);
      } else {
        //console.error('Profile: erro na resposta da API:', response.status);
        setError('Erro ao carregar suas publicações');
      }
    } catch (err) {
      //console.error('Profile: erro ao buscar posts:', err);
      setError('Erro ao carregar suas publicações');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Tem certeza que deseja excluir esta publicação?')) {
      try {
        const response = await authService.authenticatedFetch(`${API_URL}/posts/${postId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setUserPosts(userPosts.filter(post => post._id !== postId));
        } else {
          alert('Erro ao excluir publicação');
        }
      } catch (err) {
        //console.error('Erro ao excluir post:', err);
        alert('Erro ao excluir publicação');
      }
    }
  };

  //const handleEditPost = (postId) => {
  //  navigate(`/edit-post/${postId}`);
  //};

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

  //console.log('Profile: renderizando componente', { loading, error, currentUser, userPosts });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Carregando suas publicações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Erro</p>
            <p>{error}</p>
          </div>
          <button
            onClick={() => navigate('/posts')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Usuário não encontrado</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate('/posts')}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          </div>
          
          <div className="pb-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User size={40} className="text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {currentUser.username || 'Usuário'}
                </h1>
                <p className="text-blue-100 mb-4">{currentUser.phoneNumber || 'Telefone não informado'}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <Heart size={16} />
                    <span className="text-sm">{userPosts.length} publicações</span>
                  </div>
                  {currentUser.isAdmin && (
                    <div className="bg-yellow-400 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                      ADMIN
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Minhas Publicações de Adoção</h2>
        </div>

        {userPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={48} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhuma publicação encontrada
            </h3>
            <p className="text-gray-600 mb-8">
              Você ainda não fez nenhuma publicação de adoção.
            </p>
            <button
              onClick={() => navigate('/posts')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
            >
              Criar primeira publicação
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPosts.map((post) => (
              <div
                key={post._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200"
              >
                {/* Image */}
                <div className="h-48 bg-gray-100 relative">
                  {post.image ? (
                    <img
                      src={`data:image/jpeg;base64,${post.image}`}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart size={40} className="text-gray-400" />
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors duration-200"
                      title="Excluir publicação"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>

                  {/* Animal Type Badge */}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {post.animalType === 'dog' ? 'Cachorro' : 'Gato'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <Calendar size={14} />
                      <span>Publicado em {formatDate(post.created_at)}</span>
                    </div>
                  </div>

                  {post.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {post.description.length > 100
                        ? `${post.description.substring(0, 100)}...`
                        : post.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;