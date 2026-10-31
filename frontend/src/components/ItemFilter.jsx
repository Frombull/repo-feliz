export function ItemFilter({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      Mostrar
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-gray-300 px-2 py-1"
      >
        <option value="all">Todos</option>
        <option value="available">Disponíveis</option>
        <option value="unavailable">Indisponíveis</option>
      </select>
    </label>
  );
}
