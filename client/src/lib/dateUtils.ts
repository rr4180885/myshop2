/**
 * Format date to dd-mm-yyyy format
 * @param date - Date object, string, or timestamp
 * @returns Formatted date string in dd-mm-yyyy format
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  // If no date provided or invalid, use current date as fallback
  if (!date) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  const dateObj = new Date(date);
  
  // Check if date is valid, use current date as fallback
  if (isNaN(dateObj.getTime())) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
}

/**
 * Format date to dd-mm-yyyy HH:MM format
 * @param date - Date object, string, or timestamp
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
