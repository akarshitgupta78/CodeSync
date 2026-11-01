import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface PresenceUser {
  workspaceId: string;
  username: string;
  color: string;
}

export function useYjsProvider(workspaceId: string, username: string, userColor: string) {
  const [doc] = useState(() => new Y.Doc());
  const [synced, setSynced] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const stompClientRef = useRef<Client | null>(null);

  useEffect(() => {
    // 1. Fetch initial snapshot from backend REST API if available
    fetch(`/api/workspaces/${workspaceId}/snapshot?docName=main`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then((res) => (res.status === 200 ? res.json() : null))
      .then((data) => {
        if (data && data.yjsStateBase64) {
          const binary = Uint8Array.from(atob(data.yjsStateBase64), (c) => c.charCodeAt(0));
          Y.applyUpdate(doc, binary, 'initial-sync');
        }
      })
      .catch((err) => console.warn('Snapshot fetch skipped:', err))
      .finally(() => setSynced(true));

    // 2. Set up STOMP over SockJS
    const socket = new SockJS('/ws');
    const client = new Client({
      webSocketFactory: () => socket as any,
      debug: () => {},
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClientRef.current = client;

    client.onConnect = () => {
      // Subscribe to CRDT document updates
      client.subscribe(`/topic/workspace/${workspaceId}/sync`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.senderId !== username && payload.update) {
            const updateBytes = Uint8Array.from(atob(payload.update), (c) => c.charCodeAt(0));
            Y.applyUpdate(doc, updateBytes, 'remote');
          }
        } catch (e) {
          console.error('Error applying remote Yjs update:', e);
        }
      });

      // Subscribe to Presence updates
      client.subscribe(`/topic/workspace/${workspaceId}/presence`, (message) => {
        try {
          const users: PresenceUser[] = JSON.parse(message.body);
          setPresenceUsers(users);
        } catch (e) {
          console.error('Error parsing presence:', e);
        }
      });

      // Announce arrival in workspace
      client.publish({
        destination: `/app/workspace/${workspaceId}/join`,
        body: JSON.stringify({ username, color: userColor }),
      });
    };

    client.activate();

    // 3. Listen to local document updates and publish delta to STOMP
    const handleDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && origin !== 'initial-sync') {
        const base64Update = btoa(String.fromCharCode(...update));
        if (client.connected) {
          client.publish({
            destination: `/app/workspace/${workspaceId}/sync`,
            body: JSON.stringify({
              docName: 'main',
              senderId: username,
              update: base64Update,
            }),
          });
        }
      }
    };

    doc.on('update', handleDocUpdate);

    return () => {
      doc.off('update', handleDocUpdate);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      doc.destroy();
    };
  }, [workspaceId, username, userColor]);

  return { doc, synced, presenceUsers, stompClient: stompClientRef.current };
}
