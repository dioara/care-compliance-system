export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Simple login redirect - no OAuth needed, uses traditional email/password login
export const getLoginUrl = () => {
  return "/login";
};
