import type { PaymentType } from './paymentRepository';

export type SelectedPayment = {
  methodId: number;
  type: PaymentType;
  label: string;
  detail: string;
  changeFor: number | null;
};

export type PaymentSelection = {
  current(): SelectedPayment | null;
  select(payment: SelectedPayment): void;
  subscribe(listener: () => void): () => void;
  clear(): void;
};

export function createPaymentSelection(): PaymentSelection {
  let selected: SelectedPayment | null = null;
  const listeners = new Set<() => void>();
  return {
    current: () => selected,
    select: payment => {
      selected = payment;
      listeners.forEach(listener => listener());
    },
    clear: () => {
      selected = null;
      listeners.forEach(listener => listener());
    },
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
