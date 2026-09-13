const LOOKUP_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:lookup';

/**
 * Verifies a Firebase ID token against the Firebase Auth REST API and
 * confirms it belongs to the expected uid.
 *
 * Uses the public web API key (allowed for identity lookups). If no key is
 * configured (local dev without env), verification is skipped so the app
 * still runs.
 */
export async function verifyIdToken(
  idToken: string | undefined,
  expectedUid: string | undefined,
): Promise<boolean> {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  if (!apiKey) return true;

  if (!idToken || !expectedUid) return false;

  try {
    const res = await fetch(`${LOOKUP_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { users?: { localId?: string }[] };
    return data.users?.[0]?.localId === expectedUid;
  } catch {
    return false;
  }
}

export function checkAuthEnv(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  );
}