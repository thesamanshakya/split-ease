/**
 * Formats a number as Indian Rupee currency with रु symbol
 * @param amount - The amount to format
 * @returns Formatted currency string with रु symbol
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
  })
    .format(amount)
    .replace("₹", "रु ");
}
