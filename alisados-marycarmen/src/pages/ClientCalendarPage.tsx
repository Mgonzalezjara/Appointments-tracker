// src/pages/ClientCalendarPage.tsx
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { collection, onSnapshot, doc, updateDoc, getDocs, query, where } from "firebase/firestore";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { Event as RBCEvent } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog } from "@headlessui/react";

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "available" | "booked" | "attended" | "no-show";
  serviceId?: string;
  payment?: number;
  clientInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

interface CalendarEvent extends RBCEvent {
  id: string;
  status: "available" | "booked" | "attended" | "no-show";
}

interface ClientForm {
  name: string;
  email: string;
  phone: string;
  serviceId: string;
}

export default function ClientCalendarPage({ professionalId }: { professionalId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState<ClientForm>({
    name: "",
    email: "",
    phone: "",
    serviceId: "",
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [emailFilter, setEmailFilter] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    if (!professionalId) return;
    const unsub = onSnapshot(
      collection(db, "professionals", professionalId, "appointments"),
      (snapshot) => {
        const data: Appointment[] = snapshot.docs.map((doc) => ({
          ...(doc.data() as Appointment),
          id: doc.id,
        }));
        setAppointments(data.filter((appt) => appt.status === "available"));
      }
    );
    return () => unsub();
  }, [professionalId]);

  useEffect(() => {
    if (!professionalId) return;
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "professionals", professionalId, "services"));
      setServices(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchServices();
  }, [professionalId]);

  useEffect(() => {
    setIsFormValid(
      formData.name.trim() !== "" &&
        formData.email.trim() !== "" &&
        formData.phone.trim() !== "" &&
        formData.serviceId.trim() !== ""
    );
  }, [formData]);

  const handleSelectAppt = (appt: Appointment) => {
    setSelectedAppt(appt);
    setIsModalOpen(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedAppt) return;
    const docRef = doc(db, "professionals", professionalId, "appointments", selectedAppt.id);
    await updateDoc(docRef, {
      status: "booked",
      serviceId: formData.serviceId,
      clientInfo: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      },
    });
    setIsModalOpen(false);
    setFormData({ name: "", email: "", phone: "", serviceId: "" });
    setSelectedAppt(null);
  };

  const handleSearchMyAppointments = async () => {
    if (!emailFilter.trim()) return;
    const q = query(
      collection(db, "professionals", professionalId, "appointments"),
      where("clientInfo.email", "==", emailFilter)
    );
    const snapshot = await getDocs(q);
    const data: Appointment[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as Appointment),
      id: doc.id,
    }));
    setMyAppointments(data);
  };

  const events: CalendarEvent[] = appointments.map((appt) => ({
    id: appt.id,
    title: `Disponible (${new Date(appt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
    start: new Date(appt.startTime),
    end: new Date(appt.endTime),
    status: appt.status,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Calendario de Citas Disponibles</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <Calendar<CalendarEvent>
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onNavigate={(date) => setCurrentDate(date)}
          onView={(view) => setCurrentView(view as any)}
          style={{ height: 500 }}
          views={["day", "week", "month"]}
          eventPropGetter={() => ({
            style: {
              backgroundColor: "#10b981",
              color: "white",
              borderRadius: "6px",
            },
          })}
          onSelectEvent={(event) => handleSelectAppt(appointments.find((appt) => appt.id === event.id)!)}
        />
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-50">
        <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-40">
          <Dialog.Panel className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">Reservar Cita</Dialog.Title>
            {selectedAppt && (
              <>
                <p className="mb-2 text-sm text-gray-700">
                  <strong>Fecha:</strong> {new Date(selectedAppt.startTime).toLocaleDateString()}
                </p>
                <p className="mb-4 text-sm text-gray-700">
                  <strong>Hora:</strong>{" "}
                  {new Date(selectedAppt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                  {new Date(selectedAppt.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </>
            )}
            <label className="block mb-1">Servicio</label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="border w-full p-2 mb-4"
            >
              <option value="">Seleccionar servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} (${service.price})
                </option>
              ))}
            </select>
            <label className="block mb-1">Nombre</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border w-full p-2 mb-2" />
            <label className="block mb-1">Correo</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="border w-full p-2 mb-2" />
            <label className="block mb-1">Teléfono</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="border w-full p-2 mb-4" />
            <div className="flex gap-2">
              <button onClick={handleBookAppointment} disabled={!isFormValid} className={`w-full px-4 py-2 rounded text-white ${isFormValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"}`}>
                Confirmar Reserva
              </button>
              <button onClick={() => setIsModalOpen(false)} className="w-full px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white">
                Cancelar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-2">Buscar mis citas</h3>
        <div className="flex gap-2 mb-4">
          <input type="email" placeholder="Ingresa tu correo" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} className="border p-2 w-full" />
          <button onClick={handleSearchMyAppointments} className="bg-blue-500 text-white px-4 rounded">Buscar</button>
        </div>
        {myAppointments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myAppointments.map((appt) => {
              const service = services.find((s) => s.id === appt.serviceId);
              return (
                <div key={appt.id} className="bg-white p-4 rounded shadow border-l-4 border-green-400">
                  <p><strong>Fecha:</strong> {new Date(appt.startTime).toLocaleString()}</p>
                  <p><strong>Servicio:</strong> {service?.name || "Sin servicio"}</p>
                  <p><strong>Estado:</strong> {appt.status}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No tienes citas registradas.</p>
        )}
      </div>
    </div>
  );
}
