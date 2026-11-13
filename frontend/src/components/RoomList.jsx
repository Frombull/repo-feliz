import { Badge, dangerButtonClass, secondaryButtonClass } from "./ui";

export function RoomList({ rooms, onEdit, onToggleActive, onDelete }) {
  if (rooms.length === 0) {
    return <p className="py-6 text-center text-gray-500">Nenhuma sala encontrada.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {rooms.map((room) => (
        <li key={room.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div>
            <p className="font-medium text-gray-800">{room.name}</p>
            <p className="text-sm text-gray-500">
              {room.capacity} lugares{room.location ? ` · ${room.location}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={room.active ? "green" : "gray"}>{room.active ? "Ativa" : "Inativa"}</Badge>
            <button type="button" onClick={() => onEdit(room)} className={secondaryButtonClass}>
              Editar
            </button>
            <button
              type="button"
              onClick={() => onToggleActive(room)}
              className={secondaryButtonClass}
            >
              {room.active ? "Desativar" : "Ativar"}
            </button>
            <button type="button" onClick={() => onDelete(room)} className={dangerButtonClass}>
              Excluir
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
