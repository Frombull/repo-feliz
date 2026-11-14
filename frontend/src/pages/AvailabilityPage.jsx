import { useState } from "react";
import {
  Card,
  ErrorMessage,
  Field,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "../components/ui";
import { listAvailableRooms } from "../services/rooms";
import { formatPeriod } from "../utils/format";
import { validateSearch } from "../validation";

const emptyForm = { startAt: "", endAt: "", minCapacity: "" };

// `onReserve` recebe { roomId, startAt, endAt } e leva para o formulário de reserva
export function AvailabilityPage({ onReserve }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  // período que gerou a lista, para a reserva usar o mesmo horário mesmo se o formulário mudar
  const [result, setResult] = useState(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateSearch(values);
    setErrors(found);
    setSearchError(null);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSearching(true);
    try {
      const rooms = await listAvailableRooms(values);
      setResult({ rooms, startAt: values.startAt, endAt: values.endAt });
    } catch (error) {
      setResult(null);
      setSearchError(error.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Buscar salas livres">
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Início" error={errors.startAt}>
              <input
                name="startAt"
                type="datetime-local"
                value={values.startAt}
                onChange={handleChange}
                aria-invalid={Boolean(errors.startAt)}
                className={inputClass}
              />
            </Field>
            <Field label="Fim" error={errors.endAt}>
              <input
                name="endAt"
                type="datetime-local"
                value={values.endAt}
                onChange={handleChange}
                aria-invalid={Boolean(errors.endAt)}
                className={inputClass}
              />
            </Field>
            <Field label="Capacidade mínima" error={errors.minCapacity}>
              <input
                name="minCapacity"
                type="number"
                min="1"
                value={values.minCapacity}
                onChange={handleChange}
                aria-invalid={Boolean(errors.minCapacity)}
                className={inputClass}
              />
            </Field>
          </div>

          {searchError && <ErrorMessage>{searchError}</ErrorMessage>}

          <button type="submit" disabled={searching} className={primaryButtonClass}>
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </Card>

      {result && (
        <Card title={`Salas livres (${result.rooms.length})`}>
          <p className="mb-2 text-sm text-gray-500">{formatPeriod(result.startAt, result.endAt)}</p>
          {result.rooms.length === 0 ? (
            <p className="py-6 text-center text-gray-500">Nenhuma sala livre nesse horário.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {result.rooms.map((room) => (
                <li
                  key={room.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">{room.name}</p>
                    <p className="text-sm text-gray-500">
                      {room.capacity} lugares{room.location ? ` · ${room.location}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onReserve({
                        roomId: room.id,
                        startAt: result.startAt,
                        endAt: result.endAt,
                      })
                    }
                    className={secondaryButtonClass}
                  >
                    Reservar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
