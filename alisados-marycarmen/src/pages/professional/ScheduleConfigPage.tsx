// src/pages/ScheduleConfig.tsx
import { useState, useEffect } from "react";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";

export default function ScheduleConfig() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAppointments = async () => {
      const snapshot = await getDocs(collection(db, "professionals", user.uid, "appointments"));
      setAppointments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    fetchAppointments();
  }, [user]);

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const generateTimeSlots = (start: Date, end: Date, duration: number) => {
    const slots: { start: Date; end: Date }[] = [];
    let current = new Date(start);
    while (current < end) {
      const slotEnd = new Date(current.getTime() + duration * 60000);
      if (slotEnd <= end) slots.push({ start: new Date(current), end: slotEnd });
      current = slotEnd;
    }
    return slots;
  };

  const handleGenerateSchedule = async () => {
    if (!user) return alert("Usuario no autenticado");
    if (!startDate || !endDate || days.length === 0 || !startHour || !endHour) {
      return alert("Completa todos los campos");
    }

    setLoading(true);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDays = [];
    const dayMap: Record<string, number> = {
      Lunes: 1,
      Martes: 2,
      Miércoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sábado: 6,
      Domingo: 0,
    };

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
            new Date(appt.startTime) < slot.end &&
            new Date(appt.endTime) > slot.start
        );

        let hasBooked = false;

        for (const appt of overlapping) {
          if (appt.status === "booked") {
            hasBooked = true;
            break;
          } else if (appt.status === "available") {
            await deleteDoc(doc(db, "professionals", user.uid, "appointments", appt.id));
          }
        }

        if (!hasBooked) {
          await addDoc(collection(db, "professionals", user.uid, "appointments"), {
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
    }

    setLoading(false);
    alert("Horario generado correctamente");
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Configurar Agenda Recurrente</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Fecha inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border w-full p-2 mb-3"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Fecha fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border w-full p-2 mb-3"
          />
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
              className={`px-3 py-1 rounded ${
                days.includes(day) ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block font-medium mb-1">Hora inicio</label>
          <input
            type="time"
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            className="border w-full p-2 mb-3"
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Hora fin</label>
          <input
            type="time"
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            className="border w-full p-2 mb-3"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block font-medium mb-1">Duración de cada cita (minutos)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="border w-full p-2"
          min={10}
          step={5}
        />
      </div>

      <button
        onClick={handleGenerateSchedule}
        disabled={loading}
        className={`w-full py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {loading ? "Generando..." : "Generar Agenda"}
      </button>
    </div>
  );
}
