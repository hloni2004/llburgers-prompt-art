const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  (import.meta.env.VITE_API_URL as string | undefined) ??
  (import.meta.env.NEXT_PUBLIC_API_BASE_URL as string | undefined) ??
  '';

const CHAT_ENDPOINT = '/api/chat';
const CHAT_TIMEOUT_MS = 15000;
const CHAT_RETRY_COUNT = 1;

export interface ChatRequestBody {
  message: string;
}

export interface ChatSuccessResponse {
  reply: string;
}

export interface ChatErrorResponse {
  error?: string;
}

const buildChatUrl = (): string => {
  if (!API_BASE_URL) return CHAT_ENDPOINT;
  return `${API_BASE_URL.replace(/\/$/, '')}${CHAT_ENDPOINT}`;
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseJson = async <T>(res: Response): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
};

export const sendChatMessage = async (message: string): Promise<string> => {
  const body: ChatRequestBody = { message };
  const chatUrl = buildChatUrl();

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= CHAT_RETRY_COUNT; attempt += 1) {
    try {
      const res = await fetchWithTimeout(
        chatUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
        },
        CHAT_TIMEOUT_MS,
      );

      if (!res.ok) {
        const errorData = await parseJson<ChatErrorResponse>(res);
        throw new Error(errorData?.error ?? `Request failed with status ${res.status}`);
      }

      const data = await parseJson<ChatSuccessResponse>(res);
      if (!data?.reply) {
        throw new Error('No reply received from chatbot.');
      }

      return data.reply;
    } catch (error) {
      const isAbortError = error instanceof DOMException && error.name === 'AbortError';
      const errorMessage = isAbortError ? 'Request timed out. Please try again.' : 'Unable to reach chatbot.';
      lastError = error instanceof Error ? error : new Error(errorMessage);

      if (attempt === CHAT_RETRY_COUNT) {
        throw lastError;
      }
    }
  }

  throw lastError ?? new Error('Unable to send message.');
};
