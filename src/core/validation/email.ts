const emailPattern = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

export function isValidEmail(value: string): boolean {
  return emailPattern.test(value.trim());
}
