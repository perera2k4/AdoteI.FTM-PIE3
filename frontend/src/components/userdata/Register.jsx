import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // Novo campo para telefone
  const navigate = useNavigate(); // Hook para redirecionamento

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !phoneNumber.trim()) {
      return alert("Preencha todos os campos.");
    }

    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, isAdmin: false, phoneNumber }), // isAdmin definido como false
      });

      const data = await response.json();
      if (response.ok) {
        alert("Usuário cadastrado com sucesso!");
        navigate("/login"); // Redirecionar para a tela de login
      } else {
        alert(data.error || "Erro ao realizar cadastro.");
      }
    } catch (error) {
      console.error("Erro ao realizar cadastro:", error);
      alert("Erro ao realizar cadastro.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">Cadastro</h1>
      <input
        type="text"
        placeholder="Usuário"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded-md w-full max-w-sm mb-4"
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded-md w-full max-w-sm mb-4"
      />
      <input
        type="tel"
        placeholder="Telefone:"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="border p-2 rounded-md w-full max-w-sm mb-4"
      />
      <button
        onClick={handleRegister}
        className="bg-green-500 text-white px-4 py-2 rounded-md w-full max-w-sm"
      >
        Cadastrar
      </button>
      <button
        onClick={() => navigate("/login")}
        className="text-blue-500 underline mt-4"
      >
        Já tem uma conta? Faça login
      </button>
    </div>
  );
}