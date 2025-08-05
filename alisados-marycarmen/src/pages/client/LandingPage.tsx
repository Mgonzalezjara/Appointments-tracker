import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { FaWhatsapp } from "react-icons/fa";
import {
  Menu, X, ClipboardList, CalendarCheck, LogIn,
  Phone, Mail, Facebook, Instagram, Globe, MessageCircle, Music2
} from "lucide-react";

const PROFESSIONAL_UID = "XrNrVJJrZaSBYJF8WnNj2a3p0iW2";

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);
  const [hasServices, setHasServices] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const profSnap = await getDoc(doc(db, "professionals", PROFESSIONAL_UID));
      if (profSnap.exists()) setBusinessData(profSnap.data());

      const serviceSnap = await getDocs(collection(db, "professionals", PROFESSIONAL_UID, "services"));
      const available = serviceSnap.docs.some((doc) => (doc.data() as any).available === true);
      setHasServices(available);
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Navbar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center relative">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => navigate("/")}
        >
          {businessData?.logo ? (
            <img
              src={businessData.logo}
              alt="Logo"
              className="h-10 object-contain"
            />
          ) : (
            <h1 className="text-2xl font-bold text-blue-600">
              {businessData?.bussiness_name || "Mi Negocio"}
            </h1>
          )}
        </div>
        <div className="hidden md:flex gap-6 items-center">
          {hasServices && (
            <button onClick={() => navigate("/servicios")} className="flex items-center gap-2 text-gray-700 hover:text-blue-500">
              <ClipboardList className="w-4 h-4" /> Servicios
            </button>
          )}
          <button
            onClick={() => navigate(hasServices ? "/servicios" : "/getcitas")}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-500"
          >
            <CalendarCheck className="w-4 h-4" /> Obtener una cita
          </button>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <LogIn className="w-4 h-4" /> Login Profesional
          </button>
        </div>
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg p-4 flex flex-col gap-4 absolute top-16 left-0 right-0 z-50">
          {hasServices && (
            <button onClick={() => { navigate("/servicios"); setIsMenuOpen(false); }} className="flex items-center gap-2 text-gray-700 hover:text-blue-500">
              <ClipboardList className="w-4 h-4" /> Servicios
            </button>
          )}
          <button
            onClick={() => { navigate(hasServices ? "/servicios" : "/getcitas"); setIsMenuOpen(false); }}
            className="flex items-center gap-2 text-gray-700 hover:text-blue-500"
          >
            <CalendarCheck className="w-4 h-4" /> Obtener una cita
          </button>
          <button
            onClick={() => { navigate("/login"); setIsMenuOpen(false); }}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            <LogIn className="w-4 h-4" /> Login Profesional
          </button>
        </div>
      )}

      {/* Contenido dinámico */}
      <main className="flex-1">
        <Outlet context={{ businessData, hasServices }} />
      </main>

      {/* WhatsApp flotante */}
      {businessData?.whatsapp && (
        <a
          href={`https://wa.me/${businessData.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-green-500 p-4 rounded-full text-white shadow-lg hover:bg-green-600"
        >
          <FaWhatsapp size={28} />
        </a>
      )}

      {/* Footer dinámico */}
      <footer className="bg-gray-100 text-center py-6 text-sm text-gray-600">
        {/* Logo o nombre en el footer */}
        <div className="mb-4 flex justify-center">
          {businessData?.logo ? (
            <img src={businessData.logo} alt="Logo" className="h-12 object-contain" />
          ) : (
            <span className="text-lg font-bold text-blue-600">
              {businessData?.bussiness_name || "Mi Negocio"}
            </span>
          )}
        </div>

        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          {businessData?.phone && (
            <a href={`tel:${businessData.phone}`} className="flex items-center gap-2 hover:underline">
              <Phone size={16} /> {businessData.phone}
            </a>
          )}
          {businessData?.email && (
            <a href={`mailto:${businessData.email}`} className="flex items-center gap-2 hover:underline">
              <Mail size={16} /> {businessData.email}
            </a>
          )}
          {businessData?.facebook && (
            <a href={businessData.facebook} target="_blank" className="flex items-center gap-2 hover:underline">
              <Facebook size={16} /> Facebook
            </a>
          )}
          {businessData?.tiktok && (
            <a href={businessData.tiktok} target="_blank" className="flex items-center gap-2 hover:underline">
              <Music2 size={16} /> TikTok
            </a>
          )}
          {businessData?.website && (
            <a href={businessData.website} target="_blank" className="flex items-center gap-2 hover:underline">
              <Globe size={16} /> Sitio Web
            </a>
          )}
          {businessData?.instagram && (
            <a href={businessData.instagram} target="_blank" className="flex items-center gap-2 hover:underline">
              <Instagram size={16} /> Instagram
            </a>
          )}
          {businessData?.threads && (
            <a href={businessData.threads} target="_blank" className="flex items-center gap-2 hover:underline">
              <MessageCircle size={16} /> Threads
            </a>
          )}
        </div>

        © {new Date().getFullYear()} {businessData?.bussiness_name || "Mi Negocio"}. Todos los derechos reservados.
      </footer>
    </div>
  );
}
