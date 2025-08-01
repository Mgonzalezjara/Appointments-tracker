import { Dialog } from "@headlessui/react";
import { useEffect } from "react";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
}

interface FormData {
  date: string;
  startHour: string;
  endHour: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  payment: number;
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  services: Service[];
  isEditing: boolean;
  durationPreview: number | null;
  isFormValid: boolean;
  statusAction: "attended" | "no-show" | "";
  setStatusAction: React.Dispatch<React.SetStateAction<"attended" | "no-show" | "">>;
  isPastOrToday: (date: string) => boolean;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  services,
  isEditing,
  durationPreview,
  isFormValid,
  statusAction,
  setStatusAction,
  isPastOrToday,
}: AppointmentModalProps) {

  // ✅ Ajustar automáticamente la hora de fin según la duración del servicio seleccionado
  useEffect(() => {
    if (formData.serviceId && formData.date && formData.startHour) {
      const selectedService = services.find((s) => s.id === formData.serviceId);
      if (selectedService) {
        const start = new Date(`${formData.date}T${formData.startHour}`);
        const adjustedEnd = new Date(start.getTime() + selectedService.duration * 60000);
        const newEndHour = adjustedEnd.toTimeString().slice(0, 5);
        if (formData.endHour !== newEndHour) {
          setFormData((prev) => ({ ...prev, endHour: newEndHour }));
        }
      }
    }
  }, [formData.serviceId, formData.startHour, formData.date, services, setFormData]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-50">
      <div className="flex items-center justify-center min-h-screen bg-black bg-opacity-40">
        <Dialog.Panel className="bg-white rounded-lg p-6 shadow-xl w-full max-w-lg">
          <Dialog.Title className="text-xl font-semibold mb-4">
            {isEditing ? "Editar Cita" : "Crear Nueva Cita"}
          </Dialog.Title>

          <label className="block mb-1">Fecha</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="border w-full p-2 mb-3"
          />

          <label className="block mb-1">Hora de inicio</label>
          <input
            type="time"
            name="startHour"
            value={formData.startHour}
            onChange={(e) => setFormData({ ...formData, startHour: e.target.value })}
            className="border w-full p-2 mb-3"
          />

          <label className="block mb-1">Hora de fin</label>
          <input
            type="time"
            name="endHour"
            value={formData.endHour}
            onChange={(e) => setFormData({ ...formData, endHour: e.target.value })}
            className="border w-full p-2 mb-2"
          />

          {durationPreview !== null && (
            <p className="text-sm text-gray-600 mb-4">
              ⏱ Duración: <strong>{durationPreview} min</strong>
            </p>
          )}

          <label className="block mb-1">Servicio (opcional)</label>
          <select
            name="serviceId"
            value={formData.serviceId}
            onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
            className="border w-full p-2 mb-4"
          >
            <option value="">Sin servicio</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} (${service.price})
              </option>
            ))}
          </select>

          {/* ... resto del modal sin cambios ... */}


          <label className="block mb-1">Pago recibido</label>
          <input
            type="number"
            name="payment"
            value={formData.payment}
            onChange={(e) => setFormData({ ...formData, payment: Number(e.target.value) })}
            className="border w-full p-2 mb-2"
          />

          {isEditing && formData.serviceId && (
            <p className="text-sm text-gray-600 mb-4">
              💰 <strong>Adeudado:</strong> $
              {Math.max(
                (services.find((s) => s.id === formData.serviceId)?.price || 0) -
                  (formData.payment || 0),
                0
              )}
            </p>
          )}

          <h4 className="font-medium mt-4 mb-2">Datos del cliente (opcional)</h4>
          <input
            type="text"
            name="clientName"
            placeholder="Nombre"
            value={formData.clientName}
            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            className="border w-full p-2 mb-2"
          />
          <input
            type="email"
            name="clientEmail"
            placeholder="Correo"
            value={formData.clientEmail}
            onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            className="border w-full p-2 mb-2"
          />
          <input
            type="tel"
            name="clientPhone"
            placeholder="Teléfono"
            value={formData.clientPhone}
            onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
            className="border w-full p-2 mb-4"
          />

          {isEditing && isPastOrToday(formData.date) && (
            <div className="mb-4">
              <p className="mb-2 text-sm text-gray-600">
                <strong>Estado actual:</strong> {statusAction || "Sin estado especial"}
              </p>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={statusAction === "attended"}
                  onChange={() =>
                    setStatusAction(statusAction === "attended" ? "" : "attended")
                  }
                  className="mr-2"
                />
                Marcar como realizada
              </label>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={statusAction === "no-show"}
                  onChange={() =>
                    setStatusAction(statusAction === "no-show" ? "" : "no-show")
                  }
                  className="mr-2"
                />
                Marcar como no asiste
              </label>
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={onSubmit}
              disabled={!isFormValid}
              className={`${
                isEditing ? "bg-green-500 hover:bg-green-600" : "bg-blue-500 hover:bg-blue-600"
              } text-white px-4 py-2 rounded w-full`}
            >
              {isEditing ? "Guardar cambios" : "Crear cita"}
            </button>
            <button
              onClick={onClose}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 w-full"
            >
              Cancelar
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
