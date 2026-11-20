import {
  formatDeliveryTime,
  formatOrderDate,
  formatPrice,
  formatRating,
} from '../../src/core/format/formatters';

test('formata preço em reais com vírgula', () => {
  expect(formatPrice(34.9)).toBe('R$ 34,90');
  expect(formatPrice(7)).toBe('R$ 7,00');
});

test('formata avaliação com uma casa decimal', () => {
  expect(formatRating(4.8)).toBe('4,8');
  expect(formatRating(5)).toBe('5,0');
});

test('formata o tempo de entrega', () => {
  expect(formatDeliveryTime(25, 35)).toBe('25-35 min');
});

test('formata a data do pedido como hoje, ontem ou dia e mês no horário local', () => {
  const now = new Date(2026, 10, 19, 8, 30);
  const at = (day: number, month = 10) =>
    new Date(2026, month, day, 19, 42).toISOString();

  expect(formatOrderDate(at(19), now)).toBe('Hoje · 19:42');
  expect(formatOrderDate(at(18), now)).toBe('Ontem · 19:42');
  expect(formatOrderDate(at(5, 7), now)).toBe('05 ago · 19:42');
});
