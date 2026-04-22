/** All v2 route path constants. Use these everywhere — never hardcode strings. */
export const ROUTES = {
  MAIN: "/",
  HISTORY: "/history",
  DETAIL: "/detail/:historyId",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export function detailPath(historyId: string): string {
  return `/detail/${historyId}`;
}
