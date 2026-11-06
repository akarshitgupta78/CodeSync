import { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface PresenceUser {
  workspaceId: string;
  username: string;
  color: string;
}

export function useYjsProvider(workspaceId: string, username: string, userColor: string) {
  const docRef = useRef<Y.Doc | null>(null);
  if (!docRef.current) {
    docRef.current = new Y.Doc();
  }
  const doc = docRef.current;

  const awarenessRef = useRef<Awareness | null>(null);
  if (!awarenessRef.current) {
    awarenessRef.current = new Awareness(doc);
  }
  const awareness = awarenessRef.current;

  const [synced, setSynced] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const stompClientRef = useRef<Client | null>(null);

  // Update local awareness user state whenever username or userColor updates
  useEffect(() => {
    awareness.setLocalStateField('user', {
      name: username,
      color: userColor,
    });
  }, [awareness, username, userColor]);

  // Inject dynamic styles for collaborator cursors and selection highlights
  useEffect(() => {
    let styleEl = document.getElementById('yjs-remote-cursor-styles') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'yjs-remote-cursor-styles';
      document.head.appendChild(styleEl);
    }

    const updateCursorStyles = () => {
      const states = awareness.getStates();
      let css = '';
      states.forEach((state: any, clientId: number) => {
        if (state.user && state.user.color) {
          const color = state.user.color;
          const name = state.user.name || 'Collaborator';
          css += `
            .yRemoteSelection-${clientId} {
              background-color: ${color}33 !important;
            }
            .yRemoteSelectionHead-${clientId} {
              position: absolute;
              border-left: 2px solid ${color} !important;
              border-top: 2px solid ${color} !important;
              border-bottom: 2px solid ${color} !important;
              height: 100%;
              box-sizing: border-box;
            }
            .yRemoteSelectionHead-${clientId}::after {
              position: absolute;
              content: '${name}';
              top: -16px;
              left: -2px;
              font-size: 10px;
              font-family: inherit;
              font-weight: 600;
              line-height: 12px;
              background-color: ${color};
              color: #ffffff;
              padding: 1px 4px;
              border-radius: 3px;
              white-space: nowrap;
              pointer-events: none;
              z-index: 10;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            }
          `;
        }
      });
      if (styleEl) {
        styleEl.innerHTML = css;
      }
    };

    awareness.on('change', updateCursorStyles);
    updateCursorStyles();

    return () => {
      awareness.off('change', updateCursorStyles);
    };
  }, [awareness]);

  useEffect(() => {
    if (!workspaceId) return;

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

      // Subscribe to Yjs Awareness updates (remote cursors & selections)
      client.subscribe(`/topic/workspace/${workspaceId}/awareness`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.senderId !== username && payload.update) {
            const bytes = Uint8Array.from(atob(payload.update), (c) => c.charCodeAt(0));
            applyAwarenessUpdate(awareness, bytes, 'remote');
          }
        } catch (e) {
          console.error('Error applying remote awareness update:', e);
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

      // Broadcast initial awareness state
      const initialAwarenessUpdate = encodeAwarenessUpdate(awareness, [awareness.clientID]);
      client.publish({
        destination: `/app/workspace/${workspaceId}/awareness`,
        body: JSON.stringify({
          senderId: username,
          update: btoa(String.fromCharCode(...initialAwarenessUpdate)),
        }),
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

    // 4. Listen to local awareness changes and broadcast them
    const handleAwarenessUpdate = ({ added, updated, removed }: any, origin: any) => {
      if (origin !== 'remote') {
        const changedClients = added.concat(updated, removed);
        const update = encodeAwarenessUpdate(awareness, changedClients);
        const base64Update = btoa(String.fromCharCode(...update));
        if (client.connected) {
          client.publish({
            destination: `/app/workspace/${workspaceId}/awareness`,
            body: JSON.stringify({
              senderId: username,
              update: base64Update,
            }),
          });
        }
      }
    };

    awareness.on('update', handleAwarenessUpdate);

    return () => {
      doc.off('update', handleDocUpdate);
      awareness.off('update', handleAwarenessUpdate);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [workspaceId, username, userColor, doc, awareness]);

  return { doc, awareness, synced, presenceUsers, stompClient: stompClientRef.current };
}
