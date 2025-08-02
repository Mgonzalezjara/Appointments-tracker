// src/pages/ServicesPublicPage.tsx
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  available: boolean;
}

export default function ServicesPublicPage({ professionalId }: { professionalId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "professionals", professionalId, "services"));
      const data: Service[] = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Service),
        id: doc.id,
      }));
      setServices(data.filter((service) => service.available));
    };
    fetchServices();
  }, [professionalId]);

  const handleSelectService = (service: Service) => {
    localStorage.setItem("selectedService", JSON.stringify(service));
    navigate("/getcitas");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Nuestros Servicios</h2>
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold">{service.name}</h3>
              {service.description && <p className="text-gray-600 mt-2">{service.description}</p>}
              <p className="mt-3"><strong>Duración:</strong> {service.duration} min</p>
              <p className="mt-1 text-green-600 font-bold text-lg">${service.price}</p>
              <button
                onClick={() => handleSelectService(service)}
                className="mt-4 w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Seleccionar y Agendar
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No hay servicios disponibles en este momento.</p>
      )}
    </div>
  );
}
