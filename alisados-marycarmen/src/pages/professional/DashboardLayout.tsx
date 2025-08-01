// src/pages/DashboardLayout.tsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { useState } from "react";
import { Menu, X } from "lucide-react"; // Iconos (npm i lucide-react)

export default function DashboardLayout() {
  const { logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { path: "profile", label: "Perfil" },
    { path: "services", label: "Servicios" },
    { path: "calendar", label: "Calendario" },
    { path: "accounts", label: "Cuentas" },
    { path: "schedule-config", label: "Configuración de horarios" },
  ];

  return (
    <div className="flex h-screen relative">
      {/* 🔥 BOTÓN HAMBURGUESA SOLO EN MOBILE (ahora a la DERECHA) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 right-4 z-50 p-2 rounded-md bg-gray-800 text-white md:hidden"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* SIDEBAR (DESKTOP A LA IZQUIERDA, MOBILE DESLIZADO DESDE DERECHA) */}
      <aside
        className={`fixed md:static z-40 h-full w-64 bg-gray-800 text-white p-6 flex flex-col transform transition-transform duration-300
        md:translate-x-0 md:right-auto 
        ${isSidebarOpen ? "translate-x-0 right-0" : "translate-x-full right-0"} md:left-0`}
      >
        <h2 className="text-2xl font-bold mb-8">Panel</h2>
        <nav className="flex flex-col gap-4 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`p-2 rounded hover:bg-gray-700 transition ${
                location.pathname.endsWith(item.path) ? "bg-gray-700" : ""
              }`}
              onClick={() => setIsSidebarOpen(false)} // 🔥 Cierra menú al navegar
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 w-full py-2 rounded text-white"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
