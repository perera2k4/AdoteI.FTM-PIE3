import { useState } from "react";
import New from "./New";
import Register from "./Register";

export default function Login() {
  const [screen, setScreen] = useState("login"); // Alternar entre login e registro

  return (
    <div>
      {screen === "login" ? (
        <New />
      ) : (
        <Register />
      )}
      <div className="flex justify-center mt-4">
        {screen === "login" ? (
          <button
            onClick={() => setScreen("register")}
            className="text-blue-500 underline"
          >
            Não tem uma conta? Cadastre-se
          </button>
        ) : (
          <button
            onClick={() => setScreen("login")}
            className="text-blue-500 underline"
          >
            Já tem uma conta? Faça login
          </button>
        )}
      </div>
    </div>
  );
}