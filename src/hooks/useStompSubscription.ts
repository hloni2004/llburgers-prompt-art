import { useEffect, useRef } from 'react';
import { registerTopicCallback } from '@/lib/stomp';

/**
 * Subscribes to a STOMP topic for the lifetime of the component.
 *
 * The latest `onMessage` reference is always used (via a ref),
 * so the caller does not need to memoize it.
 *
 * @param topic     STOMP destination, e.g. '/topic/orders'
 * @param onMessage Called with the parsed JSON payload on every message
 */
export function useStompSubscription<T>(
  topic: string,
  onMessage: (payload: T) => void,
): void {
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    const stableCallback = (data: unknown) => callbackRef.current(data as T);
    const unregister = registerTopicCallback(topic, stableCallback);
    return unregister;
  }, [topic]);
}
