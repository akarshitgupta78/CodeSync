import { useEffect, useState, useRef, useMemo } from 'react';
import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { uint8ArrayToBase64, base64ToUint8Array } from '../utils/binary';

export interface PresenceUser {
  workspaceId: string;
  username: string;
  color: string;
}

export function useYjsProvider(workspaceId: string, username: string, userColor: string) {
  // Generate a unique session ID per tab/client instance so multiple tabs or users never self-ignore or drop
  const clientSessionId = useMemo(() => {
    return typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `client-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
  }, []);

  // Manage Y.Doc and Awareness scoped per workspaceId safely without state tears
  const docRef = useRef<Y.Doc>(new Y.Doc());
  const awarenessRef = useRef<Awareness>(new Awareness(docRef.current));
  const currentWorkspaceRef = useRef<string>(workspaceId);

  if (currentWorkspaceRef.current !== workspaceId) {
    docRef.current.destroy();
    awarenessRef.current.destroy();
    docRef.current = new Y.Doc();
    awarenessRef.current = new Awareness(docRef.current);
    currentWorkspaceRef.current = workspaceId;
  }

  const doc = docRef.current;
  const awareness = awarenessRef.current;

  const [synced, setSynced] = useState(false);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const stompClientRef = useRef<Client | null>(null);
  const outgoingQueueRef = useRef<{ destination: string; body: string }[]>([]);

  // Update local awareness user state whenever username or userColor updates
  useEffect(() => {
    awareness.setLocalStateField('user', {
      name: username,
      color: userColor,
    });
  }, [awareness, username, userColor]);

  // Ensure any leftover remote cursor styles element is removed
  useEffect(() => {
    const styleEl = document.getElementById('yjs-remote-cursor-styles');
    if (styleEl) {
      styleEl.remove();
    }
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    let isSubscribed = true;

    // 2. Set up STOMP over SockJS with factory providing a fresh connection per attempt
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      debug: () => {},
      reconnectDelay: 2000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClientRef.current = client;

    // Helper to flush any queued outgoing updates
    const flushQueue = () => {
      if (client.connected && outgoingQueueRef.current.length > 0) {
        while (outgoingQueueRef.current.length > 0) {
          const item = outgoingQueueRef.current.shift();
          if (item) {
            client.publish(item);
          }
        }
      }
    };

    client.onConnect = () => {
      if (!isSubscribed) return;

      // Subscribe to CRDT document updates & synchronization handshake
      client.subscribe(`/topic/workspace/${workspaceId}/sync`, (message) => {
        try {
          const payload = JSON.parse(message.body);

          // Ignore echoes sent by this client instance
          if (payload.senderSessionId && payload.senderSessionId === clientSessionId) {
            return;
          }

          // Case A: A newly connected peer is requesting catch-up diff (Sync Step 1)
          if (payload.type === 'sync-step-1' && payload.stateVector) {
            const peerVector = base64ToUint8Array(payload.stateVector);
            const diffUpdate = Y.encodeStateAsUpdate(doc, peerVector);
            if (diffUpdate.byteLength > 0) {
              client.publish({
                destination: `/app/workspace/${workspaceId}/sync`,
                body: JSON.stringify({
                  type: 'sync-step-2',
                  docName: 'main',
                  senderSessionId: clientSessionId,
                  targetSessionId: payload.senderSessionId,
                  senderId: username,
                  update: uint8ArrayToBase64(diffUpdate),
                }),
              });
            }
            return;
          }

          // Case B: Response to Sync Step 1 targeted to this client (Sync Step 2)
          if (payload.type === 'sync-step-2') {
            if (!payload.targetSessionId || payload.targetSessionId === clientSessionId) {
              if (payload.update) {
                const updateBytes = base64ToUint8Array(payload.update);
                Y.applyUpdate(doc, updateBytes, 'remote');
              }
            }
            return;
          }

          // Case C: Standard real-time incremental edit from collaborators
          if (payload.update) {
            const updateBytes = base64ToUint8Array(payload.update);
            Y.applyUpdate(doc, updateBytes, 'remote');
          }
        } catch (e) {
          console.error('Error handling sync message:', e);
        }
      });

      // Subscribe to Yjs Awareness updates (presence/selection)
      client.subscribe(`/topic/workspace/${workspaceId}/awareness`, (message) => {
        try {
          const payload = JSON.parse(message.body);
          if (payload.senderSessionId !== clientSessionId && payload.update) {
            const bytes = base64ToUint8Array(payload.update);
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

      // Step 1: Send current state vector to peers so any active collaborator sends missing deltas
      const stateVector = Y.encodeStateVector(doc);
      client.publish({
        destination: `/app/workspace/${workspaceId}/sync`,
        body: JSON.stringify({
          type: 'sync-step-1',
          docName: 'main',
          senderSessionId: clientSessionId,
          senderId: username,
          stateVector: uint8ArrayToBase64(stateVector),
        }),
      });

      // Broadcast initial awareness state
      const initialAwarenessUpdate = encodeAwarenessUpdate(awareness, [awareness.clientID]);
      client.publish({
        destination: `/app/workspace/${workspaceId}/awareness`,
        body: JSON.stringify({
          senderSessionId: clientSessionId,
          senderId: username,
          update: uint8ArrayToBase64(initialAwarenessUpdate),
        }),
      });

      // Flush any queued updates immediately
      flushQueue();
    };

    // 1. Fetch initial snapshot and trailing incremental updates from backend FIRST
    fetch(`/api/workspaces/${workspaceId}/snapshot?docName=main`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
    })
      .then((res) => (res.status === 200 ? res.json() : null))
      .then((data) => {
        if (!isSubscribed || !data) return;

        // Apply saved snapshot if available
        if (data.yjsStateBase64) {
          try {
            const binary = base64ToUint8Array(data.yjsStateBase64);
            if (binary.byteLength > 4) {
              Y.applyUpdate(doc, binary, 'initial-sync');
            }
          } catch (e) {
            console.error('Error applying base snapshot update:', e);
          }
        }

        // Apply subsequent incremental updates if available
        if (Array.isArray(data.updatesBase64)) {
          for (const updateStr of data.updatesBase64) {
            try {
              const binary = base64ToUint8Array(updateStr);
              if (binary.byteLength > 0) {
                Y.applyUpdate(doc, binary, 'initial-sync');
              }
            } catch (e) {
              console.error('Error applying incremental update from server:', e);
            }
          }
        }
      })
      .catch((err) => console.warn('Snapshot fetch skipped:', err))
      .finally(() => {
        if (isSubscribed) {
          setSynced(true);
          // Activate WebSocket after document is hydrated with backend snapshot
          client.activate();
        }
      });

    // Periodic queue check to guarantee zero stranded messages
    const queueInterval = setInterval(flushQueue, 250);

    // 3. Listen to local document updates and publish delta immediately
    const handleDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin !== 'remote' && origin !== 'initial-sync') {
        const base64Update = uint8ArrayToBase64(update);
        const payload = {
          type: 'update',
          docName: 'main',
          senderSessionId: clientSessionId,
          senderId: username,
          update: base64Update,
        };

        if (client.connected) {
          client.publish({
            destination: `/app/workspace/${workspaceId}/sync`,
            body: JSON.stringify(payload),
          });
        } else {
          outgoingQueueRef.current.push({
            destination: `/app/workspace/${workspaceId}/sync`,
            body: JSON.stringify(payload),
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
        const base64Update = uint8ArrayToBase64(update);

        if (client.connected) {
          client.publish({
            destination: `/app/workspace/${workspaceId}/awareness`,
            body: JSON.stringify({
              senderSessionId: clientSessionId,
              senderId: username,
              update: base64Update,
            }),
          });
        }
      }
    };

    awareness.on('update', handleAwarenessUpdate);

    return () => {
      isSubscribed = false;
      clearInterval(queueInterval);
      doc.off('update', handleDocUpdate);
      awareness.off('update', handleAwarenessUpdate);
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      outgoingQueueRef.current = [];
    };
  }, [workspaceId, username, userColor, doc, awareness, clientSessionId]);

  return { doc, awareness, synced, presenceUsers, stompClient: stompClientRef.current };
}
