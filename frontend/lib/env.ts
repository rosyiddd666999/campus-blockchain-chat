/**
 * Centralize frontend env reads.
 * Keep it Sepolia-only; addresses are provided via NEXT_PUBLIC_* vars.
 */

export const CAMPUS_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
