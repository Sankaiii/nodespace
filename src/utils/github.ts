import type { FlowState } from '../types';

const BASE = 'https://api.github.com';
const REPO = 'nodespace-data';

async function api(token: string, path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`GitHub ${res.status}: ${err}`);
  }
  return res.json();
}

/* Encode UTF-8 → base64 (gère les accents, emoji, etc.) */
function b64encode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''));
}

function b64decode(str: string): string {
  const bin = atob(str.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* Récupère le profil GitHub de l'utilisateur */
export async function getUser(token: string): Promise<{ login: string; avatar_url: string }> {
  return api(token, '/user');
}

/* Crée le dépôt nodespace-data s'il n'existe pas */
export async function ensureRepo(token: string, username: string): Promise<void> {
  try {
    await api(token, `/repos/${username}/${REPO}`);
    return; // déjà existant
  } catch {
    /* n'existe pas encore, on le crée */
  }
  await api(token, '/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name: REPO,
      private: true,
      auto_init: true,
      description: '◈ NodeSpace — données générées automatiquement, ne pas modifier manuellement.',
    }),
  });
  /* Attendre que GitHub initialise le dépôt */
  await new Promise((r) => setTimeout(r, 2000));
}

/* Charge le canvas d'un profil depuis GitHub */
export async function loadCanvas(
  token: string,
  username: string,
  profileId: string
): Promise<{ flow: FlowState | null; sha: string | null }> {
  try {
    const res = await api(token, `/repos/${username}/${REPO}/contents/profiles/${profileId}/canvas.json`);
    const flow: FlowState = JSON.parse(b64decode(res.content));
    return { flow, sha: res.sha as string };
  } catch {
    return { flow: null, sha: null };
  }
}

/* Sauvegarde le canvas d'un profil sur GitHub (commit automatique) */
export async function saveCanvas(
  token: string,
  username: string,
  profileId: string,
  flow: FlowState,
  sha: string | null
): Promise<string | null> {
  const content = b64encode(JSON.stringify(flow, null, 2));
  const path = `profiles/${profileId}/canvas.json`;

  const res = await api(token, `/repos/${username}/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `feat(${profileId}): mise à jour du canvas`,
      content,
      ...(sha ? { sha } : {}),
    }),
  });

  return (res.content?.sha as string) ?? null;
}
