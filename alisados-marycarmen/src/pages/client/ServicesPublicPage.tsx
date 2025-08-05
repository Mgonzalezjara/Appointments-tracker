import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";

interface OutletContext {
  businessData: any;
  hasServices: boolean;
}


interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  available: boolean;
  photos?: string[];
}

export default function ServicesPublicPage({ professionalId }: { professionalId: string }) {
  const [services, setServices] = useState<Service[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "professionals", professionalId, "services"));
      const data: Service[] = querySnapshot.docs.map((doc) => ({
        ...(doc.data() as Service),
        id: doc.id,
        photos: (doc.data() as any).photos || [],
      }));
      setServices(data.filter((service) => service.available));
    };
    fetchServices();
  }, [professionalId]);

  const handleSelectService = (service: Service) => {
    localStorage.setItem("selectedService", JSON.stringify(service));
    navigate("/getcitas");
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setPhotoIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const prevImage = () =>
    setPhotoIndex((prev) => (prev === 0 ? lightboxImages.length - 1 : prev - 1));

  const nextImage = () =>
    setPhotoIndex((prev) => (prev === lightboxImages.length - 1 ? 0 : prev + 1));

  const { businessData } = useOutletContext<OutletContext>();

  return (
  <div className="p-6 max-w-6xl mx-auto">
  <h2 className="text-3xl font-bold mb-6 text-center">Nuestros Servicios</h2>
  {services.length > 0 ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <div
      key={service.id}
      className="flex flex-col justify-between h-full bg-white shadow-md rounded-lg p-4 border border-gray-200 hover:shadow-lg transition"
    >
      {service.photos && service.photos.length > 0 ? (
        <img
          src={service.photos[0]}
          alt="Foto del servicio"
          className="w-full h-48 object-cover rounded mb-3 cursor-pointer"
          onClick={() => openLightbox(service.photos!, 0)}
        />
      ) : businessData?.logo ? (
        <img
          src={businessData.logo}
          alt="Logo del negocio"
          className="w-full h-48 object-contain rounded mb-3 bg-gray-100 p-4"
        />
      ) : (
        <img
          src="/placeholder-service.png"
          alt="Servicio sin imagen"
          className="w-full h-48 object-cover rounded mb-3 opacity-80"
        />
      )}

      <div className="flex-grow">
        <h3 className="text-xl font-semibold">{service.name}</h3>
        {service.description && (
          <p className="text-gray-600 mt-2">{service.description}</p>
        )}
        <p className="mt-3"><strong>Duración:</strong> {service.duration} min</p>
        <p className="mt-1 text-green-600 font-bold text-lg">${service.price}</p>
      </div>

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

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
          {/* Botón cerrar */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 text-white text-3xl font-bold"
          >
            ✕
          </button>

          {/* Imagen centrada */}
          <img
            src={lightboxImages[photoIndex]}
            alt="Vista ampliada"
            className="max-h-[80vh] max-w-[80vw] rounded shadow-lg z-10"
          />

          {/* Flechas en pantalla completa */}
          <button
            onClick={prevImage}
            className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white text-5xl font-bold z-20"
          >
            ‹
          </button>
          <button
            onClick={nextImage}
            className="absolute right-5 top-1/2 transform -translate-y-1/2 text-white text-5xl font-bold z-20"
          >
            ›
          </button>

          <p className="text-white mt-4 text-sm z-10">
            {photoIndex + 1} / {lightboxImages.length}
          </p>
        </div>
      )}
    </div>
  );
}
