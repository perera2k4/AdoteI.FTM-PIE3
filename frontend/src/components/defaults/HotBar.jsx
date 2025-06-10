import { useState } from "react";
import { Home, MapPin, ShoppingBag, User } from "lucide-react";

export default function HotBar() {
  const [active, setActive] = useState("home");

  const buttons = [
    { id: "home", icon: <Home className="w-6 h-6" /> },
    { id: "location", icon: <MapPin className="w-6 h-6" /> },
    { id: "cart", icon: <ShoppingBag className="w-6 h-6" /> },
    { id: "user", icon: <User className="w-6 h-6" /> },
  ];

  return (
    <div className="fixed bottom-0 w-full flex justify-around items-center bg-purple-600 rounded-t-2xl py-3 px-6 z-50">
      {buttons.map(({ id, icon }) => (
        <button
          key={id}
          onClick={() => setActive(id)}
          className={`p-4 rounded-lg ${
            active === id ? "bg-white bg-opacity-20 text-white" : "text-white"
          }`}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
