import { useState } from "react";
import Input from "./Input";
import Button from "./Button";

// Configuração da URL da API
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function AddPost({ onAddPostSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [animalType, setAnimalType] = useState("dog");
  const [image, setImage] = useState(null);

  const handleSubmit = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const username = user?.username;
    const token = user?.token;

    if (!title.trim() || !description.trim() || !image || !username) {
      return alert("Preencha todos os campos.");
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("animalType", animalType);
    formData.append("image", image);
    formData.append("username", username);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      alert("Erro ao enviar o post.");
    }
  };

  return (
    <div className="space-y-4 p-6 bg-slate-200 rounded-md">
      <h3 className="text-lg font-bold">Adicionar Novo Post</h3>
      <Input
        type="text"
        placeholder="Título do post"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="border border-slate-300 outline-slate-400 px-4 py-2 rounded-md w-full"
        placeholder="Descrição do post"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <select
        className="border border-slate-300 outline-slate-400 px-4 py-2 rounded-md w-full"
        value={animalType}
        onChange={(e) => setAnimalType(e.target.value)}
      >
        <option value="dog">Cachorro</option>
        <option value="cat">Gato</option>
      </select>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files[0])}
        className="border border-slate-300 outline-slate-400 px-4 py-2 rounded-md w-full"
      />
      <Button onClick={handleSubmit}>Adicionar Post</Button>
    </div>
  );
}

export default AddPost;