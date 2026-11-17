export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export function formatDeliveryTime(min: number, max: number): string {
  return `${min}-${max} min`;
}
