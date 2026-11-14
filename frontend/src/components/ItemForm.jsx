import { useState } from "react";
import { validateItem } from "../validation";

const emptyForm = { name: "", price: "", available: true };

export function ItemForm({ onSubmit }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validateItem(values);
    setErrors(found);
    setSubmitError(null);
    if (Object.keys(found).length > 0) {
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        price: Number(values.price),
        available: values.available,
      });
      setValues(emptyForm);
    } catch (error) {
      // mantém os campos preenchidos para tentar de novo
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-800">Novo item</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Nome
          <input
            name="name"
            value={values.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Preço
          <input
            name="price"
            type="number"
            step="0.01"
            value={values.price}
            onChange={handleChange}
            aria-invalid={Boolean(errors.price)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none"
          />
        </label>
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          name="available"
          type="checkbox"
          checked={values.available}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300"
        />
        Disponível
      </label>

      {submitError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "Adicionando..." : "Adicionar"}
      </button>
    </form>
  );
}
