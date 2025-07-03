import { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import authService from "../utils/auth";
import { API_URL } from "../config/api";

function AddPost({ onAddPostSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [animalType, setAnimalType] = useState("dog");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !image) {
      return alert("Preencha todos os campos.");
    }

    if (!authService.isAuthenticated()) {
      return alert("Você precisa estar logado para criar um post.");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("animalType", animalType);
    formData.append("image", image);

    try {
      console.log('📤 Enviando post...');
      
      const response = await authService.authenticatedFetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: {
          // Remove Content-Type para FormData
          'Authorization': `Session ${authService.getSessionId()}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        onAddPostSubmit(data.post);
        setTitle("");
        setDescription("");
        setImage(null);
        setAnimalType("dog");
        alert("Post criado com sucesso!");
      } else {
        alert(data.error || "Erro ao criar o post.");
      }
    } catch (error) {
      console.error("Erro ao enviar o post:", error);
      if (error.message === 'Sessão expirada') {
        alert("Sua sessão expirou. Você será redirecionado para o login.");
      } else {
        alert("Erro ao enviar o post. Verifique sua conexão.");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-4 p-6 bg-slate-200 rounded-md">
      <h3 className="text-lg font-bold">Adicionar Novo Post</h3>
      
      <Input
        type="text"
        placeholder="Título do post"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
      />
      
      <textarea
        className="border border-slate-300 outline-slate-400 px-4 py-2 rounded-md w-full disabled:opacity-50"
        placeholder="Descrição do post"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        disabled={loading}
      />
      
      <select
        className="border border-slate-300 outline-slate-400 px-4 py-2 rounded-md w-full disabled:opacity-50"
        value={animalType}
        onChange={(e) => setAnimalType(e.target.value)}
        disabled={loading}
      >
        <option value="dog">Cachorro</option>
        <option value="cat">Gato</option>
      </select>
      
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="border border-slate-300 outline-slate-400 px-4 py-2 rounded-md w-full disabled:opacity-50"
        disabled={loading}
      />
      
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "Adicionar Post"}
      </Button>
    </div>
  );
}

export default AddPost;