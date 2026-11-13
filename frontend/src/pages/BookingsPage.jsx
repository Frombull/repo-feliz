import { useCallback, useState } from "react";
import { BookingForm } from "../components/BookingForm";
import { BookingList } from "../components/BookingList";
import { Card, ErrorMessage, LoadState } from "../components/ui";
import { useLoad } from "../hooks/useLoad";
import {
  cancelBooking,
  createBooking,
  deleteBooking,
  listBookings,
  updateBooking,
} from "../services/bookings";
import { listRooms } from "../services/rooms";

const selectClass = "rounded-md border border-gray-300 px-2 py-1";

// `draft` vem da busca de salas livres: { roomId, startAt, endAt } já preenchidos no formulário
export function BookingsPage({ draft }) {
  const [filters, setFilters] = useState({ roomId: "", status: "", date: "" });
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState(null);

  const roomsLoader = useCallback(() => listRooms(), []);
  const bookingsLoader = useCallback(() => listBookings(filters), [filters]);
  const rooms = useLoad(roomsLoader);
  const bookings = useLoad(bookingsLoader);

  function changeFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function refreshAfterChange() {
    try {
      await bookings.refresh();
    } catch (failure) {
      setActionError(failure.message);
    }
  }

  // o erro sobe para o BookingForm, que mostra a mensagem (409, 422...) e mantém os campos
  async function saveBooking(values) {
    setActionError(null);
    if (editing) {
      await updateBooking(editing.id, values);
      setEditing(null);
    } else {
      await createBooking(values);
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

  function cancel(booking) {
    if (!window.confirm(`Cancelar a reserva "${booking.title}"?`)) {
      return undefined;
    }
    return runAction(() => cancelBooking(booking.id));
  }

  function remove(booking) {
    if (!window.confirm(`Excluir a reserva "${booking.title}"?`)) {
      return undefined;
    }
    return runAction(() => deleteBooking(booking.id));
  }

  const list = bookings.data ?? [];
  const roomList = rooms.data ?? [];
  const draftKey = draft ? `${draft.roomId}-${draft.startAt}-${draft.endAt}` : "none";

  return (
    <div className="space-y-6">
      <Card title={editing ? "Editar reserva" : "Nova reserva"}>
        <LoadState
          loading={rooms.loading}
          error={rooms.error}
          onRetry={rooms.reload}
          loadingText="Carregando salas..."
        >
          {roomList.some((room) => room.active) ? (
            <BookingForm
              key={editing ? `edit-${editing.id}` : `new-${draftKey}`}
              rooms={roomList}
              booking={editing}
              draft={draft}
              onSubmit={saveBooking}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <p className="text-gray-500">
              Não há salas ativas. Cadastre ou ative uma sala na aba Salas para reservar.
            </p>
          )}
        </LoadState>
      </Card>

      <Card
        title={`Reservas (${list.length})`}
        aside={
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
            <label className="flex items-center gap-2">
              Filtrar por sala
              <select
                name="roomId"
                value={filters.roomId}
                onChange={changeFilter}
                className={selectClass}
              >
                <option value="">Todas</option>
                {roomList.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              Situação
              <select
                name="status"
                value={filters.status}
                onChange={changeFilter}
                className={selectClass}
              >
                <option value="">Todas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              Data
              <input
                name="date"
                type="date"
                value={filters.date}
                onChange={changeFilter}
                className={selectClass}
              />
            </label>
          </div>
        }
      >
        {actionError && <ErrorMessage>{actionError}</ErrorMessage>}
        <LoadState
          loading={rooms.loading || bookings.loading}
          error={bookings.error}
          onRetry={bookings.reload}
          loadingText="Carregando reservas..."
        >
          <BookingList
            bookings={list}
            rooms={roomList}
            onEdit={setEditing}
            onCancel={cancel}
            onDelete={remove}
          />
        </LoadState>
      </Card>
    </div>
  );
}
