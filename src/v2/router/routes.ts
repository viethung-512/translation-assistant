/** All v2 route path constants. Use these everywhere — never hardcode strings. */
export const ROUTES = {
  MAIN: "/",
  HISTORY: "/history",
  DETAIL: "/detail",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
