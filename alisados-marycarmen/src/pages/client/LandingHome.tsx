// src/pages/LandingHome.tsx
import  { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}

const PROFESSIONAL_UID = "XrNrVJJrZaSBYJF8WnNj2a3p0iW2"; // 👈 Reemplaza con tu UID

export default function LandingHome() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "professionals", PROFESSIONAL_UID, "services"));
      const data: Service[] = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Service),
        id: doc.id,
      }));
      setServices(data.slice(0, 3));
    };
    fetchServices();
  }, []);

  return (
    <div>
      {/* Hero */}
      <header className="bg-gradient-to-r from-blue-50 to-blue-100 text-center py-20 px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-800">
          Bienvenido a <span className="text-blue-600">Alisados Mary Carmen</span>
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Agenda tu cita fácilmente y descubre servicios profesionales diseñados para ti.
        </p>
        <button
          onClick={() => navigate("/getcitas")}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 shadow-md"
        >
          Reservar una Cita
        </button>
      </header>

      {/* Servicios destacados */}
      <section className="py-16 bg-white px-6">
        <h3 className="text-3xl font-bold text-center mb-10 text-gray-800">Servicios Destacados</h3>
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition p-6 text-center"
              >
                <h4 className="text-xl font-semibold text-gray-800">{service.name}</h4>
                {service.description && <p className="text-gray-600 mt-2 text-sm">{service.description}</p>}
                <p className="mt-4 text-green-600 font-bold text-lg">${service.price}</p>
                <p className="text-sm text-gray-500 mb-4">Duración: {service.duration} min</p>
                <button
                  onClick={() => navigate("/getcitas")}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
                >
                  Agendar ahora
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Pronto mostraremos nuestros servicios destacados.</p>
        )}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate("/servicios")}
            className="text-blue-600 font-semibold hover:underline"
          >
            Ver todos los servicios →
          </button>
        </div>
      </section>
    </div>
  );
}
