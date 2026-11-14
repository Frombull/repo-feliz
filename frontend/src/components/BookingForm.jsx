import { useState } from "react";
import { toInputValue } from "../utils/format";
import { validateBooking } from "../validation";
import { ErrorMessage, Field, inputClass, primaryButtonClass, secondaryButtonClass } from "./ui";

function initialValues(booking, draft) {
  if (booking) {
    return {
      roomId: String(booking.room_id),
      title: booking.title,
      requester: booking.requester,
      attendees: String(booking.attendees),
      startAt: toInputValue(booking.start_at),
      endAt: toInputValue(booking.end_at),
    };
  }
  return {
    roomId: draft?.roomId ? String(draft.roomId) : "",
    title: "",
    requester: "",
    attendees: "",
    startAt: draft?.startAt ?? "",
    endAt: draft?.endAt ?? "",
  };
}

// Sem `booking` cria uma reserva (podendo vir com sala e horário já escolhidos em `draft`);
// com `booking` edita a reserva.
export function BookingForm({ rooms, booking, draft, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialValues(booking, draft));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(booking);

  // só salas ativas aceitam reservas; na edição a sala atual continua na lista
  const options = rooms.filter((room) => room.active || String(room.id) === values.roomId);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateBooking(values);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        room_id: Number(values.roomId),
        title: values.title.trim(),
        requester: values.requester.trim(),
        attendees: Number(values.attendees),
        start_at: values.startAt,
        end_at: values.endAt,
      });
      if (!editing) {
        setValues(initialValues(null, null));
      }
    } catch (error) {
      // mantém os campos preenchidos para corrigir e tentar de novo
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sala" error={errors.roomId}>
          <select
            name="roomId"
            aria-label="Sala"
            value={values.roomId}
            onChange={handleChange}
            aria-invalid={Boolean(errors.roomId)}
            className={inputClass}
          >
            <option value="">Escolha a sala</option>
            {options.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name} ({room.capacity} lugares)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Título" error={errors.title}>
          <input
            name="title"
            value={values.title}
            onChange={handleChange}
            aria-invalid={Boolean(errors.title)}
            className={inputClass}
          />
        </Field>
        <Field label="Responsável" error={errors.requester}>
          <input
            name="requester"
            value={values.requester}
            onChange={handleChange}
            aria-invalid={Boolean(errors.requester)}
            className={inputClass}
          />
        </Field>
        <Field label="Participantes" error={errors.attendees}>
          <input
            name="attendees"
            type="number"
            min="1"
            value={values.attendees}
            onChange={handleChange}
            aria-invalid={Boolean(errors.attendees)}
            className={inputClass}
          />
        </Field>
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
      </div>

      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {editing ? "Salvar alterações" : "Reservar"}
        </button>
        {editing && (
          <button type="button" onClick={onCancel} className={secondaryButtonClass}>
            Cancelar edição
          </button>
        )}
      </div>
    </form>
  );
}
