// src/pages/LandingHome.tsx
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const PROFESSIONAL_UID = "XrNrVJJrZaSBYJF8WnNj2a3p0iW2";
const DEFAULT_IMAGE = "https://via.placeholder.com/600x400?text=Logo+por+defecto";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  available: boolean;
  photos?: string[];
}

export default function LandingHome() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [businessData, setBusinessData] = useState<any>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const profSnap = await getDoc(doc(db, "professionals", PROFESSIONAL_UID));
      if (profSnap.exists()) setBusinessData(profSnap.data());

      const serviceSnap = await getDocs(collection(db, "professionals", PROFESSIONAL_UID, "services"));
      const data: Service[] = serviceSnap.docs.map((doc) => ({ ...(doc.data() as Service), id: doc.id }));
      const availableServices = data.filter((s) => s.available);
      setServices(availableServices.slice(0, 3));
    };
    fetchData();
  }, []);

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);
  const prevImage = () => setLightboxIndex((lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length);
  const nextImage = () => setLightboxIndex((lightboxIndex + 1) % lightboxImages.length);

  return (
    <div>
      {/* Hero */}
  <header
  className={`relative text-center py-20 px-4 ${
    businessData?.gallery?.length ? "text-white" : "bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800"
  }`}
  style={
    businessData?.gallery?.length
      ? { 
          backgroundImage: `url(${businessData.gallery[0]})`, 
          backgroundSize: "cover", 
          backgroundPosition: "center" 
        }
      : {}
  }
>
  {/* 🔥 Eliminamos el overlay negro completamente */}
  <div className="relative z-10">
    <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
      Bienvenido a <span className="text-blue-400">{businessData?.bussiness_name || "Nuestro negocio"}</span>
    </h2>
    <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
      {businessData?.description || "Agenda tu cita fácilmente y descubre servicios profesionales diseñados para ti."}
    </p>
    <button
      onClick={() => navigate(services.length > 0 ? "/servicios" : "/getcitas")}
      className="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 shadow-md"
    >
      Reservar una Cita
    </button>
  </div>
</header>



      {/* Sobre mí */}
      {businessData?.about_me?.trim() && (
        <section className="py-10 bg-gray-50 px-6 text-center">
          <h3 className="text-2xl font-bold mb-4">Sobre mí</h3>
          <p className="max-w-3xl mx-auto text-gray-700">{businessData.about_me}</p>
        </section>
      )}

      {/* Servicios destacados */}
      <section className="py-16 bg-white px-6">
        <h3 className="text-3xl font-bold text-center mb-10 text-gray-800">Servicios Destacados</h3>
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service) => {
          const serviceImage =
            service.photos && service.photos.length > 0
              ? service.photos[0]
              : businessData?.logo || null;

          return (
            <div
              key={service.id}
              className="bg-white border border-gray-200 rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col items-center"
            >
              {serviceImage && (
                <img
                  src={serviceImage}
                  alt={service.name}
                  className="h-40 w-full object-cover rounded mb-4"
                />
              )}
              <h4 className="text-xl font-semibold text-gray-800 text-center">{service.name}</h4>
              {service.description && (
                <p className="text-gray-600 mt-2 text-sm text-center">{service.description}</p>
              )}
              <p className="mt-4 text-green-600 font-bold text-lg">${service.price}</p>
              <p className="text-sm text-gray-500 mb-4">Duración: {service.duration} min</p>
              <button
                onClick={() => {
                  localStorage.setItem("selectedService", JSON.stringify(service));
                  navigate("/getcitas");
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-auto"
              >
                Agendar ahora
              </button>
            </div>
          );
        })}

          </div>
        ) : (
          <p className="text-center text-gray-500">Pronto mostraremos nuestros servicios destacados.</p>
        )}
      </section>

      {/* Galería */}
      {businessData?.gallery?.length > 0 && (
        <section className="py-16 bg-gray-50 px-6">
          <h3 className="text-3xl font-bold text-center mb-10 text-gray-800">Galería</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {businessData.gallery.map((img: string, index: number) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg shadow cursor-pointer hover:opacity-80"
                onClick={() => openLightbox(businessData.gallery, index)}
              >
                <img src={img} alt={`Galería ${index}`} className="w-full h-48 object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={closeLightbox}>✕</button>
          <button className="absolute left-4 text-white text-4xl" onClick={prevImage}>‹</button>
          <img src={lightboxImages[lightboxIndex]} alt="lightbox" className="max-h-[80vh] max-w-[90vw] object-contain" />
          <button className="absolute right-4 text-white text-4xl" onClick={nextImage}>›</button>
        </div>
      )}
    </div>
  );
}
