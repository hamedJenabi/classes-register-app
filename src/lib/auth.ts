export const adminSessionCookieName = "bdv_admin_session";

export function getAdminSessionToken() {
  return process.env.ADMIN_SESSION_TOKEN;
}

export function isAdminSessionToken(value: string | undefined) {
  const expectedToken = getAdminSessionToken();

  return Boolean(expectedToken && value && value === expectedToken);
}

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD;
}

export function getAdminLoginToken() {
  return process.env.ADMIN_LOGIN_TOKEN;
}

export function isAdminLoginToken(value: string | undefined) {
  const expectedToken = getAdminLoginToken();

  return Boolean(expectedToken && value && value === expectedToken);
}
