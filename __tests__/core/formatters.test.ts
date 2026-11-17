import {
  formatDeliveryTime,
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
