/**
 * Format a number as currency with the specified currency code
 * @param value - The numeric value to format
 * @param currencyCode - The ISO currency code (e.g., 'USD', 'EUR')
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currencyCode: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}; 