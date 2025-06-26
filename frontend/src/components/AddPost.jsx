import { useState } from "react";

function AddPost({ onAddPostSubmit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [animalType, setAnimalType] = useState("dog");

  const handleImageChange = (event) => {
    setImage(event.target.files[0]);
  };

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
      const response = await fetch("http://localhost:5000/upload", {
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
      } else {
        alert(data.error || "Erro ao criar o post.");
      }
    } catch (error) {
      console.error("Erro ao enviar o post:", error);
      alert("Erro ao enviar o post.");
    }
  };

  return (
    <div className="space-y-4 p-6 bg-slate-200 rounded-md shadow flex flex-col">
      <input
        type="text"
        placeholder="Digite o título"
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
