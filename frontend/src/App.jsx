import { useState } from "react";
import { ItemFilter } from "./components/ItemFilter";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";

// sem API por enquanto: a lista começa com esses itens e vive só no estado
const initialItems = [
  { id: 1, name: "Teclado", price: 150, available: true },
  { id: 2, name: "Monitor", price: 899.9, available: false },
];

const filters = {
  all: () => true,
  available: (item) => item.available,
  unavailable: (item) => !item.available,
};

export function App() {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState("all");

  function addItem(data) {
    setItems((current) => {
      const nextId = current.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      return [...current, { id: nextId, ...data }];
    });
  }

  function toggleItem(id) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, available: !item.available } : item)),
    );
  }

  function removeItem(id) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  const visibleItems = items.filter(filters[filter]);

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Itens</h1>

        <ItemForm onSubmit={addItem} />

        <section className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Lista ({visibleItems.length})</h2>
            <ItemFilter value={filter} onChange={setFilter} />
          </div>
          <ItemList items={visibleItems} onToggle={toggleItem} onRemove={removeItem} />
        </section>
      </div>
    </main>
  );
}
