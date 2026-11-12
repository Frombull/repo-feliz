// A API usa horário local sem fuso ("2030-05-10T09:00:00"). Por isso o texto é fatiado
// em vez de passar por Date, que poderia deslocar o horário.

export function formatDateTime(value) {
  const [date, time] = value.split("T");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time.slice(0, 5)}`;
}

export function formatPeriod(start, end) {
  const sameDay = start.slice(0, 10) === end.slice(0, 10);
  return sameDay
    ? `${formatDateTime(start)} às ${end.slice(11, 16)}`
    : `${formatDateTime(start)} até ${formatDateTime(end)}`;
}

// valor aceito pelo <input type="datetime-local">
export function toInputValue(value) {
  return value.slice(0, 16);
}
