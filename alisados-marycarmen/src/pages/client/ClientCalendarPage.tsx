import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { collection, onSnapshot, doc, updateDoc, getDocs, query, where } from "firebase/firestore";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
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

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  available: boolean;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "available" | "booked" | "attended" | "no-show";
  serviceId?: string;
  clientInfo?: { name: string; email: string; phone: string };
}

interface CalendarEvent extends RBCEvent {
  id: string;
  status: "available";
}

// ✅ Toolbar personalizado en español
function CustomToolbar({ label, onNavigate, onView }: any) {
  return (
    <div className=" flex justify-evenly items-center mb-4">
      <div>
        <button onClick={() => onNavigate("TODAY")} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">
          Hoy
        </button>
        <button onClick={() => onNavigate("PREV")} className="bg-gray-300 px-2 py-1 rounded mr-2">
          ←
        </button>
        <button onClick={() => onNavigate("NEXT")} className="bg-gray-300 px-2 py-1 rounded">
          →
        </button>
      </div>
      <span className="font-semibold">{label}</span>
      <div>
        <button onClick={() => onView(Views.DAY)} className="bg-gray-200 px-2 py-1 rounded mr-2">
          Día
        </button>
        <button onClick={() => onView(Views.WEEK)} className="bg-gray-200 px-2 py-1 rounded mr-2">
          Semana
        </button>
        <button onClick={() => onView(Views.MONTH)} className="bg-gray-200 px-2 py-1 rounded">
          Mes
        </button>
      </div>
    </div>
  );
}


export default function ClientCalendarPage({ professionalId }: { professionalId: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", serviceId: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [emailFilter, setEmailFilter] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
const [currentView, setCurrentView] = useState<"day" | "week" | "month">("month");

  /** 🔥 Cargar citas disponibles en tiempo real */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "professionals", professionalId, "appointments"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Appointment, "id">) }));
      setAppointments(data.filter((appt) => appt.status === "available"));
    });
    return () => unsub();
  }, [professionalId]);

  /** 🔥 Cargar servicios solo disponibles */
  useEffect(() => {
    const fetchServices = async () => {
      const snapshot = await getDocs(collection(db, "professionals", professionalId, "services"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Service, "id">) }));
      setServices(data.filter((s) => s.available));
    };
    fetchServices();
  }, [professionalId]);

  /** 🔥 Validar formulario */
  useEffect(() => {
    setIsFormValid(
      formData.name.trim() && formData.email.trim() && formData.phone.trim() && formData.serviceId.trim() ? true : false
    );
  }, [formData]);

  /** 🔥 Reservar cita */
  const handleBookAppointment = async () => {
    if (!selectedAppt) return;
    await updateDoc(doc(db, "professionals", professionalId, "appointments", selectedAppt.id), {
      status: "booked",
      serviceId: formData.serviceId,
      clientInfo: { name: formData.name, email: formData.email, phone: formData.phone },
    });
    setIsModalOpen(false);
    setFormData({ name: "", email: "", phone: "", serviceId: "" });
  };

  /** 🔥 Buscar mis citas por correo */
  const handleSearchMyAppointments = async () => {
    if (!emailFilter.trim()) return;

    const q = query(
      collection(db, "professionals", professionalId, "appointments"),
      where("clientInfo.email", "==", emailFilter)
    );

    const snapshot = await getDocs(q);

    setMyAppointments(
      snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<Appointment, "id">), // primero todos los datos
        id: doc.id, // luego aseguramos que el ID correcto sea el del documento
      }))
    );
  };


  /** 📅 Eventos para el calendario */
  const events: CalendarEvent[] = appointments.map((appt) => ({
    id: appt.id,
    title: `Disponible (${new Date(appt.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
    start: new Date(appt.startTime),
    end: new Date(appt.endTime),
    status: "available",
  }));

  return (
    <div className="p-2">
      <h2 className="text-2xl font-bold mb-4">Calendario de Citas Disponibles</h2>
      <Calendar
        localizer={localizer}
        culture="es"
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        view={currentView}
        onNavigate={setCurrentDate}
        defaultView="month"
        components={{ toolbar: CustomToolbar }} // ✅ Toolbar traducido
        onView={(view) => setCurrentView(view as any)}
        style={{ height: 500 }}
        eventPropGetter={() => ({ style: { backgroundColor: "#10b981", color: "white", borderRadius: "6px" } })}
        onSelectEvent={(event) => {
          const appt = appointments.find((a) => a.id === event.id)!;
          setSelectedAppt(appt);
          setIsModalOpen(true);
        }}
      />

      {/* MODAL */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-50">
        <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-40">
          <Dialog.Panel className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">Reservar Cita</Dialog.Title>
            {selectedAppt && (
              <>
                <p><strong>Fecha:</strong> {new Date(selectedAppt.startTime).toLocaleDateString()}</p>
                <p className="mb-4"><strong>Hora:</strong> {new Date(selectedAppt.startTime).toLocaleTimeString()} - {new Date(selectedAppt.endTime).toLocaleTimeString()}</p>
              </>
            )}
            <select value={formData.serviceId} onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })} className="border w-full p-2 mb-4">
              <option value="">Seleccionar servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name} (${service.price})</option>
              ))}
            </select>
            <input type="text" placeholder="Nombre" className="border w-full p-2 mb-2" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            <input type="email" placeholder="Correo" className="border w-full p-2 mb-2" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            <input type="tel" placeholder="Teléfono" className="border w-full p-2 mb-4" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={handleBookAppointment} disabled={!isFormValid} className={`w-full px-4 py-2 rounded text-white ${isFormValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400"}`}>
                Confirmar Reserva
              </button>
              <button onClick={() => setIsModalOpen(false)} className="w-full px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white">
                Cancelar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* 🔍 Buscar mis citas */}
      <div className="mt-10 p-5">
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
