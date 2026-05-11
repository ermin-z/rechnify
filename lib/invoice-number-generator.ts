export function generateInvoiceNumber(
  year: number,
  lastSequence: number | null
): string {
  const next = lastSequence === null ? 1 : lastSequence + 1;
  return `${year}-${String(next).padStart(3, "0")}`;
}
