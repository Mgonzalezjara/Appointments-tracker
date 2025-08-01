import { db } from "../../firebaseConfig";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

export interface Appointment {
  id?: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "available" | "booked" | "blocked";
  serviceId: string;
  clientInfo: { name: string; email: string; phone: string };
  payment: number;
  createdAt: any;
}

export const fetchAppointments = async (userId: string): Promise<Appointment[]> => {
  const snapshot = await getDocs(collection(db, "professionals", userId, "appointments"));
  return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...(docSnap.data() as Appointment) }));
};

export const deleteAppointment = async (userId: string, apptId: string) => {
  await deleteDoc(doc(db, "professionals", userId, "appointments", apptId));
};

export const addAppointment = async (userId: string, appt: Omit<Appointment, "id">) => {
  await addDoc(collection(db, "professionals", userId, "appointments"), appt);
};

export const addBlockedAppointment = async (userId: string, start: Date, end: Date) => {
  await addDoc(collection(db, "professionals", userId, "appointments"), {
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    duration: Math.floor((end.getTime() - start.getTime()) / 60000),
    status: "blocked",
    serviceId: "",
    clientInfo: { name: "", email: "", phone: "" },
    payment: 0,
    createdAt: new Date(),
  });
};

export const generateTimeSlots = (start: Date, end: Date, duration: number) => {
  const slots: { start: Date; end: Date }[] = [];
  let current = new Date(start);
  while (current < end) {
    const slotEnd = new Date(current.getTime() + duration * 60000);
    if (slotEnd <= end) slots.push({ start: new Date(current), end: slotEnd });
    current = slotEnd;
  }
  return slots;
};
