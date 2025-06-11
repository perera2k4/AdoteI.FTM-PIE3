const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Caminho para o arquivo JSON onde os posts ativos serão armazenados
const postsFilePath = path.join(__dirname, "posts.json");

// Caminho para o arquivo JSON onde os posts deletados serão armazenados
const adotadosFilePath = path.join(__dirname, "adotados.json");

// Função para carregar os posts ativos do arquivo JSON
const loadPosts = () => {
  if (!fs.existsSync(postsFilePath)) {
    return [];
  }
  const data = fs.readFileSync(postsFilePath, "utf-8");
  return JSON.parse(data);
};

// Função para salvar os posts ativos no arquivo JSON
const savePosts = (posts) => {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
};

// Função para carregar os posts deletados do arquivo JSON
const loadAdotados = () => {
  if (!fs.existsSync(adotadosFilePath)) {
    return [];
  }
  const data = fs.readFileSync(adotadosFilePath, "utf-8");
  return JSON.parse(data);
};

// Função para salvar os posts deletados no arquivo JSON
const saveAdotados = (adotados) => {
  fs.writeFileSync(adotadosFilePath, JSON.stringify(adotados, null, 2));
};

// Habilitar CORS para permitir requisições do frontend
app.use(cors());

// Middleware para processar campos de texto no FormData
app.use(express.urlencoded({ extended: true }));

// Configurar o diretório onde as imagens serão armazenadas
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Diretório onde as imagens serão salvas
  },
  filename: (req, file, cb) => {
    const id = req.body.id; // Receber o id enviado pelo frontend
    if (!id) {
      return cb(new Error("ID não foi enviado no formulário."));
    }
    const ext = path.extname(file.originalname); // Obter a extensão do arquivo
    cb(null, `${id}${ext}`); // Renomear o arquivo com base no id
  },
});

const upload = multer({ storage });

// Middleware para servir arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rota para upload de imagem e salvar o post
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhuma imagem foi enviada." });
  }

  const { id, title, description, animalType } = req.body;
  const filePath = `http://localhost:${PORT}/uploads/${req.file.filename}`;

  // Carregar os posts existentes
  const posts = loadPosts();

  // Adicionar o novo post
  const newPost = { id, title, description, animalType, image: filePath };
  posts.push(newPost);

  // Salvar os posts atualizados
  savePosts(posts);

  res.json({ filePath });
});

// Rota para obter a lista de posts
app.get("/posts", (req, res) => {
  const posts = loadPosts();
  res.json(posts);
});

// Rota para deletar um post
app.delete("/posts/:id", (req, res) => {
  const { id } = req.params;

  // Carregar os posts existentes
  const posts = loadPosts();

  // Encontrar o post a ser deletado
  const postToDelete = posts.find((post) => post.id === id);
  if (!postToDelete) {
    return res.status(404).json({ error: "Post não encontrado." });
  }

  // Carregar os posts deletados existentes
  const adotados = loadAdotados();

  // Adicionar o post deletado ao arquivo adotados.json
  adotados.push(postToDelete);
  saveAdotados(adotados);

  // Filtrar os posts para remover o post com o id correspondente
  const updatedPosts = posts.filter((post) => post.id !== id);

  // Salvar os posts atualizados
  savePosts(updatedPosts);

  res.json({ message: "Post deletado e salvo em adotados.json com sucesso!" });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});