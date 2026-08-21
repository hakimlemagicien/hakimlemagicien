export function isForbiddenSupportContent(text: string) {
  const lower = text.toLowerCase();
  return (
    /\b(?:cvv|cvc|card\s*number|رقم\s*البطاقة|كلمة\s*المرور|password)\b/i.test(lower) ||
    /\b(?:\d[ -]*){13,19}\b/.test(text)
  );
}
