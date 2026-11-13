export const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none";

export const primaryButtonClass =
  "rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60";

export const secondaryButtonClass =
  "rounded-md border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-60";

export const dangerButtonClass = "rounded-md px-3 py-1 text-sm text-red-600 hover:bg-red-50";

export function Field({ label, error, children }) {
  return (
    <div>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: o input entra como children, dentro do label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {children}
      </label>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function ErrorMessage({ children }) {
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  );
}

export function Badge({ tone, children }) {
  const tones = {
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-200 text-gray-700",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>
  );
}

// carregando, erro com "Tentar novamente" ou o conteúdo pronto
export function LoadState({ loading, error, onRetry, loadingText, children }) {
  if (loading) {
    return (
      <p role="status" className="py-6 text-center text-gray-500">
        {loadingText}
      </p>
    );
  }
  if (error) {
    return (
      <div role="alert" className="space-y-3 py-6 text-center">
        <p className="text-red-700">{error}</p>
        <button type="button" onClick={onRetry} className={secondaryButtonClass}>
          Tentar novamente
        </button>
      </div>
    );
  }
  return children;
}

export function Card({ title, aside, children }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
