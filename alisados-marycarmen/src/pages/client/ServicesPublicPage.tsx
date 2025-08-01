// src/pages/ServicesPublicPage.tsx
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  available: boolean; // ✅ Campo nuevo
}

export default function ServicesPublicPage({ professionalId }: { professionalId: string }) {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "professionals", professionalId, "services"));
      const data: Service[] = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Service),
        id: doc.id,
      }));

      // ✅ Filtrar solo los que están disponibles
      setServices(data.filter((service) => service.available));
    };
    fetchServices();
  }, [professionalId]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-center">Nuestros Servicios</h2>
      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
              <h3 className="text-xl font-semibold">{service.name}</h3>
              {service.description && <p className="text-gray-600 mt-2">{service.description}</p>}
              <p className="mt-3">
                <strong>Duración:</strong> {service.duration} min
              </p>
              <p className="mt-1 text-green-600 font-bold text-lg">${service.price}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center">No hay servicios disponibles en este momento.</p>
      )}
    </div>
  );
}
