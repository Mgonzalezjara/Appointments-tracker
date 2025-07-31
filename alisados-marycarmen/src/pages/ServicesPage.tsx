import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { db } from "../firebaseConfig";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: "", description: "", price: "", duration: "" });
  const [editedServices, setEditedServices] = useState<{ [key: string]: Service }>({}); // 🔥 Track ediciones

  // Cargar servicios desde Firestore
  useEffect(() => {
    const fetchServices = async () => {
      if (!user) return;
      const servicesRef = collection(db, "professionals", user.uid, "services");
      const snapshot = await getDocs(servicesRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Service[];
      setServices(data);
      setLoading(false);
    };

    fetchServices();
  }, [user]);

  // Agregar servicio
  const handleAddService = async () => {
    if (!user) return alert("Usuario no autenticado");
    if (!newService.name || !newService.price || !newService.duration) return alert("Completa todos los campos");

    const servicesRef = collection(db, "professionals", user.uid, "services");
    await addDoc(servicesRef, {
      name: newService.name,
      description: newService.description,
      price: Number(newService.price),
      duration: Number(newService.duration),
    });

    setNewService({ name: "", description: "", price: "", duration: "" });
    alert("Servicio agregado correctamente");
    window.location.reload(); // recarga para ver el nuevo servicio
  };

  // Editar valores en estado local
  const handleLocalEdit = (id: string, field: keyof Service, value: string | number) => {
    setEditedServices((prev) => ({
      ...prev,
      [id]: { ...services.find((s) => s.id === id)!, ...(prev[id] || {}), [field]: value },
    }));
  };

  // Guardar cambios de un servicio
  const handleSaveService = async (id: string) => {
    if (!user) return;
    const edited = editedServices[id];
    if (!edited) return;

    const serviceRef = doc(db, "professionals", user.uid, "services", id);
    await updateDoc(serviceRef, {
      name: edited.name,
      description: edited.description,
      price: edited.price,
      duration: edited.duration,
    });

    alert("Servicio actualizado correctamente");
    setServices((prev) => prev.map((s) => (s.id === id ? edited : s)));
    setEditedServices((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6">
      <h2 className="text-2xl font-bold mb-6">Tus Servicios</h2>

      {/* FORMULARIO AGREGAR SERVICIO */}
      <div className="bg-white p-4 rounded shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">Agregar nuevo servicio</h3>
        <input placeholder="Nombre" className="border p-2 w-full mb-2" value={newService.name}
          onChange={e => setNewService({ ...newService, name: e.target.value })} />
        <input placeholder="Descripción" className="border p-2 w-full mb-2" value={newService.description}
          onChange={e => setNewService({ ...newService, description: e.target.value })} />
        <input placeholder="Precio" type="number" className="border p-2 w-full mb-2" value={newService.price}
          onChange={e => setNewService({ ...newService, price: e.target.value })} />
        <input placeholder="Duración (min)" type="number" className="border p-2 w-full mb-2" value={newService.duration}
          onChange={e => setNewService({ ...newService, duration: e.target.value })} />
        <button onClick={handleAddService} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
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
          {services.map(service => {
            const edited = editedServices[service.id] || service;
            return (
              <div key={service.id} className="border p-4 rounded shadow bg-white">
                <input
                  className="text-xl font-bold mb-2 border-b w-full"
                  value={edited.name}
                  onChange={(e) => handleLocalEdit(service.id, "name", e.target.value)}
                />
                <textarea
                  className="w-full border-b mb-2"
                  value={edited.description}
                  onChange={(e) => handleLocalEdit(service.id, "description", e.target.value)}
                />
                <input
                  type="number"
                  className="border-b w-full mb-2"
                  value={edited.price}
                  onChange={(e) => handleLocalEdit(service.id, "price", Number(e.target.value))}
                />
                <input
                  type="number"
                  className="border-b w-full mb-2"
                  value={edited.duration}
                  onChange={(e) => handleLocalEdit(service.id, "duration", Number(e.target.value))}
                />

                {/* BOTÓN GUARDAR */}
                {editedServices[service.id] && (
                  <button
                    onClick={() => handleSaveService(service.id)}
                    className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
                  >
                    Guardar cambios
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
