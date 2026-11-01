import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useWebSockets(workspaceId: string) {
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    const socket = new SockJS('/ws');
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [workspaceId]);

  const sendCursor = useCallback((position: { lineNumber: number; column: number }, username: string, color: string) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination: `/app/workspace/${workspaceId}/cursor`,
        body: JSON.stringify({ position, username, color }),
      });
    }
  }, [workspaceId]);

  return { connected, sendCursor, client: stompClientRef.current };
}
