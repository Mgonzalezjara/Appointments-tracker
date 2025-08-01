import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";


/** Tipos base */
export interface ClientInfo {
  name?: string;
  email?: string;
  phone?: string;
}

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "available" | "booked" | "attended" | "no-show";
  serviceId?: string;
  clientInfo?: ClientInfo;
  payment?: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  description?: string;
}

/** Fetch datos desde Firestore */
export const fetchAccountsData = async (
  userId: string
): Promise<{ appointments: Appointment[]; services: Service[] }> => {
  const apptSnap = await getDocs(collection(db, "professionals", userId, "appointments"));
  const serviceSnap = await getDocs(collection(db, "professionals", userId, "services"));

  const appointments: Appointment[] = apptSnap.docs.map((doc) => {
    const data = doc.data() as Omit<Appointment, "id">; // Evitamos id duplicado
    return { id: doc.id, ...data };
  });

  const services: Service[] = serviceSnap.docs.map((doc) => {
    const data = doc.data() as Omit<Service, "id">; // Evitamos id duplicado
    return { id: doc.id, ...data };
  });

  return { appointments, services };
};

/** Filtrar citas según días */
export const filterAppointments = (
  appointments: Appointment[],
  daysFilter: number | "all"
): Appointment[] => {
  const now = new Date();
  return appointments.filter((appt) => {
    if (!["attended", "no-show"].includes(appt.status)) return false;
    const apptDate = new Date(appt.startTime);
    if (daysFilter === "all") return true;
    const diffDays = (now.getTime() - apptDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= daysFilter;
  });
};

/** Agrupar citas por servicio */
export const calculateGroupByService = (
  appointments: Appointment[],
  services: Service[],
  type: "attended" | "no-show"
): Record<string, { count: number; total: number }> => {
  const grouped: Record<string, { count: number; total: number }> = {};

  appointments
    .filter((appt) => appt.status === type)
    .forEach((appt) => {
      const service = services.find((s) => s.id === appt.serviceId);
      if (service) {
        if (!grouped[service.name]) grouped[service.name] = { count: 0, total: 0 };
        grouped[service.name].count++;
        grouped[service.name].total +=
          type === "attended" ? appt.payment || 0 : service.price || 0;
      }
    });

  return grouped;
};
