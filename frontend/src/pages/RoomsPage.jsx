import { useCallback, useState } from "react";
import { RoomForm } from "../components/RoomForm";
import { RoomList } from "../components/RoomList";
import { Card, ErrorMessage, LoadState } from "../components/ui";
import { useLoad } from "../hooks/useLoad";
import { createRoom, deleteRoom, listRooms, updateRoom } from "../services/rooms";

// valor do filtro na tela -> parâmetro `active` da API
const activeByFilter = { all: undefined, active: true, inactive: false };

export function RoomsPage() {
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loader = useCallback(() => listRooms({ active: activeByFilter[filter] }), [filter]);
  const { data, loading, error, reload, refresh } = useLoad(loader);
  const rooms = data ?? [];

  async function refreshAfterChange() {
    try {
      await refresh();
    } catch (failure) {
      setActionError(failure.message);
    }
  }

  // o erro sobe para o RoomForm, que mostra a mensagem e mantém os campos
  async function saveRoom(values) {
    setActionError(null);
    if (editing) {
      await updateRoom(editing.id, values);
      setEditing(null);
    } else {
      await createRoom(values);
    }
    await refreshAfterChange();
  }

  async function runAction(action) {
    setActionError(null);
    try {
      await action();
    } catch (failure) {
      setActionError(failure.message);
      return;
    }
    await refreshAfterChange();
  }

  function toggleActive(room) {
    return runAction(() => updateRoom(room.id, { active: !room.active }));
  }

  function remove(room) {
    if (!window.confirm(`Excluir a sala "${room.name}"?`)) {
      return undefined;
    }
    return runAction(() => deleteRoom(room.id));
  }

  return (
    <div className="space-y-6">
      <Card title={editing ? "Editar sala" : "Cadastrar sala"}>
        <RoomForm
          key={editing ? `edit-${editing.id}` : "new"}
          room={editing}
          onSubmit={saveRoom}
          onCancel={() => setEditing(null)}
        />
      </Card>

      <Card
        title={`Salas (${rooms.length})`}
        aside={
          <label className="flex items-center gap-2 text-sm text-gray-700">
            Mostrar
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              <option value="all">Todas</option>
              <option value="active">Ativas</option>
              <option value="inactive">Inativas</option>
            </select>
          </label>
        }
      >
        {actionError && <ErrorMessage>{actionError}</ErrorMessage>}
        <LoadState
          loading={loading}
          error={error}
          onRetry={reload}
          loadingText="Carregando salas..."
        >
          <RoomList
            rooms={rooms}
            onEdit={setEditing}
            onToggleActive={toggleActive}
            onDelete={remove}
          />
        </LoadState>
      </Card>
    </div>
  );
}
