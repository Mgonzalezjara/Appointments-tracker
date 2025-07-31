// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { db } from "../firebaseConfig";
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
      });
    }
  }, [professionalProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    if (!user) return alert("Usuario no autenticado");

    const docRef = doc(db, "professionals", user.uid);
    await updateDoc(docRef, { ...formData });
    alert("Perfil actualizado correctamente");
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold mb-4">Tu Perfil</h2>
      {/* Inputs */}
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
      <input value={formData.email} disabled className="border w-full p-2 mb-4 bg-gray-100" />
      <button
        onClick={handleUpdate}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Actualizar datos
      </button>
    </div>
  );
}
