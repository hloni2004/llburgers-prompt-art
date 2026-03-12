/**
 * Module-level singleton STOMP client over SockJS.
 *
 * One WebSocket connection is shared across the whole app.
 * Consumers call `registerTopicCallback(topic, fn)` which returns an unregister fn.
 *
 * Authentication: Call `setStompToken(token)` to include the JWT in CONNECT headers.
 * This enables server-side validation of WebSocket connections.
 */

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080';

type MessageCallback = (payload: unknown) => void;

// topic → set of callbacks registered by React components
const _callbacks = new Map<string, Set<MessageCallback>>();

// topic → active STOMP subscription handle
const _stompSubs = new Map<string, { unsubscribe: () => void }>();

let _client: Client | null = null;
let _accessToken: string | null = null;

/**
 * Set the access token to include in STOMP CONNECT headers.
 * Call this when user logs in/out or token refreshes.
 * If the connection is already active, it will be reactivated with the new token.
 */
export function setStompToken(token: string | null): void {
  _accessToken = token;
  if (_client) {
    // Reconnect with new credentials
    _client.deactivate();
    _client.activate();
  }
}

function dispatchToTopic(topic: string, body: string): void {
  try {
    const data = JSON.parse(body);
    _callbacks.get(topic)?.forEach(cb => cb(data));
  } catch {
    // non-JSON frame — ignore
  }
}

function subscribeTopicOnClient(topic: string): void {
  if (!_client || _stompSubs.has(topic)) return;
  const sub = _client.subscribe(topic, frame =>
    dispatchToTopic(topic, frame.body),
  );
  _stompSubs.set(topic, { unsubscribe: () => sub.unsubscribe() });
}

function getClient(): Client {
  if (_client) return _client;

  _client = new Client({
    webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
    connectHeaders: _accessToken ? { Authorization: `Bearer ${_accessToken}` } : {},
    reconnectDelay: 5000,
    // Update headers on each reconnect attempt
    beforeConnect: () => {
      if (_client && _accessToken) {
        _client.connectHeaders = { Authorization: `Bearer ${_accessToken}` };
      } else if (_client) {
        _client.connectHeaders = {};
      }
    },
    onConnect: () => {
      // On (re)connect, create STOMP subscriptions for all tracked topics.
      _stompSubs.clear(); // old handles are invalid after reconnect
      _callbacks.forEach((cbs, topic) => {
        if (cbs.size > 0) subscribeTopicOnClient(topic);
      });
    },
    onDisconnect: () => {
      _stompSubs.clear();
    },
    onStompError: () => {
      _stompSubs.clear();
    },
  });

  _client.activate();
  return _client;
}

/**
 * Register a callback for a STOMP topic.
 * @returns An unregister function — call it (e.g. in useEffect cleanup) to stop receiving messages.
 */
export function registerTopicCallback(
  topic: string,
  callback: MessageCallback,
): () => void {
  if (!_callbacks.has(topic)) {
    _callbacks.set(topic, new Set());
  }
  _callbacks.get(topic)!.add(callback);

  const c = getClient();

  // If already connected and not yet subscribed, subscribe immediately.
  if (c.connected && !_stompSubs.has(topic)) {
    subscribeTopicOnClient(topic);
  }

  return () => {
    _callbacks.get(topic)?.delete(callback);
    if (_callbacks.get(topic)?.size === 0) {
      _callbacks.delete(topic);
      _stompSubs.get(topic)?.unsubscribe();
      _stompSubs.delete(topic);
    }
  };
}
