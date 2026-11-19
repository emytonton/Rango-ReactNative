import type { IconName } from '../../components';
import type { PaymentType } from '../../data/payment/paymentRepository';

export const paymentTypeIcons: Record<PaymentType, IconName> = {
  pix: 'qrCode2',
  credit: 'creditCard',
  debit: 'creditScore',
  cash: 'payments',
};
