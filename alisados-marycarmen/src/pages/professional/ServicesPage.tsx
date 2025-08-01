import { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import type { Service } from "../../services/professional/servicesService";
import { fetchServices, addService, updateService, deleteService } from "../../services/professional/servicesService";

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration: "", available: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedService, setEditedService] = useState<Service | null>(null);

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

  // Agregar servicio
  const handleAddService = async () => {
    if (!user) return alert("Usuario no autenticado");
    if (!newService.name || !newService.price || !newService.duration) return alert("Completa todos los campos");

    await addService(user.uid, {
      ...newService,
      price: Number(newService.price),
      duration: Number(newService.duration),
    });

    setNewService({ name: "", description: "", price: "", duration: "", available: true });
    const data = await fetchServices(user.uid);
    setServices(data);
  };

  // Guardar cambios al editar
  const handleSaveEdit = async () => {
    if (!user || !editingId || !editedService) return;

    await updateService(user.uid, editingId, editedService);
    setEditingId(null);
    setEditedService(null);
    const data = await fetchServices(user.uid);
    setServices(data);
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
        <input placeholder="Descripción" className="border p-2 w-full mb-2"
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
        <button onClick={handleAddService} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
          Agregar servicio
        </button>
      </div>

      {/* LISTADO */}
      {loading ? <p>Cargando servicios...</p> : services.length === 0 ? (
        <p className="text-gray-600">Aún no tienes servicios creados.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map(service => (
            <div key={service.id} className="border p-4 rounded shadow bg-white">
              {editingId === service.id ? (
                <>
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
                  <button onClick={handleSaveEdit} className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-2">Guardar</button>
                  <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-4 py-2 rounded w-full">Cancelar</button>
                </>
              ) : (
                <>
                  <h4 className="text-xl font-bold mb-2">{service.name}</h4>
                  <p>{service.description}</p>
                  <p className="mt-2 text-sm">💰 ${service.price} | ⏱ {service.duration} min</p>
                  <p className={`mt-1 ${service.available ? "text-green-600" : "text-red-600"}`}>
                    {service.available ? "Disponible" : "No disponible"}
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { setEditingId(service.id); setEditedService(service); }}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Editar</button>
                    <button onClick={() => handleDelete(service.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Eliminar</button>
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
