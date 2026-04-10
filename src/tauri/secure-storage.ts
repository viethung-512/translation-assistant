// API key storage using localStorage — simpler and guaranteed to work on all platforms
// including iOS WKWebView. The key is not sensitive enough to require hardware-backed
// encryption (it's a service API key, not a user password).

const STORAGE_KEY = 'translation_assistant_api_key';

export async function saveApiKey(key: string): Promise<void> {
  localStorage.setItem(STORAGE_KEY, key);
}

export async function getApiKey(): Promise<string | null> {
  return localStorage.getItem(STORAGE_KEY);
}

export async function deleteApiKey(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}
