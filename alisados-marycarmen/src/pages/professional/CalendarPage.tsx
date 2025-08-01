import { useEffect, useState } from "react";
import { useAuth } from "../../context/authContext";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";

import {
  listenAppointments,
  fetchServices,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../../services/professional/calendarService";
import AppointmentModal from "../../components/professional/AppointmentModal";
import AppointmentsList from "../../components/professional/AppointmentsList.tsx";

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Textos personalizados en español
const messages = {
  today: "Hoy",
  previous: "Anterior",
  next: "Siguiente",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Evento",
  allDay: "Todo el día",
  noEventsInRange: "No hay eventos en este rango.",
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "history" | "review">("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    date: "",
    startHour: "",
    endHour: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceId: "",
    payment: 0,
  });

  const [durationPreview, setDurationPreview] = useState<number | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [statusAction, setStatusAction] = useState<"attended" | "no-show" | "">("");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("month"); // Vista mensual por defecto

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenAppointments(user.uid, (data) => setAppointments(data));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchServices(user.uid).then(setServices);
  }, [user]);

  useEffect(() => {
    if (formData.date && formData.startHour && formData.endHour) {
      const start = new Date(`${formData.date}T${formData.startHour}`);
      const end = new Date(`${formData.date}T${formData.endHour}`);
      if (end > start) {
        const diff = Math.floor((end.getTime() - start.getTime()) / 60000);
        setDurationPreview(diff);
        setIsFormValid(true);
      } else {
        setDurationPreview(null);
        setIsFormValid(false);
      }
    } else {
      setDurationPreview(null);
      setIsFormValid(false);
    }
  }, [formData.date, formData.startHour, formData.endHour]);

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: "",
      startHour: "",
      endHour: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      serviceId: "",
      payment: 0,
    });
    setDurationPreview(null);
    setIsFormValid(false);
    setStatusAction("");
  };

  const handleCreateOrUpdate = async () => {
    if (!user) return alert("Usuario no autenticado");

    const start = new Date(`${formData.date}T${formData.startHour}`);
    const end = new Date(`${formData.date}T${formData.endHour}`);
    const duration = durationPreview || 0;

    const clientInfo =
      formData.clientName && formData.clientEmail && formData.clientPhone
        ? { name: formData.clientName, email: formData.clientEmail, phone: formData.clientPhone }
        : { name: "", email: "", phone: "" };

    const appointmentData = {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
      status: statusAction || (clientInfo.name ? "booked" : "available"),
      serviceId: formData.serviceId || "",
      clientInfo,
      payment: formData.payment || 0,
      createdAt: new Date().toISOString(),
    };

    if (editingId) {
      await updateAppointment(user.uid, editingId, appointmentData);
    } else {
      await createAppointment(user.uid, appointmentData);
    }

    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (appt: any) => {
    if (appt.status === "blocked") {
      if (window.confirm("¿Deseas eliminar este bloqueo?")) {
        handleDelete(appt.id);
      }
      return;
    }

    setEditingId(appt.id);
    const localStart = new Date(appt.startTime);
    const localEnd = new Date(appt.endTime);

    setFormData({
      date: localStart.toISOString().split("T")[0],
      startHour: localStart.toTimeString().slice(0, 5),
      endHour: localEnd.toTimeString().slice(0, 5),
      clientName: appt.clientInfo?.name || "",
      clientEmail: appt.clientInfo?.email || "",
      clientPhone: appt.clientInfo?.phone || "",
      serviceId: appt.serviceId || "",
      payment: appt.payment || 0,
    });

    setDurationPreview(appt.duration || null);
    setStatusAction(appt.status === "attended" ? "attended" : appt.status === "no-show" ? "no-show" : "");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta cita?")) return;
    await deleteAppointment(user.uid, id);
  };

  const isPastOrToday = (date: string) => {
    const apptDate = new Date(date);
    const today = new Date();
    apptDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return apptDate <= today;
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (filter === "pending") return ["available", "booked"].includes(appt.status);
    if (filter === "history") return ["attended", "no-show"].includes(appt.status);
    if (filter === "review") {
      const service = services.find((s) => s.id === appt.serviceId);
      const servicePrice = service ? service.price : 0;
      return (
        isPastOrToday(appt.startTime) &&
        ((["available", "booked"].includes(appt.status)) ||
          (appt.status === "attended" && appt.payment !== servicePrice))
      );
    }
    return true;
  });

  const events = appointments.map((appt) => ({
    id: appt.id,
    title:
      appt.status === "blocked"
        ? "Bloqueado"
        : appt.clientInfo?.name
        ? `${appt.clientInfo.name} (${services.find((s) => s.id === appt.serviceId)?.name || "Sin servicio"})`
        : "Disponible",
    start: new Date(appt.startTime),
    end: new Date(appt.endTime),
    status: appt.status,
  }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Calendario de Citas</h2>
      <div className="bg-white p-4 rounded shadow mb-6">
        <Calendar
          localizer={localizer}
          culture="es"
          messages={messages}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onNavigate={(date) => setCurrentDate(date)}
          onView={(view) => setCurrentView(view as any)}
          style={{ height: 500 }}
          views={["day", "week", "month"]}
          eventPropGetter={(event) => ({
            style: {
              backgroundColor:
                event.status === "blocked"
                  ? "#dc2626"
                  : event.status === "booked"
                  ? "#3b82f6"
                  : event.status === "available"
                  ? "#10b981"
                  : event.status === "attended"
                  ? "#6b7280"
                  : "#ef4444",
              color: "white",
              borderRadius: "6px",
            },
          })}
          onSelectEvent={(event) => handleEdit(appointments.find((appt) => appt.id === event.id))}
        />
      </div>

      <button
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg text-lg"
      >
        ＋
      </button>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Filtrar por:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="border p-2 rounded">
          <option value="pending">Pendientes (Disponible / Reservadas)</option>
          <option value="review">Para revisión (Pendientes vencidas o pagos incompletos)</option>
          <option value="history">Históricas (Realizadas / No asistidas)</option>
          <option value="all">Todas</option>
        </select>
      </div>

      <h3 className="text-xl font-semibold mb-3">
        {filter === "pending"
          ? "Citas Pendientes"
          : filter === "review"
          ? "Citas Para Revisión"
          : filter === "history"
          ? "Citas Históricas"
          : "Todas las Citas"}
      </h3>

      <AppointmentsList
        filteredAppointments={filteredAppointments}
        services={services}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      <AppointmentModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onSubmit={handleCreateOrUpdate}
  onDelete={async () => {
    if (!user || !editingId) return;
    if (window.confirm("¿Estás seguro de que deseas eliminar esta cita?")) {
      await deleteAppointment(user.uid, editingId);
      alert("La cita fue eliminada exitosamente");
      setIsModalOpen(false);
    }
  }}
  formData={formData}
  setFormData={setFormData}
  services={services}
  isEditing={!!editingId}
  durationPreview={durationPreview}
  isFormValid={isFormValid}
  statusAction={statusAction}
  setStatusAction={setStatusAction}
  isPastOrToday={isPastOrToday}
/>



    </div>
  );
}
