// src/pages/LandingPage.tsx
import { Outlet, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1
          className="text-2xl font-bold cursor-pointer text-blue-600"
          onClick={() => navigate("/")}
        >
          Alisados MC
        </h1>
        <div className="flex gap-6">
          <button onClick={() => navigate("/servicios")} className="text-gray-700 hover:text-blue-500">
            Servicios
          </button>
          <button onClick={() => navigate("/getcitas")} className="text-gray-700 hover:text-blue-500">
            Obtener una cita
          </button>
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Login Profesional
          </button>
        </div>
      </nav>

      {/* Contenido dinámico */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-600">
        © {new Date().getFullYear()} Alisados Mary Carmen. Todos los derechos reservados.
      </footer>
    </div>
  );
}
