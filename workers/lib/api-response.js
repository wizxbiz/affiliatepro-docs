export function statusCodeToErrorCode(status) {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 429) return 'RATE_LIMITED';
  return status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED';
}

export async function normalizeJsonResponse(c, response) {
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('application/json')) return response;

  const data = await response.json().catch(() => null);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return c.json(data, response.status);
  }

  if (response.status >= 400) {
    const legacyError = data.error;
    const message = typeof legacyError === 'string'
      ? legacyError
      : legacyError?.message || data.message || 'Request failed';
    const code = legacyError?.code || statusCodeToErrorCode(response.status);
    return c.json({ status: 'error', error: { code, message } }, response.status);
  }

  if (data.status) return c.json(data, response.status);

  if (data.success === true) {
    const { success, ...rest } = data;
    return c.json({ status: 'success', ...rest }, response.status);
  }

  return c.json({ status: 'success', ...data }, response.status);
}