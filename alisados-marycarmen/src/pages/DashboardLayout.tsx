// src/pages/DashboardLayout.tsx
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function DashboardLayout() {
  const { logout } = useAuth();
  const location = useLocation();

  // ✅ Rutas relativas para que funcionen dentro de /dashboard
  const menuItems = [
    { path: "profile", label: "Perfil" },
    { path: "services", label: "Servicios" },
    { path: "calendar", label: "Calendario" }, // ✅ NUEVO
    { path: "accounts", label: "Cuentas" },
    { path: "schedule-config", label: "Configuración de horarios" },

  ];

  return (
    <div className="flex h-screen">
      {/* SIDEBAR MENU */}
      <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
        <h2 className="text-2xl font-bold mb-8">Panel</h2>
        <nav className="flex flex-col gap-4 flex-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path} // 🔥 relativo a /dashboard
              className={`p-2 rounded hover:bg-gray-700 transition ${
                location.pathname.endsWith(item.path) ? "bg-gray-700" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* BOTÓN DE LOGOUT */}
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 w-full py-2 rounded text-white"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 bg-gray-100 p-6 overflow-y-auto">
        <Outlet /> {/* Aquí cargan ProfilePage o ServicesPage */}
      </main>
    </div>
  );
}
