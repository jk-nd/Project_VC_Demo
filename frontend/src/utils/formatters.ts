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

/**
 * Format a date string as a localized date string
 * @param dateString - The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}; 