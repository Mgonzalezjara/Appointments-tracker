import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/authContext";
import { db } from "../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const CLOUDINARY_UPLOAD_PRESET = "bookmeenlinea";
const CLOUDINARY_CLOUD_NAME = "domgxhgay";

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
    logo: "",
  });

  const [uploading, setUploading] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        logo: professionalProfile.logo || "",
      });
    }
  }, [professionalProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 📷 Selección de archivo con validación
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Solo se permiten imágenes en formato JPG, JPEG, PNG o WebP");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("La imagen no puede superar los 3MB");
      return;
    }

    setSelectedFile(file);
    setPreviewLogo(URL.createObjectURL(file));
  };

  // 📤 Subir logo
  const handleUploadLogo = async () => {
    if (!selectedFile) return alert("Primero selecciona una imagen");

    setUploading(true);
    const data = new FormData();
    data.append("file", selectedFile);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: data,
      });
      const json = await res.json();

      if (json.secure_url) {
        setFormData((prev) => ({ ...prev, logo: json.secure_url }));
        setPreviewLogo(null);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // 🔥 Limpiar input
        alert("Logo subido correctamente");

        if (user) {
          const docRef = doc(db, "professionals", user.uid);
          await updateDoc(docRef, { logo: json.secure_url });
        }
      } else {
        alert("Error al subir la imagen");
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      alert("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  // ❌ Cancelar selección de nuevo logo
  const handleCancelNewLogo = () => {
    setPreviewLogo(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = ""; // 🔥 Limpiar input
  };

  // 🗑️ Eliminar logo
  const handleDeleteLogo = async () => {
    if (!user) return;
    const confirmDelete = confirm("¿Seguro que deseas eliminar el logo?");
    if (!confirmDelete) return;

    setFormData((prev) => ({ ...prev, logo: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    const docRef = doc(db, "professionals", user.uid);
    await updateDoc(docRef, { logo: "" });
    alert("Logo eliminado correctamente");
  };

  // Guardar todos los datos del perfil
  const handleUpdate = async () => {
    if (!user) return alert("Usuario no autenticado");
    const docRef = doc(db, "professionals", user.uid);
    await updateDoc(docRef, { ...formData });
    alert("Perfil actualizado correctamente");
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Tu Perfil</h2>

      {/* Logo */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">Logo del Negocio</label>

        {/* Logo actual */}
        {formData.logo && !previewLogo && (
          <div className="mb-3 flex flex-col items-start gap-2">
            <img src={formData.logo} alt="Logo actual" className="h-20 object-contain border rounded" />
            <button onClick={handleDeleteLogo} className="text-red-500 text-sm hover:underline">
              Eliminar logo
            </button>
          </div>
        )}

        {/* Preview y comparación */}
        {previewLogo && (
          <div className="mb-4 flex gap-6">
            {formData.logo && (
              <div className="flex flex-col items-center">
                <p className="text-sm text-gray-500 mb-1">Logo actual</p>
                <img src={formData.logo} alt="Logo actual" className="h-20 object-contain border rounded" />
              </div>
            )}
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-1">{formData.logo ? "Nuevo logo" : "Preview"}</p>
              <img src={previewLogo} alt="Preview logo" className="h-20 object-contain border-2 border-green-500 rounded" />
            </div>
          </div>
        )}

        {/* Botones para confirmar/cancelar nuevo logo */}
        {previewLogo && (
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleUploadLogo}
              disabled={uploading}
              className={`px-4 py-1 rounded text-white ${uploading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"}`}
            >
              {uploading ? "Subiendo..." : "Guardar nuevo logo"}
            </button>
            <button onClick={handleCancelNewLogo} className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300">
              Cancelar
            </button>
          </div>
        )}

        {/* Selector de archivo dinámico */}
        <label className="block">
          <span className="text-blue-600 cursor-pointer hover:underline">
            {formData.logo ? "Cambiar logo" : "Cargar logo"}
          </span>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </label>
      </div>

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
