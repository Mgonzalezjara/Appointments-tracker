import  type { Appointment, Service } from "../../services/professional/accountsService";

interface AccountsTablesProps {
  attended: Appointment[];
  noShow: Appointment[];
  services: Service[];
}

export default function AccountsTables({ attended, noShow, services }: AccountsTablesProps) {
  /** Agrupar por servicio */
  const groupByService = (appointments: Appointment[], services: Service[]) => {
    return services.map((service) => {
      const citas = appointments.filter((a) => a.serviceId === service.id);
      if (!citas.length) return null;

      const porGanar = citas.reduce((sum) => sum + (service.price || 0), 0);
      const ganado = citas.reduce((sum, a) => sum + (a.payment || 0), 0);
      const adeudado = citas.reduce(
        (sum, a) => sum + Math.max((service.price || 0) - (a.payment || 0), 0),
        0
      );

      return { service, citas, porGanar, ganado, adeudado };
    }).filter(Boolean);
  };

  const attendedGrouped = groupByService(attended, services);
  const noShowGrouped = groupByService(noShow, services);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* TABLA ATENDIDAS */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Detalle por Servicio (Atendidas)</h3>
        {attendedGrouped.length > 0 ? (
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
              {attendedGrouped.map((row) => (
                <tr key={row!.service.id}>
                  <td className="border border-gray-300 p-2">{row!.service.name}</td>
                  <td className="border border-gray-300 p-2 text-center">{row!.citas.length}</td>
                  <td className="border border-gray-300 p-2 text-center">${row!.porGanar}</td>
                  <td className="border border-gray-300 p-2 text-center">${row!.ganado}</td>
                  <td className="border border-gray-300 p-2 text-center">${row!.adeudado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No hay datos en este periodo.</p>
        )}
      </div>

      {/* TABLA NO ASISTIDAS */}
      <div>
        <h3 className="text-xl font-semibold mb-2">Detalle por Servicio (No asistidas)</h3>
        {noShowGrouped.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-red-200">
                <th className="border border-gray-300 p-2 text-left">Servicio</th>
                <th className="border border-gray-300 p-2 text-center">Citas</th>
                <th className="border border-gray-300 p-2 text-center">Pérdida ($)</th>
              </tr>
            </thead>
            <tbody>
              {noShowGrouped.map((row) => (
                <tr key={row!.service.id}>
                  <td className="border border-gray-300 p-2">{row!.service.name}</td>
                  <td className="border border-gray-300 p-2 text-center">{row!.citas.length}</td>
                  <td className="border border-gray-300 p-2 text-center">
                    ${row!.citas.reduce((sum) => sum + (row!.service.price || 0), 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">No hay datos en este periodo.</p>
        )}
      </div>
    </div>
  );
}
