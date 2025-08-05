import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/authContext";
import type { Service } from "../../services/professional/servicesService";
import { fetchServices, addService, updateService, deleteService } from "../../services/professional/servicesService";

const CLOUDINARY_UPLOAD_PRESET = "bookmeenlinea";
const CLOUDINARY_CLOUD_NAME = "domgxhgay";

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration: "", available: true, photos: [] as string[] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedService, setEditedService] = useState<Service | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar servicios
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const data = await fetchServices(user.uid);
      setServices(data);
      setLoading(false);
    };
    load();
  }, [user]);

  // Subir imagen a Cloudinary
  const uploadImage = async (file: File): Promise<string | null> => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: data,
    });
    const json = await res.json();
    return json.secure_url || null;
  };

  // Manejar selección de imágenes
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEditing: boolean = false) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (!["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.type)) {
        alert("Formato inválido. Solo JPG, JPEG, PNG o WebP");
        return false;
      }
      if (file.size > 3 * 1024 * 1024) {
        alert("Una imagen supera los 3MB");
        return false;
      }
      return true;
    });

    if (validFiles.length + (isEditing ? (editedService?.photos.length || 0) : newService.photos.length) > 5) {
      alert("Máximo 5 fotos por servicio");
      return;
    }

    setSelectedFiles(validFiles);
    setPreviews(validFiles.map(file => URL.createObjectURL(file)));
  };

  // Agregar servicio
  const handleAddService = async () => {
    if (!user) return alert("Usuario no autenticado");
    if (!newService.name || !newService.price || !newService.duration) return alert("Completa todos los campos");

    const uploadedPhotos = [];
    for (const file of selectedFiles) {
      const url = await uploadImage(file);
      if (url) uploadedPhotos.push(url);
    }

    await addService(user.uid, {
      ...newService,
      price: Number(newService.price),
      duration: Number(newService.duration),
      photos: uploadedPhotos,
    });

    alert("✅ Servicio agregado correctamente");


    setNewService({ name: "", description: "", price: "", duration: "", available: true, photos: [] });
    setSelectedFiles([]);
    setPreviews([]);
    const data = await fetchServices(user.uid);
    setServices(data);
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    if (!user || !editingId || !editedService) return;

    const uploadedPhotos = [...(editedService.photos || [])];
    for (const file of selectedFiles) {
      const url = await uploadImage(file);
      if (url) uploadedPhotos.push(url);
    }

    await updateService(user.uid, editingId, { ...editedService, photos: uploadedPhotos });
    alert("✅ Servicio editado correctamente");

    setEditingId(null);
    setEditedService(null);
    setSelectedFiles([]);
    setPreviews([]);
    const data = await fetchServices(user.uid);
    setServices(data);
  };

  // Eliminar foto individual
  const handleDeletePhoto = (photoUrl: string) => {
    if (!editedService) return;
    setEditedService({ ...editedService, photos: editedService.photos.filter(p => p !== photoUrl) });
  };

  // Eliminar servicio
  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm("¿Seguro que quieres eliminar este servicio?")) return;

    await deleteService(user.uid, id);
    setServices(services.filter((s) => s.id !== id));
  };

  return (
  <div className="max-w-3xl mx-auto mt-10 p-6">
    <h2 className="text-2xl font-bold mb-6">Tus Servicios</h2>

    {/* FORMULARIO AGREGAR */}
    <div className="bg-white p-4 rounded shadow mb-8">
      <h3 className="text-lg font-semibold mb-4">Agregar nuevo servicio</h3>
      <input placeholder="Nombre" className="border p-2 w-full mb-2"
        value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
      <textarea placeholder="Descripción" className="border p-2 w-full mb-2"
        value={newService.description} onChange={e => setNewService({ ...newService, description: e.target.value })} />
      <input placeholder="Precio" type="number" className="border p-2 w-full mb-2"
        value={newService.price} onChange={e => setNewService({ ...newService, price: e.target.value })} />
      <input placeholder="Duración (min)" type="number" className="border p-2 w-full mb-2"
        value={newService.duration} onChange={e => setNewService({ ...newService, duration: e.target.value })} />
      <label className="flex items-center mb-4">
        <input type="checkbox" checked={newService.available}
          onChange={e => setNewService({ ...newService, available: e.target.checked })} className="mr-2" />
        Disponible
      </label>

      {/* FOTOS - Dropzone */}
      <label className="block mb-2 font-semibold">Fotos (máx. 5)</label>
      <p className="text-xs text-gray-500 mb-2">
        Máximo 5 fotos. Cada foto debe pesar menos de <strong>3MB</strong>. 
        Actualmente: <strong>{newService.photos.length + previews.length}</strong> / 5
      </p>
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-sm text-gray-500">
          Haz clic aquí o arrastra imágenes para subirlas
        </p>
        <p className="text-xs text-gray-400 mt-1">Formatos permitidos: JPG, PNG, WebP</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileSelect(e, false)}
          className="hidden"
        />
      </div>

      {/* Previews nuevas */}
      {previews.length > 0 && (
        <div className="flex gap-3 mt-3 flex-wrap">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt={`preview-${i}`} className="h-20 w-20 object-cover rounded border" />
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1 cursor-pointer"
                onClick={() => setPreviews(previews.filter((_, idx) => idx !== i))}>✕</span>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={handleAddService} 
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full mt-4"
      >
        Agregar servicio
      </button>
    </div>

    {/* LISTADO DE SERVICIOS */}
    {loading ? (
      <p>Cargando servicios...</p>
    ) : services.length === 0 ? (
      <p className="text-gray-600">Aún no tienes servicios creados.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map(service => (
          <div key={service.id} className="border p-4 rounded shadow bg-white">
            {editingId === service.id ? (
              <>
                {/* FORMULARIO EDICIÓN */}
                <input className="border p-2 w-full mb-2"
                  value={editedService?.name || ""}
                  onChange={e => setEditedService({ ...editedService!, name: e.target.value })} />
                <textarea className="border p-2 w-full mb-2"
                  value={editedService?.description || ""}
                  onChange={e => setEditedService({ ...editedService!, description: e.target.value })} />
                <input type="number" className="border p-2 w-full mb-2"
                  value={editedService?.price || 0}
                  onChange={e => setEditedService({ ...editedService!, price: Number(e.target.value) })} />
                <input type="number" className="border p-2 w-full mb-2"
                  value={editedService?.duration || 0}
                  onChange={e => setEditedService({ ...editedService!, duration: Number(e.target.value) })} />
                <label className="flex items-center mb-2">
                  <input type="checkbox"
                    checked={editedService?.available || false}
                    onChange={e => setEditedService({ ...editedService!, available: e.target.checked })} className="mr-2" />
                  Disponible
                </label>

                {/* Fotos existentes */}
                <div className="mb-2">
                  <p className="font-semibold text-sm mb-1">
                    Fotos actuales ({editedService?.photos.length || 0}/5):
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {editedService?.photos.map((photo, i) => (
                      <div key={i} className="relative">
                        <img src={photo} alt="foto" className="h-20 w-20 object-cover border rounded" />
                        <button 
                          onClick={() => handleDeletePhoto(photo)} 
                          className="absolute top-0 right-0 bg-red-500 text-white px-1 rounded text-xs">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Nuevas fotos */}
                <label className="block mb-2 font-semibold">Agregar nuevas fotos</label>
                <p className="text-xs text-gray-500 mb-2">
                  Puedes agregar hasta {5 - (editedService?.photos.length || 0)} fotos nuevas.
                  Cada imagen debe pesar menos de <strong>3MB</strong>.
                </p>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-sm text-gray-500">
                    Haz clic aquí o arrastra imágenes para subirlas
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Formatos permitidos: JPG, PNG, WebP</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e, true)}
                    className="hidden"
                  />
                </div>

                {/* Previews nuevas */}
                {previews.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {previews.map((src, i) => (
                      <img key={i} src={src} alt="preview" className="h-20 w-20 object-cover border rounded" />
                    ))}
                  </div>
                )}

                <button 
                  onClick={handleSaveEdit} 
                  className="bg-blue-500 text-white px-4 py-2 rounded w-full mt-3">
                  Guardar
                </button>
                <button 
                  onClick={() => setEditingId(null)} 
                  className="bg-gray-400 text-white px-4 py-2 rounded w-full mt-2">
                  Cancelar
                </button>
              </>
            ) : (
              <>
                {/* VISTA SERVICIO */}
                <h4 className="text-xl font-bold mb-2">{service.name}</h4>
                <p>{service.description}</p>
                <p className="mt-2 text-sm">💰 ${service.price} | ⏱ {service.duration} min</p>
                <p className={`mt-1 ${service.available ? "text-green-600" : "text-red-600"}`}>
                  {service.available ? "Disponible" : "No disponible"}
                </p>
                {service.photos && service.photos.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {service.photos.map((photo, i) => (
                      <img key={i} src={photo} alt="foto" className="h-16 w-16 object-cover border rounded" />
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button 
                    onClick={() => { setEditingId(service.id); setEditedService({ ...service, photos: service.photos || [] }); setPreviews([]); setSelectedFiles([]); }}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(service.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

}
