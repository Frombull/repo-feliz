function formatPrice(price) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ItemList({ items, onToggle, onRemove }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-gray-500">Nenhum item encontrado.</p>;
  }

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="font-medium text-gray-800">{item.name}</p>
            <p className="text-sm text-gray-500">{formatPrice(item.price)}</p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                item.available ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"
              }`}
            >
              {item.available ? "Disponível" : "Indisponível"}
            </span>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
            >
              {item.available ? "Marcar indisponível" : "Marcar disponível"}
            </button>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50"
            >
              Remover
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
