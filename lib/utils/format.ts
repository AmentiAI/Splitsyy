/**
 * Formatting Utilities
 */

/**
 * Format amount in cents to currency string
 */
export function formatCurrency(
  amountInCents: number,
  currency: string = "USD"
): string {
  const amount = amountInCents / 100;
  
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  
  return formatDate(then);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Parse cents to dollars (for input fields)
 */
export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Parse dollars to cents (from input fields)
 */
export function dollarsToCents(dollars: string | number): number {
  const amount = typeof dollars === "string" ? parseFloat(dollars) : dollars;
  return Math.round(amount * 100);
}

/**
 * Shorten text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Format card number (show last 4 digits)
 */
export function formatCardNumber(last4: string): string {
  return `•••• ${last4}`;
}

/**
 * Get role badge color
 */
export function getRoleColor(role: string): "default" | "info" | "success" {
  switch (role) {
    case "owner":
      return "success";
    case "admin":
      return "info";
    default:
      return "default";
  }
}

/**
 * Get status badge variant
 */
export function getStatusVariant(status: string): "default" | "success" | "warning" | "danger" {
  switch (status.toLowerCase()) {
    case "succeeded":
    case "active":
    case "open":
      return "success";
    case "pending":
      return "warning";
    case "failed":
    case "closed":
    case "suspended":
      return "danger";
    default:
      return "default";
  }
}

