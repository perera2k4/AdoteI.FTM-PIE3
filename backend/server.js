const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Arquivos de dados
const USERS_FILE = path.join(__dirname, 'users.json');
const POSTS_FILE = path.join(__dirname, 'posts.json');
const ADOPTED_FILE = path.join(__dirname, 'adopted.json'); // Novo arquivo para adoções arquivadas
const SESSIONS_FILE = path.join(__dirname, 'sessions.json');

// Inicializar arquivos
const initializeFiles = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(ADOPTED_FILE)) {
    fs.writeFileSync(ADOPTED_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync(SESSIONS_FILE)) {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify([]));
  }
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }
};

initializeFiles();

// Funções auxiliares
const readJSON = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return [];
  }
};

const writeJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Middleware de autenticação
const authenticateSession = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Session ')) {
    return res.status(401).json({ error: 'Token de sessão necessário' });
  }

  const sessionId = authHeader.substring(8);
  const sessions = readJSON(SESSIONS_FILE);
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Sessão inválida' });
  }

  if (new Date() > new Date(session.expires_at)) {
    return res.status(401).json({ error: 'Sessão expirada' });
  }

  // Atualizar última atividade
  session.last_activity = new Date().toISOString();
  session.expires_at = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  writeJSON(SESSIONS_FILE, sessions);

  req.user = session.user;
  next();
};

// Rotas existentes...

// Registro
app.post('/register', (req, res) => {
  const { username, password, phoneNumber, isAdmin } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  const users = readJSON(USERS_FILE);
  
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Usuário já existe' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    username,
    password,
    phoneNumber: phoneNumber || '',
    isAdmin: isAdmin || false,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  res.status(201).json({ message: 'Usuário criado com sucesso' });
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios' });
  }

  const users = readJSON(USERS_FILE);
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const sessionId = crypto.randomUUID();
  const session = {
    id: sessionId,
    user: {
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      isAdmin: user.isAdmin
    },
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    last_activity: new Date().toISOString()
  };

  const sessions = readJSON(SESSIONS_FILE);
  sessions.push(session);
  writeJSON(SESSIONS_FILE, sessions);

  res.json({
    session_id: sessionId,
    user: session.user
  });
});

// Logout
app.post('/logout', authenticateSession, (req, res) => {
  const authHeader = req.headers.authorization;
  const sessionId = authHeader.substring(8);
  
  let sessions = readJSON(SESSIONS_FILE);
  sessions = sessions.filter(s => s.id !== sessionId);
  writeJSON(SESSIONS_FILE, sessions);

  res.json({ message: 'Logout realizado com sucesso' });
});

// Informações da sessão
app.get('/session-info', authenticateSession, (req, res) => {
  const authHeader = req.headers.authorization;
  const sessionId = authHeader.substring(8);
  
  const sessions = readJSON(SESSIONS_FILE);
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Sessão não encontrada' });
  }

  const expiresAt = new Date(session.expires_at);
  const now = new Date();
  const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

  res.json({
    session: {
      id: session.id,
      expires_at: session.expires_at,
      time_remaining: timeRemaining
    },
    user: session.user
  });
});

// Buscar todos os posts (apenas ativos)
app.get('/posts', (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const activePosts = posts.filter(post => post.status !== 'adopted');
  res.json(activePosts);
});

// 🆕 Buscar posts do usuário logado
app.get('/my-posts', authenticateSession, (req, res) => {
  const posts = readJSON(POSTS_FILE);
  const userPosts = posts.filter(post => post.userId === req.user.id);
  res.json(userPosts);
});

// 🆕 Buscar adoções arquivadas do usuário
app.get('/my-adopted', authenticateSession, (req, res) => {
  const adopted = readJSON(ADOPTED_FILE);
  const userAdopted = adopted.filter(post => post.userId === req.user.id);
  res.json(userAdopted);
});

// 🆕 Arquivar adoção (mover para adotados)
app.post('/adopt-post/:id', authenticateSession, (req, res) => {
  const postId = req.params.id;
  const posts = readJSON(POSTS_FILE);
  const adopted = readJSON(ADOPTED_FILE);

  const postIndex = posts.findIndex(post => post.id === postId);
  
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  const post = posts[postIndex];

  // Verificar se o usuário é o dono do post
  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: 'Você só pode arquivar seus próprios posts' });
  }

  // Mover post para adotados
  const adoptedPost = {
    ...post,
    status: 'adopted',
    adoptedAt: new Date().toISOString(),
    adoptedBy: req.user.username
  };

  adopted.push(adoptedPost);
  posts.splice(postIndex, 1);

  writeJSON(POSTS_FILE, posts);
  writeJSON(ADOPTED_FILE, adopted);

  res.json({ message: 'Post arquivado com sucesso', post: adoptedPost });
});

// 🆕 Reativar adoção (voltar para posts ativos)
app.post('/reactivate-post/:id', authenticateSession, (req, res) => {
  const postId = req.params.id;
  const posts = readJSON(POSTS_FILE);
  const adopted = readJSON(ADOPTED_FILE);

  const adoptedIndex = adopted.findIndex(post => post.id === postId);
  
  if (adoptedIndex === -1) {
    return res.status(404).json({ error: 'Post adotado não encontrado' });
  }

  const post = adopted[adoptedIndex];

  // Verificar se o usuário é o dono do post
  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: 'Você só pode reativar seus próprios posts' });
  }

  // Remover campos de adoção e reativar
  const reactivatedPost = {
    ...post,
    status: 'active',
    reactivatedAt: new Date().toISOString()
  };

  // Remover campos específicos da adoção
  delete reactivatedPost.adoptedAt;
  delete reactivatedPost.adoptedBy;

  posts.push(reactivatedPost);
  adopted.splice(adoptedIndex, 1);

  writeJSON(POSTS_FILE, posts);
  writeJSON(ADOPTED_FILE, adopted);

  res.json({ message: 'Post reativado com sucesso', post: reactivatedPost });
});

// 🆕 Deletar post permanentemente
app.delete('/delete-post/:id', authenticateSession, (req, res) => {
  const postId = req.params.id;
  const posts = readJSON(POSTS_FILE);
  const adopted = readJSON(ADOPTED_FILE);

  // Procurar em posts ativos
  let postIndex = posts.findIndex(post => post.id === postId);
  let isFromAdopted = false;

  // Se não encontrou em posts ativos, procurar em adotados
  if (postIndex === -1) {
    postIndex = adopted.findIndex(post => post.id === postId);
    isFromAdopted = true;
  }

  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post não encontrado' });
  }

  const post = isFromAdopted ? adopted[postIndex] : posts[postIndex];

  // Verificar se o usuário é o dono do post
  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: 'Você só pode deletar seus próprios posts' });
  }

  // Remover post
  if (isFromAdopted) {
    adopted.splice(postIndex, 1);
    writeJSON(ADOPTED_FILE, adopted);
  } else {
    posts.splice(postIndex, 1);
    writeJSON(POSTS_FILE, posts);
  }

  res.json({ message: 'Post deletado permanentemente' });
});

// Criar novo post
app.post('/posts', authenticateSession, (req, res) => {
  const { title, description, image, contact, location, category } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
  }

  const newPost = {
    id: crypto.randomUUID(),
    title,
    description,
    image: image || '',
    contact: contact || req.user.phoneNumber || '',
    location: location || '',
    category: category || 'outros',
    status: 'active',
    userId: req.user.id,
    username: req.user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const posts = readJSON(POSTS_FILE);
  posts.push(newPost);
  writeJSON(POSTS_FILE, posts);

  res.status(201).json(newPost);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Arquivos de dados inicializados`);
});