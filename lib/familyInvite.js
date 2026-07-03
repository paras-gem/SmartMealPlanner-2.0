export function parseFamilyIdentifier(input) {
  const value = String(input || '').trim();
  if (!value) return null;

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (isEmail) {
    return { type: 'email', value: value.toLowerCase() };
  }

  return { type: 'code', value: value.toUpperCase() };
}
