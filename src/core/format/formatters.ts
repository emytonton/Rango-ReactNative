export function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export function formatDeliveryTime(min: number, max: number): string {
  return `${min}-${max} min`;
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MONTHS = 'jan fev mar abr mai jun jul ago set out nov dez'.split(' ');

export function formatOrderDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const day =
    date.toDateString() === now.toDateString()
      ? 'Hoje'
      : date.toDateString() === yesterday.toDateString()
      ? 'Ontem'
      : `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]}`;
  return `${day} · ${formatClock(iso)}`;
}

export function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}
