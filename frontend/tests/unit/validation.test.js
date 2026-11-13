import { describe, expect, it } from "vitest";
import { validateBooking, validateRoom, validateSearch } from "../../src/validation";

const validRoom = { name: "Sala A", capacity: "10", location: "Bloco 1" };

describe("validateRoom", () => {
  it("aceita uma sala válida, com ou sem localização", () => {
    expect(validateRoom(validRoom)).toEqual({});
    expect(validateRoom({ ...validRoom, location: "" })).toEqual({});
  });

  it("exige o nome e limita o tamanho", () => {
    expect(validateRoom({ ...validRoom, name: "   " }).name).toBe("Informe o nome da sala");
    expect(validateRoom({ ...validRoom, name: "x".repeat(61) }).name).toMatch("no máximo 60");
    expect(validateRoom({ ...validRoom, name: "x".repeat(60) }).name).toBeUndefined();
  });

  it("exige capacidade inteira entre 1 e 500", () => {
    expect(validateRoom({ ...validRoom, capacity: "" }).capacity).toBe("Informe a capacidade");
    expect(validateRoom({ ...validRoom, capacity: "0" }).capacity).toMatch("a partir de 1");
    expect(validateRoom({ ...validRoom, capacity: "2.5" }).capacity).toMatch("inteiro");
    expect(validateRoom({ ...validRoom, capacity: "abc" }).capacity).toMatch("inteiro");
    expect(validateRoom({ ...validRoom, capacity: "501" }).capacity).toBe("O máximo é 500");
    expect(validateRoom({ ...validRoom, capacity: "500" }).capacity).toBeUndefined();
  });

  it("limita a localização", () => {
    expect(validateRoom({ ...validRoom, location: "x".repeat(101) }).location).toMatch(
      "no máximo 100",
    );
  });
});

const validBooking = {
  roomId: "1",
  title: "Reunião",
  requester: "Ana",
  attendees: "3",
  startAt: "2030-05-10T09:00",
  endAt: "2030-05-10T10:00",
};

describe("validateBooking", () => {
  it("aceita uma reserva válida", () => {
    expect(validateBooking(validBooking)).toEqual({});
  });

  it("exige todos os campos", () => {
    const errors = validateBooking({
      roomId: "",
      title: "",
      requester: "",
      attendees: "",
      startAt: "",
      endAt: "",
    });
    expect(errors).toEqual({
      roomId: "Selecione uma sala",
      title: "Informe o título",
      requester: "Informe o responsável",
      attendees: "Informe os participantes",
      startAt: "Informe o início",
      endAt: "Informe o fim",
    });
  });

  it("exige participantes inteiros e positivos", () => {
    expect(validateBooking({ ...validBooking, attendees: "0" }).attendees).toMatch("a partir de 1");
    expect(validateBooking({ ...validBooking, attendees: "1.5" }).attendees).toMatch("inteiro");
  });

  it("exige que o fim seja depois do início", () => {
    const same = validateBooking({ ...validBooking, endAt: validBooking.startAt });
    const before = validateBooking({ ...validBooking, endAt: "2030-05-10T08:00" });
    expect(same.endAt).toBe("O fim deve ser depois do início");
    expect(before.endAt).toBe("O fim deve ser depois do início");
  });

  it("limita título e responsável", () => {
    expect(validateBooking({ ...validBooking, title: "x".repeat(101) }).title).toMatch("100");
    expect(validateBooking({ ...validBooking, requester: "x".repeat(61) }).requester).toMatch("60");
  });
});

describe("validateSearch", () => {
  const valid = { startAt: "2030-05-10T09:00", endAt: "2030-05-10T10:00", minCapacity: "" };

  it("aceita o período com ou sem capacidade mínima", () => {
    expect(validateSearch(valid)).toEqual({});
    expect(validateSearch({ ...valid, minCapacity: "4" })).toEqual({});
  });

  it("valida o período e a capacidade", () => {
    expect(validateSearch({ ...valid, startAt: "" }).startAt).toBe("Informe o início");
    expect(validateSearch({ ...valid, endAt: valid.startAt }).endAt).toMatch("depois do início");
    expect(validateSearch({ ...valid, minCapacity: "0" }).minCapacity).toMatch("a partir de 1");
  });
});
