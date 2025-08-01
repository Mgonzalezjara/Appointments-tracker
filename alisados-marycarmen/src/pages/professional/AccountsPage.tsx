import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/authContext";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import AccountsTables from "../../components/professional/AccountsTables";
import AccountsAttendedDetail from "../../components/professional/AccountsAttendedDetails";

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: "available" | "booked" | "attended" | "no-show";
  serviceId?: string;
  payment: number;
  clientInfo?: { name?: string; email?: string; phone?: string };
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
}

export default function AccountsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [daysFilter, setDaysFilter] = useState<7 | 15 | 30 | 90 | "all">(7);

  // 🔹 Cargar citas y servicios desde Firestore
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const apptSnap = await getDocs(collection(db, "professionals", user.uid, "appointments"));
      const serviceSnap = await getDocs(collection(db, "professionals", user.uid, "services"));

      setAppointments(apptSnap.docs.map((doc) => ({ ...(doc.data() as Appointment), id: doc.id })));
      setServices(serviceSnap.docs.map((doc) => ({ ...(doc.data() as Service), id: doc.id })));
    };

    fetchData();
  }, [user]);

  // 🔹 Alertas
  const reviewPending = appointments.some(
    (appt) =>
      ["available", "booked"].includes(appt.status) && new Date(appt.startTime) <= new Date()
  );

  const missingService = appointments.some(
    (appt) => ["attended", "no-show"].includes(appt.status) && !appt.serviceId
  );

  const owedMoney = appointments.some((appt) => {
    if (appt.status === "attended" && appt.serviceId) {
      const service = services.find((s) => s.id === appt.serviceId);
      return service && appt.payment < service.price;
    }
    return false;
  });

  // 🔹 Filtrar citas por rango de días
  const now = new Date();
  const filteredAppointments = appointments.filter((appt) => {
    if (!["attended", "no-show"].includes(appt.status)) return false;
    const apptDate = new Date(appt.startTime);
    if (daysFilter === "all") return true;
    const diffDays = (now.getTime() - apptDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= daysFilter;
  });

  // 🔹 Separar atendidas y no-show
  const attended = filteredAppointments.filter((a) => a.status === "attended" && a.serviceId);
  const noShow = filteredAppointments.filter((a) => a.status === "no-show" && a.serviceId);

  // 🔹 Cálculos generales
  const attendedSum = attended.reduce((sum, appt) => sum + (appt.payment || 0), 0);
  const noShowSum = noShow.reduce((sum, appt) => {
    const service = services.find((s) => s.id === appt.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Cuentas</h2>

      {/* 🔔 ALERTAS */}
      {reviewPending && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded mb-4">
          Tienes citas pendientes de revisión.{" "}
          <button onClick={() => navigate("/dashboard/calendar")} className="underline text-blue-600">
            Ir al calendario
          </button>
        </div>
      )}
      {missingService && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          Hay citas atendidas o no asistidas sin servicio asignado.{" "}
          <button onClick={() => navigate("/dashboard/calendar")} className="underline text-blue-600">
            Corregir en calendario
          </button>
        </div>
      )}
      {owedMoney && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 p-4 rounded mb-4">
          Hay citas atendidas con pagos pendientes.{" "}
          <button onClick={() => navigate("/dashboard/calendar")} className="underline text-blue-600">
            Revisar en calendario
          </button>
        </div>
      )}

      {/* 🔍 FILTRO DE DÍAS */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Filtrar por:</label>
        <select
          value={daysFilter}
          onChange={(e) => setDaysFilter(e.target.value === "all" ? "all" : Number(e.target.value) as any)}
          className="border p-2 rounded"
        >
          <option value={7}>Últimos 7 días</option>
          <option value={15}>Últimos 15 días</option>
          <option value={30}>Últimos 30 días</option>
          <option value={90}>Últimos 90 días</option>
          <option value="all">Todas</option>
        </select>
      </div>

      {/* 📊 RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded shadow">
          <h3 className="font-bold text-lg">Atendidas</h3>
          <p>Total citas: <strong>{attended.length}</strong></p>
          <p>💰 Por ganar: <strong>${attended.reduce((sum, appt) => {
              const service = services.find((s) => s.id === appt.serviceId);
              return sum + (service?.price || 0);
          }, 0)}</strong></p>
          <p>✅ Ingresos ganados: <strong>${attendedSum}</strong></p>
          <p>⚠️ Adeudado: <strong>${attended.reduce((sum, appt) => {
              const service = services.find((s) => s.id === appt.serviceId);
              const price = service?.price || 0;
              return sum + Math.max(price - (appt.payment || 0), 0);
          }, 0)}</strong></p>
        </div>

        <div className="bg-red-100 p-4 rounded shadow">
          <h3 className="font-bold text-lg">No asistidas</h3>
          <p>Total citas: <strong>{noShow.length}</strong></p>
          <p>❌ No recibido: <strong>${noShowSum}</strong></p>
        </div>
      </div>

      {/* 📈 BALANCE */}
      <div className="bg-blue-100 p-4 rounded shadow mb-6">
        <h3 className="font-bold text-lg">Balance</h3>
        <p>Diferencia (Ingresos - No recibido): <strong>${attendedSum - noShowSum}</strong></p>
      </div>

      {/* 🔎 TABLAS MODULARES */}
      <AccountsTables attended={attended} noShow={noShow} services={services} />
      <AccountsAttendedDetail attended={attended} services={services} />
    </div>
  );
}
