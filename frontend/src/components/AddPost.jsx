import { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Importar uuid
import Input from "./Input";

function AddPost({ onAddPostSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return alert("Preencha o título e a descrição.");
    }

    const id = uuidv4(); // Gerar um id único para o post
    const formData = new FormData();
    formData.append("id", id); // Enviar o id para o backend
    formData.append("title", title);
    formData.append("description", description);
    if (image) {
      formData.append("image", image);
    }

    // Enviar os dados para o backend
    const response = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    const newTask = {
      id, // Usar o mesmo id gerado
      title,
      description,
      image: data.filePath, // URL da imagem retornada pelo backend
    };

    onAddPostSubmit(newTask);
    setTitle("");
    setDescription("");
    setImage(null);
  };

  return (
    <div className="space-y-4 p-6 bg-slate-200 rounded-md shadow flex flex-col">
      <Input
        type="text"
        placeholder="Digite o título"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input
        type="text"
        placeholder="Digite a descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button
        onClick={handleSubmit}
        className="bg-purple-600 text-white px-4 py-2 rounded-md font-medium"
      >
        Adicionar
      </button>
    </div>
  );
}

export default AddPost;
