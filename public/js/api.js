async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '오류가 발생했습니다.');
  return data;
}

async function requireLogin() {
  try {
    return await apiFetch('/api/auth/me');
  } catch {
    location.href = '/login.html';
    return null;
  }
}
