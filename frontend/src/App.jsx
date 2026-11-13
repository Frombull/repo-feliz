import { RoomsPage } from "./pages/RoomsPage";

export function App() {
  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reserva de Salas</h1>
        <RoomsPage />
      </div>
    </main>
  );
}
