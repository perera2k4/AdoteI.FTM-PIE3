import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import Login from './components/userdata/Login.jsx'
import Profile from './components/Profile.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true, // Remove o warning
        v7_relativeSplatPath: true // Remove outros warnings futuros
      }}
    >
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/posts" element={<App />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

/* import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import TaskPage from "./pages/TaskPage.jsx";
import PostPage from "./pages/PostPage.jsx";
import User from "./components/SideBar.jsx";
import Login from "./components/userdata/Login.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/task",
    element: <TaskPage />,
  },
  {
    path: "/post",
    element: <PostPage />,
  },
  {
    path: "/posts",
    element: <App />,
  },
  {
    path: "/user",
    element: <User />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
*/