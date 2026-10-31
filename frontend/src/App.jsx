import { ItemsPage } from "./pages/ItemsPage";

// sem API por enquanto: a lista começa com esses itens e vive só no estado
const initialItems = [
  { id: 1, name: "Teclado", price: 150, available: true },
  { id: 2, name: "Monitor", price: 899.9, available: false },
];

export function App() {
  return <ItemsPage initialItems={initialItems} />;
}
