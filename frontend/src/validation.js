// mesmas regras do ItemCreate no backend
export const NAME_MAX_LENGTH = 50;

export function validateName(name) {
  const value = name.trim();
  if (!value) {
    return "Informe o nome do item";
  }
  if (value.length > NAME_MAX_LENGTH) {
    return `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres`;
  }
  return null;
}

export function validatePrice(price) {
  if (String(price).trim() === "") {
    return "Informe o preço";
  }
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) {
    return "O preço deve ser maior que zero";
  }
  return null;
}

export function validateItem({ name, price }) {
  const errors = {};
  const nameError = validateName(name);
  const priceError = validatePrice(price);
  if (nameError) {
    errors.name = nameError;
  }
  if (priceError) {
    errors.price = priceError;
  }
  return errors;
}
