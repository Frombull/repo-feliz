import { useState } from "react";
import { Tabs } from "./components/Tabs";
import { BookingsPage } from "./pages/BookingsPage";
import { RoomsPage } from "./pages/RoomsPage";

const tabs = [
  { id: "bookings", label: "Reservas" },
  { id: "rooms", label: "Salas" },
];

export function App() {
  const [tab, setTab] = useState("bookings");

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reserva de Salas</h1>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        {tab === "bookings" && <BookingsPage />}
        {tab === "rooms" && <RoomsPage />}
      </div>
    </main>
  );
}
