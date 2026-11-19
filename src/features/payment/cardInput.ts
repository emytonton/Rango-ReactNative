export const CARD_NUMBER_MAX = 19;
export const EXPIRY_CVV_MAX = 8;

const ELO_PREFIXES = [
  '4011',
  '4312',
  '4389',
  '4514',
  '4576',
  '5041',
  '5066',
  '5067',
  '509',
  '6277',
  '6362',
  '6363',
  '650',
  '6516',
  '6550',
];

export function onlyDigits(value: string, max: number): string {
  return value.replace(/\D/g, '').slice(0, max);
}

export function formatCardNumber(digits: string): string {
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatExpiryCvv(digits: string): string {
  let formatted = '';
  for (let index = 0; index < digits.length; index++) {
    if (index === 2) {
      formatted += '/';
    } else if (index === 4) {
      formatted += ' ';
    }
    formatted += digits[index];
  }
  return formatted;
}

export function brandOf(number: string): string {
  const two = Number(number.slice(0, 2)) || 0;
  const four = Number(number.slice(0, 4)) || 0;
  if (ELO_PREFIXES.some(prefix => number.startsWith(prefix))) {
    return 'Elo';
  }
  if (number.startsWith('4')) {
    return 'Visa';
  }
  if ((two >= 51 && two <= 55) || (four >= 2221 && four <= 2720)) {
    return 'Mastercard';
  }
  if (two === 34 || two === 37) {
    return 'Amex';
  }
  return 'Cartão';
}

export function isValidCardNumber(number: string): boolean {
  if (number.length < 13 || number.length > CARD_NUMBER_MAX) {
    return false;
  }
  const sum = [...number].reverse().reduce((total, char, index) => {
    const digit = Number(char);
    if (index % 2 === 0) {
      return total + digit;
    }
    const doubled = digit * 2;
    return total + (doubled > 9 ? doubled - 9 : doubled);
  }, 0);
  return sum % 10 === 0;
}

export function isValidExpiryCvv(value: string): boolean {
  if (value.length < 7 || value.length > EXPIRY_CVV_MAX) {
    return false;
  }
  const month = Number(value.slice(0, 2));
  return month >= 1 && month <= 12;
}
