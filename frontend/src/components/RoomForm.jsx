import { useState } from "react";
import { validateRoom } from "../validation";
import { ErrorMessage, Field, inputClass, primaryButtonClass, secondaryButtonClass } from "./ui";

const emptyForm = { name: "", capacity: "", location: "" };

function initialValues(room) {
  if (!room) {
    return emptyForm;
  }
  return { name: room.name, capacity: String(room.capacity), location: room.location ?? "" };
}

// Sem `room` cadastra uma sala nova; com `room` edita a sala (e mostra o botão de cancelar).
export function RoomForm({ room, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialValues(room));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const editing = Boolean(room);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateRoom(values);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        capacity: Number(values.capacity),
        location: values.location.trim() || null,
      });
      if (!editing) {
        setValues(emptyForm);
      }
    } catch (error) {
      // mantém os campos preenchidos para tentar de novo
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Nome" error={errors.name}>
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            className={inputClass}
          />
        </Field>
        <Field label="Capacidade" error={errors.capacity}>
          <input
            name="capacity"
            type="number"
            min="1"
            value={values.capacity}
            onChange={handleChange}
            aria-invalid={Boolean(errors.capacity)}
            className={inputClass}
          />
        </Field>
        <Field label="Localização" error={errors.location}>
          <input
            name="location"
            value={values.location}
            onChange={handleChange}
            aria-invalid={Boolean(errors.location)}
            className={inputClass}
          />
        </Field>
      </div>

      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

      <div className="flex gap-2">
        <button type="submit" disabled={submitting} className={primaryButtonClass}>
          {editing ? "Salvar alterações" : "Adicionar sala"}
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
