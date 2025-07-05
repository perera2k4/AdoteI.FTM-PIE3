import { useState } from "react";
import { Dog, Cat, Upload, Save, Camera } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import authService from "../utils/auth";
import { useNavigate } from "react-router-dom";

function AddPost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [animalType, setAnimalType] = useState("dog");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamanho da imagem (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB");
        return;
      }

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert("Por favor, selecione apenas arquivos de imagem");
        return;
      }

      setImage(file);

      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !image) {
      return alert("Preencha todos os campos.");
    }

    if (!authService.isAuthenticated()) {
      return alert("Você precisa estar logado para criar um post.");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("animalType", animalType);
    formData.append("image", image);

    try {
      console.log("📤 Enviando post para:", `/upload`);
      console.log("📝 Dados do post:", {
        title: title.trim(),
        description: description.trim(),
        animalType,
        imageSize: image.size,
        imageName: image.name,
        imageType: image.type
      });

      const response = await authService.authenticatedFetch("/upload", {
        method: "POST",
        body: formData,
      });

      console.log("🔄 Resposta recebida:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro na resposta:", errorText);
        
        let errorMessage = "Erro ao criar o post";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("❌ Erro ao parsear resposta:", e);
          errorMessage = `Erro do servidor: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Post criado com sucesso:", data);
      
      // Adiciona o phoneNumber do usuário atual ao post
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.phoneNumber) {
        data.post.phoneNumber = currentUser.phoneNumber;
      }
      
      
      setTitle("");
      setDescription("");
      setImage(null);
      setImagePreview(null);
      setAnimalType("dog");
      // alert("Post criado com sucesso!");
      navigate("/profile");
      
    } catch (error) {
      console.error("❌ Erro ao enviar o post:", error);
      
      if (error.message === "Sessão expirada") {
        alert("Sua sessão expirou. Você será redirecionado para o login.");
      } else if (error.message.includes("Failed to fetch")) {
        alert("Erro de conexão com o servidor. Verifique sua internet e tente novamente.");
      } else if (error.message.includes("NetworkError")) {
        alert("Erro de rede. Verifique sua conexão e tente novamente.");
      } else {
        alert(error.message || "Erro ao enviar o post. Tente novamente.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden border border-gray-200 max-w-md mx-auto">
      {/* Content */}
      <div className="p-6 space-y-2">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do Pet
          </label>
          <Input
            type="text"
            placeholder="Ex: Totó, Rex, Bixano..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
          />
        </div>

        {/* Tipo de Animal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Animal
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAnimalType("dog")}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                animalType === "dog"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              disabled={loading}
            >
              <Dog size={20} />
              <span className="text-sm font-medium">Cachorro</span>
            </button>
            <button
              type="button"
              onClick={() => setAnimalType("cat")}
              className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                animalType === "cat"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              disabled={loading}
            >
              <Cat size={20} />
              <span className="text-sm font-medium">Gato</span>
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            placeholder="Conte sobre o pet: idade, personalidade, cuidados..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Upload de Imagem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto do Pet
          </label>

          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setImagePreview(null);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                disabled={loading}
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex gap-4 items-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <div>
                <Camera size={32} className="mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600 mb-3 text-sm">
                  Adicione uma foto do pet
                </p>
                <p className="text-xs text-gray-500">
                  Máximo 5MB - JPG, PNG, GIF
                </p>
              </div>
              <label className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm">
                <Upload size={16} />
                Selecionar Foto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center p-2 border-t border-gray-200">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex flex-col w-full bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Enviando...
            </>
          ) : (
            <>
              <div className="flex gap-2">
                <Save size={20} />
                Adicionar Post
              </div>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default AddPost;