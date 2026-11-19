import type { SummaryLine } from '../../components';
import { formatPrice } from '../../core/format/formatters';
import type { Cart } from '../../data/cart/cartRepository';

export function summaryLines(cart: Cart): SummaryLine[] {
  const { summary } = cart;
  const coupon = cart.coupon?.applied ? cart.coupon : null;
  const freeDelivery = summary.deliveryFee === 0 && summary.subtotal > 0;
  const lines: SummaryLine[] = [
    { label: 'Subtotal', value: formatPrice(summary.subtotal) },
    {
      label: 'Taxa de entrega',
      value: freeDelivery ? 'Grátis' : formatPrice(summary.deliveryFee),
      highlight: freeDelivery,
    },
  ];
  if (summary.discount > 0) {
    lines.push({
      label: `Desconto · ${coupon?.code ?? ''}`,
      value: `- ${formatPrice(summary.discount)}`,
      highlight: true,
    });
  }
  return lines;
}
