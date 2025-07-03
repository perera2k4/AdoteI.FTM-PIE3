import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Heart, Archive, RotateCcw, Trash2, Phone, MapPin, Calendar } from 'lucide-react';
import authService from '../utils/auth';
import { API_URL } from '../config/api';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('active');
  const [myPosts, setMyPosts] = useState([]);
  const [adoptedPosts, setAdoptedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/');
      return;
    }

    fetchUserData();
  }, [navigate]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchUserPosts(), fetchAdoptedPosts()]);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/my-posts`);
      if (response.ok) {
        const data = await response.json();
        setMyPosts(data.filter(post => post.status !== 'adopted'));
      }
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
    }
  };

  const fetchAdoptedPosts = async () => {
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/my-adopted`);
      if (response.ok) {
        const data = await response.json();
        setAdoptedPosts(data);
      }
    } catch (error) {
      console.error('Erro ao buscar posts adotados:', error);
    }
  };

  const handleAdoptPost = async (postId) => {
    if (!confirm('Tem certeza que deseja marcar este post como adotado?')) {
      return;
    }

    setActionLoading(postId);
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/adopt-post/${postId}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchUserData();
        alert('Post marcado como adotado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao adotar post:', error);
      alert('Erro ao marcar como adotado');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReactivatePost = async (postId) => {
    if (!confirm('Tem certeza que deseja reativar este post?')) {
      return;
    }

    setActionLoading(postId);
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/reactivate-post/${postId}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchUserData();
        alert('Post reativado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao reativar post:', error);
      alert('Erro ao reativar post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Tem certeza que deseja deletar este post PERMANENTEMENTE? Esta ação não pode ser desfeita.')) {
      return;
    }

    setActionLoading(postId);
    try {
      const response = await authService.authenticatedFetch(`${API_URL}/delete-post/${postId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchUserData();
        alert('Post deletado permanentemente!');
      } else {
        const error = await response.json();
        alert(`Erro: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      alert('Erro ao deletar post');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const PostCard = ({ post, isAdopted = false }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {post.image && (
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{post.title}</h3>
          <div className="flex gap-2">
            {isAdopted ? (
              <>
                <button
                  onClick={() => handleReactivatePost(post.id)}
                  disabled={actionLoading === post.id}
                  className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 transition-colors"
                  title="Reativar post"
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  disabled={actionLoading === post.id}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
                  title="Deletar permanentemente"
                >
                  <Trash2 size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleAdoptPost(post.id)}
                  disabled={actionLoading === post.id}
                  className="p-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 transition-colors"
                  title="Marcar como adotado"
                >
                  <Heart size={16} />
                </button>
                <button
                  onClick={() => handleDeletePost(post.id)}
                  disabled={actionLoading === post.id}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors"
                  title="Deletar permanentemente"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.description}</p>
        
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          {post.contact && (
            <div className="flex items-center gap-1">
              <Phone size={12} />
              <span>{post.contact}</span>
            </div>
          )}
          {post.location && (
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{post.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar size={12} />
            <span>Publicado em {formatDate(post.createdAt)}</span>
          </div>
          {isAdopted && post.adoptedAt && (
            <div className="flex items-center gap-1 text-green-600">
              <Archive size={12} />
              <span>Adotado em {formatDate(post.adoptedAt)}</span>
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
            {post.category}
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/posts')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{currentUser?.username}</h2>
              <p className="text-gray-600">{currentUser?.phoneNumber || 'Telefone não informado'}</p>
              {currentUser?.isAdmin && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  Administrador
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{myPosts.length}</div>
            <div className="text-sm text-gray-600">Publicações Ativas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{adoptedPosts.length}</div>
            <div className="text-sm text-gray-600">Animais Adotados</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'active'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Publicações Ativas ({myPosts.length})
              </button>
              <button
                onClick={() => setActiveTab('adopted')}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === 'adopted'
                    ? 'border-b-2 border-purple-500 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Adotados ({adoptedPosts.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'active' ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">Suas Publicações Ativas</h3>
                {myPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <User size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">Você ainda não publicou nenhuma adoção</p>
                    <button
                      onClick={() => navigate('/posts')}
                      className="bg-purple-500 text-white px-6 py-2 rounded-md hover:bg-purple-600 transition-colors"
                    >
                      Fazer primeira publicação
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myPosts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4">Animais Adotados</h3>
                {adoptedPosts.length === 0 ? (
                  <div className="text-center py-8">
                    <Archive size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Você ainda não marcou nenhum animal como adotado</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adoptedPosts.map(post => (
                      <PostCard key={post.id} post={post} isAdopted={true} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}