import { describe, expect, it } from "vitest";
import { NAME_MAX_LENGTH, validateItem, validateName, validatePrice } from "../../src/validate";

describe("validateName", () => {
  it.each(["", "   "])("exige o nome (%j)", (name) => {
    expect(validateName(name)).toBe("Informe o nome do item");
  });

  it("aceita o nome no limite de caracteres", () => {
    expect(validateName("a".repeat(NAME_MAX_LENGTH))).toBeNull();
  });

  it("recusa o nome acima do limite", () => {
    expect(validateName("a".repeat(NAME_MAX_LENGTH + 1))).toBe(
      `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres`,
    );
  });
});

describe("validatePrice", () => {
  it("exige o preço", () => {
    expect(validatePrice("")).toBe("Informe o preço");
  });

  it.each(["0", "-5", "abc"])("recusa preço inválido (%j)", (price) => {
    expect(validatePrice(price)).toBe("O preço deve ser maior que zero");
  });

  it.each(["0.01", "10", 99.9])("aceita preço positivo (%j)", (price) => {
    expect(validatePrice(price)).toBeNull();
  });
});

describe("validateItem", () => {
  it("retorna objeto vazio quando o item é válido", () => {
    expect(validateItem({ name: "Mouse", price: "50" })).toEqual({});
  });

  it("retorna um erro por campo inválido", () => {
    expect(validateItem({ name: "", price: "0" })).toEqual({
      name: "Informe o nome do item",
      price: "O preço deve ser maior que zero",
    });
  });
});
