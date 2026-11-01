import React, { createContext, useContext } from 'react';
import { useWebSockets } from '../hooks/useWebSockets';

interface WebSocketContextType {
  connected: boolean;
  sendCursor: (pos: { lineNumber: number; column: number }, username: string, color: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ workspaceId: string; children: React.ReactNode }> = ({
  workspaceId,
  children,
}) => {
  const ws = useWebSockets(workspaceId);

  return (
    <WebSocketContext.Provider value={{ connected: ws.connected, sendCursor: ws.sendCursor }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketState = () => {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocketState must be used within a WebSocketProvider');
  return context;
};
