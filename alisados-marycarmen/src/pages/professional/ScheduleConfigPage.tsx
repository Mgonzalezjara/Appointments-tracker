import { useState, useEffect } from "react";
import { useAuth } from "../../context/authContext";
import {
  fetchAppointments,
  generateTimeSlots,
  addAppointment,
  deleteAppointment,
  addBlockedAppointment,
} from "../../services/professional/scheduleService";
import type { Appointment } from "../../services/professional/scheduleService";
import { Timestamp } from "firebase/firestore";

export default function ScheduleConfig() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blockDate, setBlockDate] = useState("");
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchAppointments(user.uid).then(setAppointments);
  }, [user]);

  const toggleDay = (day: string) =>
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));

  const handleGenerateSchedule = async () => {
    if (!user) return alert("Usuario no autenticado");
    if (!startDate || !endDate || days.length === 0 || !startHour || !endHour) {
      return alert("Completa todos los campos");
    }

    setLoading(true);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayMap: Record<string, number> = {
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
      Domingo: 0,
    };

    const allDays: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (days.includes(Object.keys(dayMap).find((key) => dayMap[key] === d.getDay())!)) {
        allDays.push(new Date(d));
      }
    }

    for (const day of allDays) {
      const dayStart = new Date(`${day.toISOString().split("T")[0]}T${startHour}`);
      const dayEnd = new Date(`${day.toISOString().split("T")[0]}T${endHour}`);
      const slots = generateTimeSlots(dayStart, dayEnd, duration);

      for (const slot of slots) {
        const overlapping = appointments.filter(
          (appt) =>
            new Date(appt.startTime) < slot.end && new Date(appt.endTime) > slot.start
        );

        const hasBooked = overlapping.some((appt) => appt.status === "booked");
        if (hasBooked) continue;

        for (const appt of overlapping) {
          if (appt.status === "available" && user) {
            await deleteAppointment(user.uid, appt.id!);
          }
        }

        await addAppointment(user.uid, {
          startTime: slot.start.toISOString(),
          endTime: slot.end.toISOString(),
          duration,
          status: "available",
          serviceId: "",
          clientInfo: { name: "", email: "", phone: "" },
          payment: 0,
          createdAt: Timestamp.now(),
        });
      }
    }

    setLoading(false);
    alert("Horario generado correctamente");
  };

  const handleBlockSchedule = async () => {
    if (!user) return alert("Usuario no autenticado");
    if (!blockDate) return alert("Selecciona una fecha");

    const start = blockStart ? new Date(`${blockDate}T${blockStart}`) : new Date(`${blockDate}T00:00`);
    const end = blockEnd ? new Date(`${blockDate}T${blockEnd}`) : new Date(`${blockDate}T23:59`);

    const overlapping = appointments.filter(
      (appt) =>
        new Date(appt.startTime) < end && new Date(appt.endTime) > start && appt.status === "booked"
    );

    if (overlapping.length > 0) {
      if (!window.confirm(`Hay ${overlapping.length} citas BOOKED en este rango. ¿Bloquear igualmente?`)) return;
    }

    await addBlockedAppointment(user.uid, start, end);
    alert("Bloqueo creado correctamente");
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Configurar Agenda Recurrente</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Fecha inicio</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border w-full p-2 mb-3" />
        </div>
        <div>
          <label className="block font-medium mb-1">Fecha fin</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border w-full p-2 mb-3" />
        </div>
      </div>

      <div className="mb-4">
        <p className="font-medium mb-2">Días de la semana</p>
        <div className="flex flex-wrap gap-2">
          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`px-3 py-1 rounded ${days.includes(day) ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Hora inicio</label>
          <input type="time" value={startHour} onChange={(e) => setStartHour(e.target.value)} className="border w-full p-2 mb-3" />
        </div>
        <div>
          <label className="block font-medium mb-1">Hora fin</label>
          <input type="time" value={endHour} onChange={(e) => setEndHour(e.target.value)} className="border w-full p-2 mb-3" />
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Duración de cada cita (minutos)</label>
        <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="border w-full p-2" min={10} step={5} />
      </div>

      <button onClick={handleGenerateSchedule} disabled={loading} className={`w-full py-2 rounded text-white ${loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"}`}>
        {loading ? "Generando..." : "Generar Agenda"}
      </button>

      <div className="mt-8 border-t pt-4">
        <h3 className="text-xl font-semibold mb-4">Bloquear horarios</h3>
        <label className="block font-medium mb-1">Fecha a bloquear</label>
        <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="border p-2 w-full mb-3" />
        <label className="block font-medium mb-1">Hora inicio (opcional)</label>
        <input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="border p-2 w-full mb-3" />
        <label className="block font-medium mb-1">Hora fin (opcional)</label>
        <input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="border p-2 w-full mb-3" />
        <button onClick={handleBlockSchedule} className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded">
          Bloquear horario/día
        </button>
      </div>
    </div>
  );
}
