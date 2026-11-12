import { describe, expect, it } from "vitest";
import { canDelete, canModify } from "../../src/utils/booking";
import { formatDateTime, formatPeriod, toInputValue } from "../../src/utils/format";

describe("format", () => {
  it("formata a data e a hora sem mexer no fuso", () => {
    expect(formatDateTime("2030-05-10T09:05:00")).toBe("10/05/2030 09:05");
  });

  it("mostra o período no mesmo dia de forma curta", () => {
    expect(formatPeriod("2030-05-10T09:00:00", "2030-05-10T10:30:00")).toBe(
      "10/05/2030 09:00 às 10:30",
    );
  });

  it("mostra as duas datas quando o período atravessa dias", () => {
    expect(formatPeriod("2030-05-10T21:00:00", "2030-05-11T01:00:00")).toBe(
      "10/05/2030 21:00 até 11/05/2030 01:00",
    );
  });

  it("converte para o valor do datetime-local", () => {
    expect(toInputValue("2030-05-10T09:00:00")).toBe("2030-05-10T09:00");
  });
});

describe("regras de exibição das ações", () => {
  const now = new Date("2030-05-10T09:30:00");
  const booking = (status, start, end) => ({ status, start_at: start, end_at: end });
  const future = booking("confirmed", "2030-05-10T10:00:00", "2030-05-10T11:00:00");
  const running = booking("confirmed", "2030-05-10T09:00:00", "2030-05-10T10:00:00");
  const finished = booking("confirmed", "2030-05-10T07:00:00", "2030-05-10T08:00:00");
  const cancelled = booking("cancelled", "2030-05-10T10:00:00", "2030-05-10T11:00:00");

  it("só permite alterar e cancelar reservas confirmadas que ainda não começaram", () => {
    expect(canModify(future, now)).toBe(true);
    expect(canModify(running, now)).toBe(false);
    expect(canModify(finished, now)).toBe(false);
    expect(canModify(cancelled, now)).toBe(false);
  });

  it("só permite excluir reservas canceladas ou que já terminaram", () => {
    expect(canDelete(cancelled, now)).toBe(true);
    expect(canDelete(finished, now)).toBe(true);
    expect(canDelete(future, now)).toBe(false);
    expect(canDelete(running, now)).toBe(false);
  });
});
