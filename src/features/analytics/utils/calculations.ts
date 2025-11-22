// Analytics Calculation Utilities

/**
 * Calculate Cost Per Wear
 * @param price - Item price
 * @param wearCount - Number of times worn
 * @returns Cost per wear value, or Infinity if never worn
 */
export function calculateCPW(price: number, wearCount: number): number {
  if (wearCount === 0) return Infinity;
  return price / wearCount;
}

/**
 * Determine ROI category based on CPW value
 * @param cpw - Cost per wear value
 * @returns ROI category
 */
export function getCPWCategory(
  cpw: number
): 'excellent' | 'good' | 'fair' | 'poor' | 'unused' {
  if (cpw === Infinity || !isFinite(cpw)) return 'unused';
  if (cpw < 1) return 'excellent';
  if (cpw < 5) return 'good';
  if (cpw < 20) return 'fair';
  return 'poor';
}

/**
 * Calculate utilization rate as percentage
 * @param usedItems - Number of items used
 * @param totalItems - Total number of items
 * @returns Utilization rate percentage (0-100)
 */
export function calculateUtilizationRate(
  usedItems: number,
  totalItems: number
): number {
  if (totalItems === 0) return 0;
  return Math.round((usedItems / totalItems) * 100 * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate average value
 * @param values - Array of numbers
 * @returns Average value, or 0 if array is empty
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / values.length) * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate percentage
 * @param value - Numerator value
 * @param total - Denominator value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate color diversity score
 * Measures variety of colors in wardrobe (unique colors / total items * 100)
 * @param uniqueColors - Number of unique colors
 * @param totalItems - Total number of items
 * @returns Diversity score (0-100)
 */
export function calculateColorDiversity(
  uniqueColors: number,
  totalItems: number
): number {
  if (totalItems === 0) return 0;
  const score = (uniqueColors / totalItems) * 100;
  return Math.min(100, Math.round(score)); // Cap at 100
}

/**
 * Format currency value
 * @param value - Numeric value
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  if (!isFinite(value)) return '∞';
  return `$${value.toFixed(2)}`;
}

/**
 * Format percentage
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get date range for time filter
 * @param timeRange - Time range selection
 * @returns Start date and end date
 */
export function getDateRange(
  timeRange: '7d' | '30d' | '3m' | '1y' | 'all'
): { startDate: Date | null; endDate: Date } {
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);

  let startDate: Date | null = null;

  switch (timeRange) {
    case '7d':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '30d':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '3m':
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '1y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'all':
      startDate = null; // No start date filter
      break;
  }

  return { startDate, endDate };
}

/**
 * Sort items by usage count
 * @param items - Array of items with usageCount
 * @param order - Sort order
 * @returns Sorted array
 */
export function sortByUsage<T extends { usageCount: number }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    return order === 'desc'
      ? b.usageCount - a.usageCount
      : a.usageCount - b.usageCount;
  });
}

/**
 * Sort items by CPW
 * @param items - Array of items with costPerWear
 * @param order - Sort order
 * @returns Sorted array
 */
export function sortByCPW<T extends { costPerWear: number }>(
  items: T[],
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    // Handle Infinity values (unused items)
    if (!isFinite(a.costPerWear) && !isFinite(b.costPerWear)) return 0;
    if (!isFinite(a.costPerWear)) return order === 'asc' ? 1 : -1;
    if (!isFinite(b.costPerWear)) return order === 'asc' ? -1 : 1;

    return order === 'asc'
      ? a.costPerWear - b.costPerWear
      : b.costPerWear - a.costPerWear;
  });
}

/**
 * Get top N items from array
 * @param items - Array of items
 * @param n - Number of items to return
 * @returns Top N items
 */
export function getTopN<T>(items: T[], n: number): T[] {
  return items.slice(0, n);
}

/**
 * Get bottom N items from array
 * @param items - Array of items
 * @param n - Number of items to return
 * @returns Bottom N items
 */
export function getBottomN<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  return items.slice(-n).reverse();
}
