const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const app = express(); // Inicialize o app aqui
const PORT = 5000;

// Caminho para o arquivo JSON onde os posts serão armazenados
const postsFilePath = path.join(__dirname, "posts.json");

// Função para carregar os posts do arquivo JSON
const loadPosts = () => {
  if (!fs.existsSync(postsFilePath)) {
    return [];
  }
  const data = fs.readFileSync(postsFilePath, "utf-8");
  return JSON.parse(data);
};

// Função para salvar os posts no arquivo JSON
const savePosts = (posts) => {
  fs.writeFileSync(postsFilePath, JSON.stringify(posts, null, 2));
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

  const { id, title, description } = req.body;
  const filePath = `http://localhost:${PORT}/uploads/${req.file.filename}`;

  // Carregar os posts existentes
  const posts = loadPosts();

  // Adicionar o novo post
  const newPost = { id, title, description, image: filePath };
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

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});