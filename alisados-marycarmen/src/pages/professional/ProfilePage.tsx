// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

export default function ProfilePage() {
  const { user, professionalProfile } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rut: "",
    phone: "",
    website: "",
    address: "",
    speciality: "",
    bussiness_name: "",
    description: "",
    about_me: "",
    facebook: "",
    instagram: "",
    tiktok: "",
    whatsapp: "",
    threads: "",
  });

  useEffect(() => {
    if (professionalProfile) {
      setFormData({
        name: professionalProfile.name || "",
        email: professionalProfile.email || "",
        rut: professionalProfile.rut || "",
        phone: professionalProfile.phone || "",
        website: professionalProfile.website || "",
        address: professionalProfile.address || "",
        speciality: professionalProfile.speciality || "",
        bussiness_name: professionalProfile.bussiness_name || "",
        description: professionalProfile.description || "",
        about_me: professionalProfile.about_me || "",
        facebook: professionalProfile.facebook || "",
        instagram: professionalProfile.instagram || "",
        tiktok: professionalProfile.tiktok || "",
        whatsapp: professionalProfile.whatsapp || "",
        threads: professionalProfile.threads || "",

      });
    }
  }, [professionalProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!user) return alert("Usuario no autenticado");
    const docRef = doc(db, "professionals", user.uid);
    await updateDoc(docRef, { ...formData });
    alert("Perfil actualizado correctamente");
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Tu Perfil</h2>

      {/* Información del Negocio */}
      <h3 className="text-lg font-semibold mb-2">Información del Negocio</h3>
      <div className="mb-4">
        <label className="block mb-1">Nombre del Negocio</label>
        <input
          name="bussiness_name"
          value={formData.bussiness_name}
          onChange={handleChange}
          className="border w-full p-2"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Descripción (se muestra en el Hero)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="border w-full p-2 h-20"
        />
      </div>
      <div className="mb-6">
        <label className="block mb-1">Sobre mí (formación o experiencia)</label>
        <textarea
          name="about_me"
          value={formData.about_me}
          onChange={handleChange}
          className="border w-full p-2 h-20"
        />
      </div>

      {/* Datos Personales */}
      <h3 className="text-lg font-semibold mb-2">Datos Personales</h3>
      {["name", "rut", "phone", "website", "address", "speciality"].map((field) => (
        <div key={field} className="mb-4">
          <label className="block mb-1 capitalize">{field}</label>
          <input
            name={field}
            value={(formData as any)[field]}
            onChange={handleChange}
            className="border w-full p-2"
          />
        </div>
      ))}
      <label className="block mb-1">Email</label>
      <input value={formData.email} disabled className="border w-full p-2 mb-6 bg-gray-100" />

      {/* Redes Sociales */}
      <h3 className="text-lg font-semibold mb-2">Redes Sociales</h3>
      {["facebook", "instagram", "tiktok", "whatsapp", "threads"].map((field) => (
        <div key={field} className="mb-4">
          <label className="block mb-1 capitalize">{field}</label>
          <input
            name={field}
            value={(formData as any)[field]}
            onChange={handleChange}
            className="border w-full p-2"
          />
        </div>
      ))}

      <button
        onClick={handleUpdate}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4"
      >
        Actualizar datos
      </button>
    </div>
  );
}
