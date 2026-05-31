export async function getAuthToken(): Promise<string> {
  const res = await fetch("/api/auth/token");
  if (!res.ok) throw new Error("Not authenticated");
  const data = (await res.json()) as { token: string };
  return data.token;
}
