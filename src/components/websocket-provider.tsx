"use client";

import { createContext, useContext, useEffect, useState, useCallback, type PropsWithChildren } from "react";
import { WhopClientSdk, type WhopWebsocketClientBrowser, type WebsocketStatus } from "@whop/api";

interface WebsocketMessage {
  type: string;
  data: unknown;
}

interface WebsocketContextType {
  isConnected: boolean;
  sendMessage: (message: WebsocketMessage) => void;
  connectionStatus: WebsocketStatus;
}

const WebsocketContext = createContext<WebsocketContextType>({
  isConnected: false,
  sendMessage: () => {},
  connectionStatus: "disconnected",
});

export function useWebsocket() {
  return useContext(WebsocketContext);
}

interface WebsocketProviderProps extends PropsWithChildren {
  experienceId: string;
  onMessage?: (message: unknown) => void;
}

export function WebsocketProvider({ children, experienceId, onMessage }: WebsocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebsocketStatus>("disconnected");
  const [websocket, setWebsocket] = useState<WhopWebsocketClientBrowser | null>(null);

  const sendMessage = useCallback((message: WebsocketMessage) => {
    if (websocket && isConnected) {
      // use the whop websocket broadcast method as shown in their docs
      websocket.broadcast({
        message: JSON.stringify(message),
        target: "everyone",
      });
      console.log('📤 websocket message sent:', message);
    } else {
      console.warn('⚠️ websocket not connected, cannot send message:', message);
    }
  }, [websocket, isConnected]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    try {
      console.log('🔌 initializing whop websocket client for experience:', experienceId);
      
      // create the whop websocket client as shown in the docs
      const whopApi = WhopClientSdk();
      const ws = whopApi.websocketClient({
        joinExperience: experienceId,
      });
      
      // set up event handlers as shown in whop docs
      ws.on("connectionStatus", (status) => {
        console.log("websocket status:", status);
        setConnectionStatus(status);
        setIsConnected(status === "connected");
      });
      
      ws.on("connect", () => {
        console.log("✅ websocket connected to experience:", experienceId);
        setIsConnected(true);
      });
      
      ws.on("disconnect", () => {
        console.log("❌ websocket disconnected");
        setIsConnected(false);
      });
      
      if (onMessage) {
        ws.on("appMessage", (message) => {
          console.log("📨 received app message:", message);
          onMessage(message);
        });
      }
      
      setWebsocket(ws);
      
      // connect to websocket
      cleanup = ws.connect();
      console.log('🚀 websocket connection initiated');
      
    } catch (error) {
      console.error('💥 websocket initialization failed:', error);
      setConnectionStatus("disconnected");
      setIsConnected(false);
    }
    
    return () => {
      console.log('🧹 cleaning up websocket connection');
      if (cleanup) {
        cleanup();
      }
      setWebsocket(null);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };
  }, [experienceId, onMessage]);

  return (
    <WebsocketContext.Provider value={{ isConnected, sendMessage, connectionStatus }}>
      {children}
    </WebsocketContext.Provider>
  );
} 