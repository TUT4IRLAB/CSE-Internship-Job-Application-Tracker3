
const API =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = sessionStorage.getItem('careertrack_token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    sessionStorage.removeItem('careertrack_token');
    sessionStorage.removeItem('careertrack_user');

    window.dispatchEvent(new Event('careertrack-logout'));
  }

  return response;
}
