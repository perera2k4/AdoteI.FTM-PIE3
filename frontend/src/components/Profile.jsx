import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Calendar, Edit3, Trash2, ArrowLeft, Plus, X, Save, AlertCircle } from 'lucide-react';
import authService from '../utils/auth';
import { API_URL } from '../config/api';

const Profile = () => {
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    animalType: 'dog'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Função para buscar posts do usuário
  const fetchUserPosts = useCallback(async (user) => {
    if (!user) return;
    
    try {
      console.log('Profile: buscando posts do usuário:', user.username);
      setLoading(true);
      setError(null);
      
      const response = await authService.authenticatedFetch(`${API_URL}/posts`);
      
      if (response.ok) {
        const allPosts = await response.json();
        console.log('Profile: todos os posts:', allPosts);
        
        // Filtrar posts do usuário atual
        const filteredPosts = allPosts.filter(post => post.username === user.username);
        console.log('Profile: posts do usuário:', filteredPosts);
        
        // Ordenar por data de criação (mais recente primeiro)
        filteredPosts.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA;
        });
        
        setUserPosts(filteredPosts);
      } else {
        console.error('Profile: erro na resposta da API:', response.status);
        setError('Erro ao carregar suas publicações');
      }
    } catch (err) {
      console.error('Profile: erro ao buscar posts:', err);
      setError('Erro ao carregar suas publicações');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect para inicializar o usuário e carregar posts
  useEffect(() => {
    console.log('Profile: useEffect executado');
    
    const initializeProfile = async () => {
      try {
        // Aguardar um pouco para garantir que o authService está pronto
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const user = authService.getCurrentUser();
        console.log('Profile: usuário atual:', user);
        
        if (!user) {
          console.log('Profile: usuário não encontrado, redirecionando...');
          navigate('/');
          return;
        }
        
        setCurrentUser(user);
        await fetchUserPosts(user);
      } catch (err) {
        console.error('Profile: erro no useEffect:', err);
        setError('Erro ao carregar dados do usuário');
        setLoading(false);
      }
    };

    initializeProfile();
  }, [navigate, fetchUserPosts]);

  const handleDeletePost = async (postId) => {
    if (window.confirm('Tem certeza que deseja marcar este pet como adotado? Esta ação moverá a publicação para a seção de adotados.')) {
      try {
        const postToDelete = userPosts.find(post => post._id === postId);
        
        if (!postToDelete) {
          alert('Post não encontrado');
          return;
        }

        // Primeiro, salvar o post em /adotados
        const adoptedPostData = {
          ...postToDelete,
          adopted_date: new Date().toISOString(),
          original_post_id: postToDelete._id
        };

        console.log('Profile: salvando post em adotados:', adoptedPostData);
        
        try {
          const saveResponse = await authService.authenticatedFetch(`${API_URL}/adotados`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(adoptedPostData)
          });

          if (saveResponse.ok) {
            console.log('Profile: post salvo em adotados com sucesso');
            
            // Depois, remover o post de /posts
            try {
              const deleteResponse = await authService.authenticatedFetch(`${API_URL}/posts/${postId}`, {
                method: 'DELETE'
              });
              
              if (deleteResponse.ok) {
                setUserPosts(prev => prev.filter(post => post._id !== postId));
                alert('Pet marcado como adotado com sucesso! 🎉');
              } else {
                // Remover localmente mesmo se o servidor não responder
                setUserPosts(prev => prev.filter(post => post._id !== postId));
                alert('Pet marcado como adotado localmente! 🎉 (Servidor indisponível)');
              }
            } catch (err) {
              // Remover localmente em caso de erro
              setUserPosts(prev => prev.filter(post => post._id !== postId));
              alert('Pet marcado como adotado localmente! 🎉 (Erro de conexão)');
            }
          } else {
            alert('Erro ao salvar na lista de adotados');
          }
        } catch (err) {
          console.error('Profile: erro ao salvar em adotados:', err);
          // Remover localmente mesmo com erro
          setUserPosts(prev => prev.filter(post => post._id !== postId));
          alert('Pet marcado como adotado localmente! 🎉 (Erro de conexão)');
        }
      } catch (err) {
        console.error('Profile: erro ao processar adoção:', err);
        alert('Erro ao processar adoção');
      }
    }
  };

  const handleEditPost = useCallback((post) => {
    setEditingPost(post);
    setEditForm({
      title: post.title,
      description: post.description,
      animalType: post.animalType
    });
    setShowEditModal(true);
  }, []);

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      alert('Por favor, digite um título para a publicação');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Profile: tentando salvar edição:', editForm);
      
      const response = await authService.authenticatedFetch(`${API_URL}/posts/${editingPost._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          animalType: editForm.animalType
        })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        console.log('Profile: post atualizado:', updatedPost);
        
        setUserPosts(prev => prev.map(post => 
          post._id === editingPost._id ? { ...post, ...updatedPost } : post
        ));
        setShowEditModal(false);
        setEditingPost(null);
        alert('Publicação atualizada com sucesso!');
      } else {
        throw new Error('Servidor não respondeu adequadamente');
      }
    } catch (err) {
      console.error('Profile: erro ao atualizar post:', err);
      
      // Fallback: atualizar localmente
      console.log('Profile: aplicando atualização local devido ao erro');
      
      setUserPosts(prev => prev.map(post => 
        post._id === editingPost._id ? { 
          ...post, 
          title: editForm.title, 
          description: editForm.description, 
          animalType: editForm.animalType 
        } : post
      ));
      
      setShowEditModal(false);
      setEditingPost(null);
      alert('Publicação atualizada localmente! (Servidor indisponível)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = useCallback(() => {
    setShowEditModal(false);
    setEditingPost(null);
    setEditForm({
      title: '',
      description: '',
      animalType: 'dog'
    });
  }, []);

  const formatDate = useCallback((dateString) => {
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
  }, []);

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
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p className="text-lg font-semibold">Erro</p>
            <p className="mb-4">{error}</p>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mr-2"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Voltar ao Início
            </button>
          </div>
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
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
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
      <div className="bg-gradient-to-r from-purple-800 to-purple-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex justify-center pt-6 pb-4">
            <img 
              src="/assets/logo.png" 
              alt="Adote IFTM" 
              className="h-16 w-auto"
              onError={(e) => {
                console.log('Logo não encontrado, ocultando...');
                e.target.style.display = 'none';
              }}
            />
          </div>

          <div className="flex items-center justify-between py-4">
            <button
              onClick={() => navigate('/')}
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
                <p className="text-purple-100 mb-4">{currentUser.phoneNumber || 'Telefone não informado'}</p>
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
          <button
            onClick={() => navigate('/create-post')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nova Publicação</span>
          </button>
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
              onClick={() => navigate('/create-post')}
              className="bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
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
                      onClick={() => handleEditPost(post)}
                      className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors duration-200"
                      title="Editar publicação"
                    >
                      <Edit3 size={16} className="text-purple-600" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors duration-200"
                      title="Marcar como adotado"
                    >
                      <Heart size={16} className="text-green-600" />
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

      {/* Modal de Edição */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Editar Publicação</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({...prev, title: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Digite o título"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Digite a descrição"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Tipo de Animal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Animal
                  </label>
                  <select
                    value={editForm.animalType}
                    onChange={(e) => setEditForm(prev => ({...prev, animalType: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isSubmitting}
                  >
                    <option value="dog">Cachorro</option>
                    <option value="cat">Gato</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;