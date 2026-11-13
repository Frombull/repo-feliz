import { canDelete, canModify } from "../utils/booking";
import { formatPeriod } from "../utils/format";
import { Badge, dangerButtonClass, secondaryButtonClass } from "./ui";

export function BookingList({ bookings, rooms, onEdit, onCancel, onDelete, now = new Date() }) {
  if (bookings.length === 0) {
    return <p className="py-6 text-center text-gray-500">Nenhuma reserva encontrada.</p>;
  }

  const roomNames = new Map(rooms.map((room) => [room.id, room.name]));

  return (
    <ul className="divide-y divide-gray-200">
      {bookings.map((booking) => (
        <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-medium text-gray-800">{booking.title}</p>
            <p className="text-sm text-gray-500">
              {roomNames.get(booking.room_id) ?? `Sala ${booking.room_id}`} ·{" "}
              {formatPeriod(booking.start_at, booking.end_at)}
            </p>
            <p className="text-sm text-gray-500">
              {booking.requester} · {booking.attendees}{" "}
              {booking.attendees === 1 ? "participante" : "participantes"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={booking.status === "confirmed" ? "green" : "red"}>
              {booking.status === "confirmed" ? "Confirmada" : "Cancelada"}
            </Badge>
            {canModify(booking, now) && (
              <>
                <button
                  type="button"
                  onClick={() => onEdit(booking)}
                  className={secondaryButtonClass}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onCancel(booking)}
                  className={secondaryButtonClass}
                >
                  Cancelar reserva
                </button>
              </>
            )}
            {canDelete(booking, now) && (
              <button type="button" onClick={() => onDelete(booking)} className={dangerButtonClass}>
                Excluir
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
