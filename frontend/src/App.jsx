import { useEffect, useState } from "react";
import { ItemFilter } from "./components/ItemFilter";
import { ItemForm } from "./components/ItemForm";
import { ItemList } from "./components/ItemList";
import { createItem, deleteItem, listItems, updateItem } from "./services/items";

// valor do filtro na tela -> parâmetro `available` da API
const availableByFilter = {
  all: undefined,
  available: true,
  unavailable: false,
};

export function App() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // reloadCount só existe para o "Tentar novamente" refazer a busca
    void reloadCount;
    let ignore = false;
    setLoading(true);
    setLoadError(null);
    listItems(availableByFilter[filter])
      .then((data) => {
        if (!ignore) {
          setItems(data);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(error.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [filter, reloadCount]);

  // busca de novo depois de uma alteração, sem trocar a lista pelo "Carregando"
  async function refresh() {
    try {
      setItems(await listItems(availableByFilter[filter]));
    } catch (error) {
      setActionError(error.message);
    }
  }

  // o erro do cadastro sobe para o ItemForm, que mostra a mensagem e mantém os campos
  async function addItem(data) {
    setActionError(null);
    await createItem(data);
    await refresh();
  }

  async function runAction(action) {
    setActionError(null);
    try {
      await action();
    } catch (error) {
      setActionError(error.message);
      return;
    }
    await refresh();
  }

  function toggleItem(id) {
    const item = items.find((current) => current.id === id);
    return runAction(() => updateItem(id, { available: !item.available }));
  }

  function removeItem(id) {
    return runAction(() => deleteItem(id));
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Itens</h1>

        <ItemForm onSubmit={addItem} />

        <section className="rounded-lg bg-white p-6 shadow">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Lista ({items.length})</h2>
            <ItemFilter value={filter} onChange={setFilter} />
          </div>

          {actionError && (
            <p role="alert" className="mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {actionError}
            </p>
          )}

          {loading && (
            <p role="status" className="py-6 text-center text-gray-500">
              Carregando itens...
            </p>
          )}

          {!loading && loadError && (
            <div role="alert" className="space-y-3 py-6 text-center">
              <p className="text-red-700">{loadError}</p>
              <button
                type="button"
                onClick={() => setReloadCount((count) => count + 1)}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {!loading && !loadError && (
            <ItemList items={items} onToggle={toggleItem} onRemove={removeItem} />
          )}
        </section>
      </div>
    </main>
  );
}
