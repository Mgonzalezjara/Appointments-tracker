// src/pages/AccountsPage.tsx
import { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/authContext";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function AccountsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [daysFilter, setDaysFilter] = useState<7 | 15 | 30 | 90 | "all">(7);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const apptSnap = await getDocs(collection(db, "professionals", user.uid, "appointments"));
      const serviceSnap = await getDocs(collection(db, "professionals", user.uid, "services"));

      setAppointments(apptSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setServices(serviceSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [user]);

  const reviewPending = appointments.some(
    (appt) =>
      ["available", "booked"].includes(appt.status) &&
      new Date(appt.startTime) <= new Date()
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

  const now = new Date();
  const filteredAppointments = appointments.filter((appt) => {
    if (!["attended", "no-show"].includes(appt.status)) return false;
    const apptDate = new Date(appt.startTime);
    if (daysFilter === "all") return true;
    const diffDays = (now.getTime() - apptDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= daysFilter;
  });

  const attended = filteredAppointments.filter((a) => a.status === "attended" && a.serviceId);
  const noShow = filteredAppointments.filter((a) => a.status === "no-show" && a.serviceId);

  // INGRESOS REALES (atendidos)
  const attendedSum = attended.reduce((sum, appt) => {
    return sum + (appt.payment || 0); // Usamos lo realmente pagado
  }, 0);

  // NO SHOW (perdido)
  const noShowSum = noShow.reduce((sum, appt) => {
    const service = services.find((s) => s.id === appt.serviceId);
    return sum + (service?.price || 0);
  }, 0);

  const groupByService = (arr: any[]) => {
    const grouped: Record<string, { count: number; total: number }> = {};
    arr.forEach((appt) => {
      const service = services.find((s) => s.id === appt.serviceId);
      if (service) {
        if (!grouped[service.name]) grouped[service.name] = { count: 0, total: 0 };
        grouped[service.name].count++;
        grouped[service.name].total += appt.payment || 0; // usamos lo pagado
      }
    });
    return grouped;
  };

  const attendedByService = groupByService(attended);
  const noShowByService = groupByService(noShow);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Cuentas</h2>

      {/* ALERTAS */}
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

      {/* FILTRO DE DÍAS */}
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

      {/* RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded shadow">
        <h3 className="font-bold text-lg">Atendidas</h3>
        <p>Total citas: <strong>{attended.length}</strong></p>
        <p>💰 Por ganar (precio total): <strong>${attended.reduce((sum, appt) => {
            const service = services.find((s) => s.id === appt.serviceId);
            return sum + (service?.price || 0);
        }, 0)}</strong></p>
        <p>✅ Ingresos ganados (pagado): <strong>${attended.reduce((sum, appt) => sum + (appt.payment || 0), 0)}</strong></p>
        <p>⚠️ Adeudado: <strong>${attended.reduce((sum, appt) => {
            const service = services.find((s) => s.id === appt.serviceId);
            const price = service?.price || 0;
            return sum + Math.max(price - (appt.payment || 0), 0);
        }, 0)}</strong></p>
        </div>

        <div className="bg-red-100 p-4 rounded shadow">
          <h3 className="font-bold text-lg">No asistidas</h3>
          <p>Total citas: <strong>{noShow.length}</strong></p>
          <p>No Recibido: <strong>${noShowSum}</strong></p>
        </div>
      </div>

      {/* BALANCE */}
      <div className="bg-blue-100 p-4 rounded shadow mb-6">
        <h3 className="font-bold text-lg">Balance</h3>
        <p>Diferencia (Ingresos - No recibido): <strong>${attendedSum - noShowSum}</strong></p>
      </div>

      {/* TABLAS DE DETALLE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* TABLA ATENDIDAS */}
       <div>
        <h3 className="text-xl font-semibold mb-2">Detalle por Servicio (Atendidas)</h3>
        {Object.keys(attendedByService).length > 0 ? (
            <table className="w-full border-collapse border border-gray-300">
            <thead>
                <tr className="bg-green-200">
                <th className="border border-gray-300 p-2 text-left">Servicio</th>
                <th className="border border-gray-300 p-2 text-center">Citas</th>
                <th className="border border-gray-300 p-2 text-center">Por ganar ($)</th>
                <th className="border border-gray-300 p-2 text-center">Pagado ($)</th>
                <th className="border border-gray-300 p-2 text-center">Adeudado ($)</th>
                </tr>
            </thead>
            <tbody>
                {services.map((service) => {
                const citas = attended.filter((a) => a.serviceId === service.id);
                if (!citas.length) return null;

                const porGanar = citas.reduce((sum) => sum + (service.price || 0), 0);
                const ganado = citas.reduce((sum, a) => sum + (a.payment || 0), 0);
                const adeudado = citas.reduce(
                    (sum, a) => sum + Math.max((service.price || 0) - (a.payment || 0), 0),
                    0
                );

                return (
                    <tr key={service.id}>
                    <td className="border border-gray-300 p-2">{service.name}</td>
                    <td className="border border-gray-300 p-2 text-center">{citas.length}</td>
                    <td className="border border-gray-300 p-2 text-center">${porGanar}</td>
                    <td className="border border-gray-300 p-2 text-center">${ganado}</td>
                    <td className="border border-gray-300 p-2 text-center">${adeudado}</td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        ) : (
            <p className="text-gray-500">No hay datos en este periodo.</p>
        )}
        </div>


        {/* TABLA NO ASISTIDAS */}
       <div>
        <h3 className="text-xl font-semibold mb-2">Detalle por Servicio (No asistidas)</h3>
        {Object.keys(noShowByService).length > 0 ? (
            <table className="w-full border-collapse border border-gray-300">
            <thead>
                <tr className="bg-red-200">
                <th className="border border-gray-300 p-2 text-left">Servicio</th>
                <th className="border border-gray-300 p-2 text-center">Citas</th>
                <th className="border border-gray-300 p-2 text-center">Pérdida ($)</th>
                </tr>
            </thead>
            <tbody>
                {services.map((service) => {
                const citas = noShow.filter((a) => a.serviceId === service.id);
                if (!citas.length) return null;

                const perdida = citas.reduce((sum) => sum + (service.price || 0), 0);

                return (
                    <tr key={service.id}>
                    <td className="border border-gray-300 p-2">{service.name}</td>
                    <td className="border border-gray-300 p-2 text-center">{citas.length}</td>
                    <td className="border border-gray-300 p-2 text-center">${perdida}</td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        ) : (
            <p className="text-gray-500">No hay datos en este periodo.</p>
        )}
        </div>

      </div>

      {/* TABLA DETALLADA DE ATENDIDOS */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-2">Detalle de Citas Atendidas</h3>
        {attended.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
           <thead>
            <tr className="bg-green-200">
                <th className="border border-gray-300 p-2 text-left">Servicio</th>
                <th className="border border-gray-300 p-2 text-left">Cliente</th>
                <th className="border border-gray-300 p-2 text-center">Fecha</th>
                <th className="border border-gray-300 p-2 text-center">Por ganar ($)</th>
                <th className="border border-gray-300 p-2 text-center">Adeudado ($)</th>

            </tr>
            </thead>
            <tbody>
            {attended.map((appt) => {
                const service = services.find((s) => s.id === appt.serviceId);
                const price = service?.price || 0;
                const adeudado = Math.max(price - (appt.payment || 0), 0);
                return (
                <tr key={appt.id}>
                    <td className="border border-gray-300 p-2">{service?.name || "Sin servicio"}</td>
                    <td className="border border-gray-300 p-2">{appt.clientInfo?.name || "Sin nombre asignado"}</td>
                    <td className="border border-gray-300 p-2 text-center">{new Date(appt.startTime).toLocaleDateString()}</td>
                    <td className="border border-gray-300 p-2 text-center">${price}</td>
                    <td className="border border-gray-300 p-2 text-center">{adeudado > 0 ? `$${adeudado}` : "-"}</td>
                </tr>
                );
            })}
            </tbody>

          </table>
        ) : (
          <p className="text-gray-500">No hay citas atendidas en este periodo.</p>
        )}
      </div>
    </div>
  );
}
