import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Popup({ message, onClose }) {
  setTimeout(onClose, 7000);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-red-400 text-white px-6 py-3 rounded shadow-lg animate-fade-in">
      {message}
    </div>
  );
}

export default function Login() {
  const [screen, setScreen] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(null);
  const navigate = useNavigate();

  function formatPhoneNumber(raw) {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("55")) digits = digits.slice(2);
    if (digits.length >= 12 && digits.startsWith("0")) digits = digits.slice(1);
    digits = digits.slice(-11);
    if (digits.length !== 11) return "";
    return `+55${digits}`;
  }

  function showPopup(msg) {
    setPopup(msg);
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem(
          "user",
          JSON.stringify({ username: data.username, isAdmin: data.isAdmin })
        );
        navigate("/posts");
      } else {
        showPopup(data.error || "Erro ao fazer login");
      }
    } catch (error) {
      showPopup("Erro ao conectar ao servidor");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !phoneNumber.trim()) {
      return showPopup("Preencha todos os campos.");
    }
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      return showPopup(
        "Digite um número válido no formato 88999999999 ou +5588999999999"
      );
    }
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          phoneNumber: formattedPhone,
          isAdmin: false,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setScreen("login");
        setUsername("");
        setPassword("");
        setPhoneNumber("");
        showPopup("Usuário cadastrado com sucesso!");
      } else {
        showPopup(data.error || "Erro ao realizar cadastro.");
      }
    } catch (error) {
      showPopup("Erro ao realizar cadastro.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#7e2bc7] via-[#8c30dd82] to-[#9d36f776]">
      {popup && <Popup message={popup} onClose={() => setPopup(null)} />}
      <section
        id="login"
        className="relative bg-white w-[300px] md:w-[80vw] lg:w-[950px] h-[515px] md:h-[400px] rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden"
      >
        
        <div className="block md:hidden w-full h-[120px] bg-[#5e17eb33] flex items-center justify-center">
          <div
            className="w-32 h-24 bg-center bg-no-repeat bg-contain"
            style={{ backgroundImage: "url('assets/logo.png')" }}
          ></div>
        </div>
        <div
          id="imagem"
          className="hidden md:block md:w-[30%] lg:w-[50%] h-full bg-[#5e17eb33] bg-[url('assets/logo.png')] bg-center bg-no-repeat bg-contain"
        ></div>

        <div
          id="formulario"
          className="flex-1 flex flex-col justify-center px-6 py-8"
        >
          <h1 className="text-2xl font-bold text-center mb-2">
            {screen === "login" ? "Login" : "Cadastro"}
          </h1>
          <p className="text-center text-gray-700 mb-6">
            {screen === "login"
              ? "Seja bem-vindo(a). Faça login para acessar sua conta."
              : "Preencha os campos para criar sua conta."}
          </p>
          <form
            onSubmit={screen === "login" ? handleLogin : handleRegister}
            className="space-y-4"
            autoComplete="on"
          >
            <div className="flex items-center bg-[#9633ec26] rounded-md px-2">
              <span className="material-symbols-outlined text-[#9533EC] text-2xl mr-2">
                person
              </span>
              <input
                type="text"
                name="login"
                id="ilogin"
                placeholder="Usuário"
                autoComplete="username"
                maxLength={30}
                className="bg-transparent flex-1 outline-none py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center bg-[#9633ec26] rounded-md px-2">
              <span className="material-symbols-outlined text-[#9533EC] text-2xl mr-2">
                vpn_key
              </span>
              <input
                type="password"
                name="senha"
                id="isenha"
                placeholder="Senha"
                autoComplete={
                  screen === "login" ? "current-password" : "new-password"
                }
                minLength={8}
                maxLength={20}
                className="bg-transparent flex-1 outline-none py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {screen === "register" && (
              <div className="flex items-center bg-[#9633ec26] rounded-md px-2">
                <span className="material-symbols-outlined text-[#9533EC] text-2xl mr-2">
                  call
                </span>
                <input
                  type="tel"
                  name="phone"
                  id="iphone"
                  placeholder="88 99999-9999"
                  autoComplete="tel"
                  className="bg-transparent flex-1 outline-none py-2"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9533EC] hover:bg-[#7e2bc7] text-white rounded-md py-2 mt-2 transition-colors"
            >
              {loading
                ? "Aguarde..."
                : screen === "login"
                ? "Entrar"
                : "Cadastrar"}
            </button>
          </form>
          {screen === "login" ? (
            <button
              onClick={() => setScreen("register")}
              className="w-full mt-4 border border-green-600 text-green-700 rounded-md py-2 flex items-center justify-center gap-2 bg-white hover:bg-green-600 hover:text-white transition-colors"
              type="button"
            >
              Crie sua Conta
              <span className="material-symbols-outlined text-base">mail</span>
            </button>
          ) : (
            <button
              onClick={() => setScreen("login")}
              className="w-full mt-4 text-blue-600 underline"
              type="button"
            >
              Já tem uma conta? Faça login
            </button>
          )}
        </div>
      </section>
      
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </main>
  );
}
