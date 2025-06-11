import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

function AddPost({ onAddPostSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [animalType, setAnimalType] = useState("dog"); // Estado para o tipo de animal

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      return alert("Preencha o título e a descrição.");
    }

    const id = uuidv4(); // Gerar um id único para o post
    const formData = new FormData();
    formData.append("id", id);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("animalType", animalType); // Enviar o tipo de animal
    if (image) {
      formData.append("image", image);
    }

    // Enviar os dados para o backend
    const response = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    const newPost = {
      id,
      title,
      description,
      animalType,
      image: data.filePath,
    };

    onAddPostSubmit(newPost);
    setTitle("");
    setDescription("");
    setImage(null);
    setAnimalType("dog"); // Resetar o tipo de animal para o padrão
  };

  return (
    <div className="space-y-4 p-6 bg-slate-200 rounded-md shadow flex flex-col">
      <input
        type="text"
        placeholder="Digite o nome do pet"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded-md"
      />
      <textarea
        placeholder="Digite a descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded-md"
      />
      <select
        value={animalType}
        onChange={(e) => setAnimalType(e.target.value)}
        className="border p-2 rounded-md"
      >
        <option value="dog">Cachorro</option>
        <option value="cat">Gato</option>
      </select>
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