export function Tabs({ tabs, active, onChange }) {
  return (
    <nav aria-label="Seções" className="flex gap-2 border-b border-gray-300">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-current={tab.id === active ? "page" : undefined}
          onClick={() => onChange(tab.id)}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            tab.id === active
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
