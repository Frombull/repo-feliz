import { useState } from "react";
import { Tabs } from "./components/Tabs";
import { AvailabilityPage } from "./pages/AvailabilityPage";
import { BookingsPage } from "./pages/BookingsPage";
import { RoomsPage } from "./pages/RoomsPage";

const tabs = [
  { id: "bookings", label: "Reservas" },
  { id: "rooms", label: "Salas" },
  { id: "availability", label: "Salas livres" },
];

export function App() {
  const [tab, setTab] = useState("bookings");
  // sala e horário escolhidos na busca, que abrem o formulário de reserva já preenchido
  const [draft, setDraft] = useState(null);

  function reserve(choice) {
    setDraft(choice);
    setTab("bookings");
  }

  function changeTab(id) {
    // quem sai da busca por conta própria volta para um formulário em branco
    setDraft(null);
    setTab(id);
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reserva de Salas</h1>
        <Tabs tabs={tabs} active={tab} onChange={changeTab} />
        {tab === "bookings" && <BookingsPage draft={draft} />}
        {tab === "rooms" && <RoomsPage />}
        {tab === "availability" && <AvailabilityPage onReserve={reserve} />}
      </div>
    </main>
  );
}
