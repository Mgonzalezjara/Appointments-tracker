// servicesService.ts
import { db } from "../../firebaseConfig";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  available: boolean;
  photos: string[]; // ✅ Nuevo campo
}

// Obtener servicios
export const fetchServices = async (userId: string): Promise<Service[]> => {
  const servicesRef = collection(db, "professionals", userId, "services");
  const snapshot = await getDocs(servicesRef);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || "",
      description: data.description || "",
      price: data.price || 0,
      duration: data.duration || 0,
      available: data.available ?? true,
      photos: data.photos || [], // ✅ Siempre array vacío si no existe
    } as Service;
  });
};


// Agregar servicio
export const addService = async (userId: string, newService: Omit<Service, "id">) => {
  const servicesRef = collection(db, "professionals", userId, "services");
  await addDoc(servicesRef, newService);
};

// Editar servicio
export const updateService = async (userId: string, id: string, updatedData: Partial<Service>) => {
  const serviceRef = doc(db, "professionals", userId, "services", id);
  await updateDoc(serviceRef, updatedData);
};

// Eliminar servicio
export const deleteService = async (userId: string, id: string) => {
  const serviceRef = doc(db, "professionals", userId, "services", id);
  await deleteDoc(serviceRef);
};
