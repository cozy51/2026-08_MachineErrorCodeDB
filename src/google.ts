import { normalizeRecord, type ErrorCode, type SyncMeta } from './types';

const FILE = 'MachineErrorCodeDB-latest.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client';

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type OAuthError = {
  type?: string;
};

type TokenClient = {
  requestAccessToken: (options?: { prompt?: string }) => void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback: (error: OAuthError) => void;
          }) => TokenClient;
          revoke: (token: string, callback: () => void) => void;
        };
      };
    };
  }
}

let token = '';
let scriptPromise: Promise<void> | undefined;

function googleOAuthIsReady() {
  return Boolean(window.google?.accounts?.oauth2);
}

function loadScript() {
  if (googleOAuthIsReady()) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`);
    const script = existing ?? document.createElement('script');

    const loaded = () => {
      if (googleOAuthIsReady()) resolve();
      else reject(new Error('Google認証を初期化できませんでした。ページを再読み込みしてください。'));
    };
    const failed = () => reject(new Error('Google認証の読み込みに失敗しました。通信環境を確認してください。'));

    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
    if (!existing) {
      script.src = GOOGLE_IDENTITY_SCRIPT;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    scriptPromise = undefined;
    throw error;
  });

  return scriptPromise;
}

/** Preload GIS so the login popup can be opened directly from the user's click. */
export function prepareGoogleLogin() {
  return loadScript();
}

function popupErrorMessage(type?: string) {
  if (type === 'popup_failed_to_open') return 'Googleログイン画面を開けませんでした。ポップアップを許可して、もう一度お試しください。';
  if (type === 'popup_closed') return 'Googleログインがキャンセルされました。';
  return 'Googleログインに失敗しました。もう一度お試しください。';
}

export async function login() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) throw new Error('Googleログインが設定されていません（VITE_GOOGLE_CLIENT_ID）。');

  await loadScript();
  return new Promise<void>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || `Googleログインに失敗しました（${response.error}）。`));
          return;
        }
        if (!response.access_token) {
          reject(new Error('Googleからアクセストークンを取得できませんでした。'));
          return;
        }
        token = response.access_token;
        resolve();
      },
      error_callback: (error) => reject(new Error(popupErrorMessage(error.type))),
    });

    client.requestAccessToken();
  });
}

export function logout() {
  if (token) window.google?.accounts.oauth2.revoke(token, () => {});
  token = '';
}

async function api(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...init?.headers } });
  if (!response.ok) throw new Error(`Google Drive API エラー (${response.status})`);
  return response;
}

export async function findFile() {
  const q = encodeURIComponent(`name='${FILE}' and trashed=false`);
  const response = await api(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,modifiedTime)&spaces=drive`);
  return ((await response.json()).files as { id: string; modifiedTime: string }[])[0];
}

export async function download() {
  const file = await findFile();
  if (!file) throw new Error(`${FILE} が見つかりません`);
  const response = await api(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`);
  const data = await response.json() as Partial<ErrorCode>[];
  return { records: data.map(normalizeRecord), meta: { fileId: file.id, cloudModifiedTime: file.modifiedTime, lastSyncedAt: new Date().toISOString() } as SyncMeta };
}

export async function upload(records: ErrorCode[], meta: SyncMeta) {
  const current = await findFile();
  if (current && !meta.cloudModifiedTime) throw new Error('クラウドに原本があります。上書き防止のため、先に「クラウドから取得」を実行してください。');
  if (current && current.modifiedTime !== meta.cloudModifiedTime) throw new Error('別の端末でクラウドが更新されています。先に「クラウドから取得」を実行してください。');
  const body = JSON.stringify(records, null, 2);
  let response: Response;
  if (current) {
    response = await api(`https://www.googleapis.com/upload/drive/v3/files/${current.id}?uploadType=media&fields=id,modifiedTime`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
  } else {
    const boundary = 'machine-error-boundary';
    const multipart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE, mimeType: 'application/json' })}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${boundary}--`;
    response = await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime', { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body: multipart });
  }
  const file = await response.json();
  return { fileId: file.id, cloudModifiedTime: file.modifiedTime, lastSyncedAt: new Date().toISOString() } as SyncMeta;
}
