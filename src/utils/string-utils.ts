/**
 * Utility functions for string operations
 */

/**
 * Masks an email address for privacy by showing only the first character
 * and the domain part, replacing the rest with asterisks
 *
 * Example: john.doe@example.com -> joh****@example.com
 *
 * @param email - The email address to mask
 * @returns The masked email address
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) {
    return email;
  }

  const [localPart, domainPart] = email.split("@");

  if (localPart.length <= 1) {
    return email;
  }

  const firstThreeChars =
    localPart.length >= 3 ? localPart.substring(0, 3) : localPart;
  const maskedLocalPart =
    firstThreeChars +
    "*".repeat(Math.min(localPart.length - firstThreeChars.length, 4));

  return `${maskedLocalPart}@${domainPart}`;
}
