import type { Appointment, Service } from "../../services/professional/accountsService";

interface AccountsAttendedDetailProps {
  attended: Appointment[];
  services: Service[];
}

export default function AccountsAttendedDetail({ attended, services }: AccountsAttendedDetailProps) {
  return (
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
                  <td className="border border-gray-300 p-2">{appt.clientInfo?.name || "Sin nombre"}</td>
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
  );
}
