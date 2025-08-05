import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/authContext";
import { updateProfileField, updateProfileData } from "../../services/professional/profileService";

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
    gallery: [] as string[],
  });

  // Logo
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Galería
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

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
        gallery: professionalProfile.gallery || [],
      });
    }
  }, [professionalProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ===================== LOGO =====================
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
      alert("Solo se permiten imágenes JPG, JPEG, PNG o WebP");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert("La imagen no puede superar los 3MB");
      return;
    }

    setSelectedLogoFile(file);
    setPreviewLogo(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!selectedLogoFile || !user) return alert("Selecciona una imagen");

    setUploadingLogo(true);
    const data = new FormData();
    data.append("file", selectedLogoFile);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: data });
      const json = await res.json();

      if (json.secure_url) {
        setFormData((prev) => ({ ...prev, logo: json.secure_url }));
        await updateProfileField(user.uid, "logo", json.secure_url);
        alert("Logo subido correctamente");
      }
    } catch (error) {
      alert("Error al subir el logo");
    } finally {
      setPreviewLogo(null);
      setSelectedLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      setUploadingLogo(false);
    }
  };

  const handleCancelNewLogo = () => {
    setPreviewLogo(null);
    setSelectedLogoFile(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleDeleteLogo = async () => {
    if (!user) return;
    if (!confirm("¿Eliminar el logo?")) return;
    setFormData((prev) => ({ ...prev, logo: "" }));
    await updateProfileField(user.uid, "logo", "");
    alert("Logo eliminado correctamente");
  };

  // ===================== GALERÍA =====================
  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
        alert("Formato inválido");
        return false;
      }
      if (file.size > 3 * 1024 * 1024) {
        alert("Una imagen supera los 3MB");
        return false;
      }
      return true;
    });

    const totalCount = (formData.gallery?.length || 0) + validFiles.length;
    if (totalCount > 7) {
      alert("Máximo 7 fotos en la galería");
      return;
    }

    setGalleryFiles(validFiles);
    setGalleryPreviews(validFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleUploadGallery = async () => {
    if (!galleryFiles.length || !user) return alert("Selecciona imágenes primero");
    setUploadingGallery(true);

    const uploadedUrls: string[] = [];
    for (const file of galleryFiles) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: data });
      const json = await res.json();
      if (json.secure_url) uploadedUrls.push(json.secure_url);
    }

    const updatedGallery = [...(formData.gallery || []), ...uploadedUrls];
    setFormData((prev) => ({ ...prev, gallery: updatedGallery }));
    await updateProfileField(user.uid, "gallery", updatedGallery);

    setGalleryFiles([]);
    setGalleryPreviews([]);
    alert("Galería actualizada correctamente");
    setUploadingGallery(false);
  };

  const handleDeleteGalleryPhoto = async (url: string) => {
    if (!user) return;
    const updated = (formData.gallery || []).filter((photo) => photo !== url);
    setFormData((prev) => ({ ...prev, gallery: updated }));
    await updateProfileField(user.uid, "gallery", updated);
    alert("Foto eliminada de la galería");
  };

  // ===================== GUARDAR PERFIL =====================
  const handleUpdateProfile = async () => {
    if (!user) return alert("Usuario no autenticado");
    await updateProfileData(user.uid, formData);
    alert("Perfil actualizado correctamente");
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Tu Perfil</h2>

      {/* LOGO */}
      <div className="mb-6">
        <label className="block mb-1 font-semibold">Logo del Negocio</label>
        {formData.logo && !previewLogo && (
          <div className="mb-3 flex flex-col items-start gap-2">
            <img src={formData.logo} alt="Logo actual" className="h-20 object-contain border rounded" />
            <button onClick={handleDeleteLogo} className="text-red-500 text-sm hover:underline">Eliminar logo</button>
          </div>
        )}
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
        {previewLogo && (
          <div className="flex gap-4 mb-4">
            <button onClick={handleUploadLogo} disabled={uploadingLogo} className={`px-4 py-1 rounded text-white ${uploadingLogo ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"}`}>
              {uploadingLogo ? "Subiendo..." : "Guardar nuevo logo"}
            </button>
            <button onClick={handleCancelNewLogo} className="px-4 py-1 rounded bg-gray-200 hover:bg-gray-300">Cancelar</button>
          </div>
        )}
        <label className="block">
          <span className="text-blue-600 cursor-pointer hover:underline">{formData.logo ? "Cambiar logo" : "Cargar logo"}</span>
          <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
        </label>
      </div>

      {/* GALERÍA */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Galería de fotos (máx. 7)</label>
        <div className="flex gap-2 flex-wrap mb-3">
          {formData.gallery.map((photo, i) => (
            <div key={i} className="relative">
              <img src={photo} alt={`foto-${i}`} className="h-20 w-20 object-cover border rounded" />
              <button onClick={() => handleDeleteGalleryPhoto(photo)} className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1">✕</button>
            </div>
          ))}
        </div>
        <div className="border-2 border-dashed p-4 text-center rounded cursor-pointer hover:border-blue-400" onClick={() => document.getElementById("galleryInput")?.click()}>
          <p className="text-sm text-gray-500">Haz clic aquí o arrastra imágenes (máx. 3MB c/u)</p>
          <p className="text-xs text-gray-400 mt-1">Formatos: JPG, PNG, WebP</p>
          <input id="galleryInput" type="file" accept="image/*" multiple onChange={handleGallerySelect} className="hidden" />
        </div>
        {galleryPreviews.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            {galleryPreviews.map((src, i) => (
              <img key={i} src={src} alt={`preview-${i}`} className="h-20 w-20 object-cover border rounded" />
            ))}
          </div>
        )}
        {galleryPreviews.length > 0 && (
          <button onClick={handleUploadGallery} disabled={uploadingGallery} className="mt-3 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            {uploadingGallery ? "Subiendo..." : "Guardar fotos"}
          </button>
        )}
      </div>

      {/* DATOS DEL NEGOCIO */}
      <h3 className="text-lg font-semibold mb-2">Información del Negocio</h3>
      <input name="bussiness_name" value={formData.bussiness_name} onChange={handleChange} className="border w-full p-2 mb-4" placeholder="Nombre del negocio" />
      <textarea name="description" value={formData.description} onChange={handleChange} className="border w-full p-2 h-20 mb-4" placeholder="Descripción" />
      <textarea name="about_me" value={formData.about_me} onChange={handleChange} className="border w-full p-2 h-20 mb-6" placeholder="Sobre mí" />

      {/* DATOS PERSONALES */}
      <h3 className="text-lg font-semibold mb-2">Datos Personales</h3>
      {["name", "rut", "phone", "website", "address", "speciality"].map((field) => (
        <input key={field} name={field} value={(formData as any)[field]} onChange={handleChange} className="border w-full p-2 mb-4" placeholder={field} />
      ))}
      <label className="block mb-1">Email</label>
      <input value={formData.email} disabled className="border w-full p-2 mb-6 bg-gray-100" />

      {/* REDES SOCIALES */}
      <h3 className="text-lg font-semibold mb-2">Redes Sociales</h3>
      {["facebook", "instagram", "tiktok", "whatsapp", "threads"].map((field) => (
        <input key={field} name={field} value={(formData as any)[field]} onChange={handleChange} className="border w-full p-2 mb-4" placeholder={field} />
      ))}

      <button onClick={handleUpdateProfile} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-4 w-full">
        Actualizar datos
      </button>
    </div>
  );
}
