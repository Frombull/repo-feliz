// Mesmas regras de formato dos schemas do backend (RoomCreate e BookingCreate).
// Regras que dependem dos dados (conflito de horário, capacidade) ficam só no backend.
export const ROOM_NAME_MAX = 60;
export const ROOM_LOCATION_MAX = 100;
export const ROOM_CAPACITY_MAX = 500;
export const TITLE_MAX = 100;
export const REQUESTER_MAX = 60;

function requiredText(value, { required, max }) {
  const text = value.trim();
  if (!text) {
    return required;
  }
  if (text.length > max) {
    return `Use no máximo ${max} caracteres`;
  }
  return null;
}

function integerInRange(value, { required, min, max }) {
  if (String(value).trim() === "") {
    return required;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min) {
    return `Informe um número inteiro a partir de ${min}`;
  }
  if (max !== undefined && number > max) {
    return `O máximo é ${max}`;
  }
  return null;
}

function collect(entries) {
  return Object.fromEntries(entries.filter(([, message]) => message));
}

export function validateRoom({ name, capacity, location }) {
  return collect([
    ["name", requiredText(name, { required: "Informe o nome da sala", max: ROOM_NAME_MAX })],
    [
      "capacity",
      integerInRange(capacity, {
        required: "Informe a capacidade",
        min: 1,
        max: ROOM_CAPACITY_MAX,
      }),
    ],
    [
      "location",
      location.trim().length > ROOM_LOCATION_MAX
        ? `Use no máximo ${ROOM_LOCATION_MAX} caracteres`
        : null,
    ],
  ]);
}

// o formato "YYYY-MM-DDTHH:mm" do datetime-local pode ser comparado como texto
function validatePeriod({ startAt, endAt }) {
  return [
    ["startAt", startAt ? null : "Informe o início"],
    ["endAt", endAt ? null : "Informe o fim"],
    ["endAt", startAt && endAt && endAt <= startAt ? "O fim deve ser depois do início" : null],
  ];
}

export function validateBooking({ roomId, title, requester, attendees, startAt, endAt }) {
  return collect([
    ["roomId", roomId ? null : "Escolha a sala"],
    ["title", requiredText(title, { required: "Informe o título", max: TITLE_MAX })],
    [
      "requester",
      requiredText(requester, { required: "Informe o responsável", max: REQUESTER_MAX }),
    ],
    ["attendees", integerInRange(attendees, { required: "Informe os participantes", min: 1 })],
    ...validatePeriod({ startAt, endAt }),
  ]);
}

export function validateSearch({ startAt, endAt, minCapacity }) {
  return collect([
    ...validatePeriod({ startAt, endAt }),
    [
      "minCapacity",
      String(minCapacity).trim() === "" ? null : integerInRange(minCapacity, { min: 1 }),
    ],
  ]);
}
