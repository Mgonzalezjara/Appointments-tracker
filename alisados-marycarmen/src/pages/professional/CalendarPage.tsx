// src/pages/CalendarPage.tsx
import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
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
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("week");

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "professionals", user.uid, "appointments"),
      (snapshot) => setAppointments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchServices = async () => {
      const querySnapshot = await getDocs(collection(db, "professionals", user.uid, "services"));
      setServices(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchServices();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedForm = { ...prev, [name]: name === "payment" ? Number(value) : value };
      if ((name === "serviceId" || name === "startHour") && updatedForm.serviceId) {
        const selectedService = services.find((s) => s.id === updatedForm.serviceId);
        if (selectedService && updatedForm.date && updatedForm.startHour) {
          const start = new Date(`${updatedForm.date}T${updatedForm.startHour}`);
          const adjustedEnd = new Date(start.getTime() + selectedService.duration * 60000);
          updatedForm.endHour = adjustedEnd.toTimeString().slice(0, 5);
        }
      }
      return updatedForm;
    });
  };

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

  const handleCreate = async () => {
    if (!user) return alert("Usuario no autenticado");

    const start = new Date(`${formData.date}T${formData.startHour}`);
    const end = new Date(`${formData.date}T${formData.endHour}`);
    const duration = durationPreview || 0;

    const overlapping = appointments.filter(
      (appt) =>
        new Date(appt.startTime) < end &&
        new Date(appt.endTime) > start
    );

    for (const appt of overlapping) {
      if (appt.status === "available") {
        await deleteDoc(doc(db, "professionals", user.uid, "appointments", appt.id));
      }
    }

    const clientInfo =
      formData.clientName && formData.clientEmail && formData.clientPhone
        ? { name: formData.clientName, email: formData.clientEmail, phone: formData.clientPhone }
        : { name: "", email: "", phone: "" };

    await addDoc(collection(db, "professionals", user.uid, "appointments"), {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
      status: clientInfo.name ? "booked" : "available",
      serviceId: formData.serviceId || "",
      clientInfo,
      payment: formData.payment || 0,
      createdAt: new Date().toISOString(),
    });

    resetForm();
    setIsModalOpen(false);
  };

  const handleEdit = (appt: any) => {
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

  const handleSaveEdit = async () => {
    if (!user || !editingId) return;
    const start = new Date(`${formData.date}T${formData.startHour}`);
    const end = new Date(`${formData.date}T${formData.endHour}`);
    const duration = durationPreview || 0;

    const clientInfo =
      formData.clientName && formData.clientEmail && formData.clientPhone
        ? { name: formData.clientName, email: formData.clientEmail, phone: formData.clientPhone }
        : { name: "", email: "", phone: "" };

    const docRef = doc(db, "professionals", user.uid, "appointments", editingId);
    await updateDoc(docRef, {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration,
      status: statusAction || (clientInfo.name ? "booked" : "available"),
      serviceId: formData.serviceId || "",
      clientInfo,
      payment: formData.payment || 0,
    });

    resetForm();
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta cita?")) return;
    await deleteDoc(doc(db, "professionals", user.uid, "appointments", id));
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
    title: appt.clientInfo?.name
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
                event.status === "booked"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAppointments.map((appt) => {
          const service = services.find((s) => s.id === appt.serviceId);
          const adeudado = service ? Math.max(service.price - (appt.payment || 0), 0) : 0;
          return (
            <div key={appt.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-400">
              <p><strong>Inicio:</strong> {new Date(appt.startTime).toLocaleString()}</p>
              <p><strong>Fin:</strong> {new Date(appt.endTime).toLocaleString()}</p>
              <p><strong>Duración:</strong> {appt.duration} min</p>
              <p><strong>Estado:</strong> {appt.status}</p>
              {service && <p><strong>Servicio:</strong> {service.name} (${service.price})</p>}
              <p><strong>Pago recibido:</strong> ${appt.payment || 0}</p>
              <p><strong>Adeudado:</strong> ${adeudado}</p>
              {appt.clientInfo?.name ? (
                <div className="mt-2">
                  <p><strong>Cliente:</strong> {appt.clientInfo.name}</p>
                  <p><strong>Email:</strong> {appt.clientInfo.email}</p>
                  <p><strong>Teléfono:</strong> {appt.clientInfo.phone}</p>
                </div>
              ) : <p className="mt-2 text-gray-500">Sin cliente asignado</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleEdit(appt)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Editar</button>
                <button onClick={() => handleDelete(appt.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Eliminar</button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-50">
        <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-40">
          <Dialog.Panel className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
            <Dialog.Title className="text-xl font-semibold mb-4">
              {editingId ? "Editar Cita" : "Crear Nueva Cita"}
            </Dialog.Title>

            <label className="block mb-1">Fecha</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} className="border w-full p-2 mb-3" />

            <label className="block mb-1">Hora de inicio</label>
            <input type="time" name="startHour" value={formData.startHour} onChange={handleChange} className="border w-full p-2 mb-3" />

            <label className="block mb-1">Hora de fin</label>
            <input type="time" name="endHour" value={formData.endHour} onChange={handleChange} className="border w-full p-2 mb-2" />

            {durationPreview !== null && <p className="text-sm text-gray-600 mb-4">⏱ Duración: <strong>{durationPreview} min</strong></p>}

            <label className="block mb-1">Servicio (opcional)</label>
            <select name="serviceId" value={formData.serviceId} onChange={handleChange} className="border w-full p-2 mb-4">
              <option value="">Sin servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>{service.name} (${service.price})</option>
              ))}
            </select>

            <label className="block mb-1">Pago recibido</label>
            <input type="number" name="payment" value={formData.payment} onChange={handleChange} className="border w-full p-2 mb-2" />

            {editingId && formData.serviceId && (
              <p className="text-sm text-gray-600 mb-4">
                💰 <strong>Adeudado:</strong> ${Math.max(
                  (services.find((s) => s.id === formData.serviceId)?.price || 0) - (formData.payment || 0),
                  0
                )}
              </p>
            )}

            <h4 className="font-medium mt-4 mb-2">Datos del cliente (opcional)</h4>
            <input type="text" name="clientName" placeholder="Nombre" value={formData.clientName} onChange={handleChange} className="border w-full p-2 mb-2" />
            <input type="email" name="clientEmail" placeholder="Correo" value={formData.clientEmail} onChange={handleChange} className="border w-full p-2 mb-2" />
            <input type="tel" name="clientPhone" placeholder="Teléfono" value={formData.clientPhone} onChange={handleChange} className="border w-full p-2 mb-4" />

            {editingId && isPastOrToday(formData.date) && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-600">
                  <strong>Estado actual:</strong> {statusAction || "Sin estado especial"}
                </p>
                <label className="flex items-center mb-2">
                  <input type="checkbox" checked={statusAction === "attended"} onChange={() => setStatusAction(statusAction === "attended" ? "" : "attended")} className="mr-2" />
                  Marcar como realizada
                </label>
                <label className="flex items-center mb-2">
                  <input type="checkbox" checked={statusAction === "no-show"} onChange={() => setStatusAction(statusAction === "no-show" ? "" : "no-show")} className="mr-2" />
                  Marcar como no asiste
                </label>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {editingId ? (
                <>
                  <button onClick={handleSaveEdit} disabled={!isFormValid} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full">
                    Guardar cambios
                  </button>
                  <button onClick={() => { resetForm(); setIsModalOpen(false); }} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-full">
                    Cancelar
                  </button>
                </>
              ) : (
                <button onClick={handleCreate} disabled={!isFormValid} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full">
                  Crear cita
                </button>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
