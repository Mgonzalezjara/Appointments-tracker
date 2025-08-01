interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface ClientInfo {
  name: string;
  email: string;
  phone: string;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: "available" | "booked" | "attended" | "no-show";
  serviceId?: string;
  clientInfo?: ClientInfo;
  payment?: number;
}

interface AppointmentsListProps {
  filteredAppointments: Appointment[];
  services: Service[];
  handleEdit: (appt: Appointment) => void;
  handleDelete: (id: string) => void;
}

export default function AppointmentsList({
  filteredAppointments,
  services,
  handleEdit,
  handleDelete,
}: AppointmentsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredAppointments.map((appt) => {
        const service = services.find((s) => s.id === appt.serviceId);
        const adeudado = service ? Math.max(service.price - (appt.payment || 0), 0) : 0;

        return (
          <div key={appt.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-400">
            <p>
              <strong>Inicio:</strong> {new Date(appt.startTime).toLocaleString()}
            </p>
            <p>
              <strong>Fin:</strong> {new Date(appt.endTime).toLocaleString()}
            </p>
            <p>
              <strong>Duración:</strong> {appt.duration} min
            </p>
            <p>
              <strong>Estado:</strong> {appt.status}
            </p>
            {service && (
              <p>
                <strong>Servicio:</strong> {service.name} (${service.price})
              </p>
            )}
            <p>
              <strong>Pago recibido:</strong> ${appt.payment || 0}
            </p>
            <p>
              <strong>Adeudado:</strong> ${adeudado}
            </p>
            {appt.clientInfo?.name ? (
              <div className="mt-2">
                <p>
                  <strong>Cliente:</strong> {appt.clientInfo.name}
                </p>
                <p>
                  <strong>Email:</strong> {appt.clientInfo.email}
                </p>
                <p>
                  <strong>Teléfono:</strong> {appt.clientInfo.phone}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-gray-500">Sin cliente asignado</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleEdit(appt)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(appt.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
