// O que a tela oferece para cada reserva. O backend é quem decide de verdade (e responde 409
// se a regra for violada); aqui só se evita mostrar botões que certamente vão falhar.

export function canModify(booking, now = new Date()) {
  return booking.status === "confirmed" && new Date(booking.start_at) > now;
}

export function canDelete(booking, now = new Date()) {
  return booking.status === "cancelled" || new Date(booking.end_at) <= now;
}
