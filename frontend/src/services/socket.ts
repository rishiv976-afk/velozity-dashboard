import {
  io,
  type Socket,
} from "socket.io-client";

import { getAccessToken } from "./token";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "http://localhost:5000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,

      auth: {
        token: getAccessToken(),
      },
    });
  }

  return socket;
};

export const connectSocket = () => {
  const currentSocket =
    getSocket();

  currentSocket.auth = {
    token: getAccessToken(),
  };

  if (!currentSocket.connected) {
    currentSocket.connect();
  }

  return currentSocket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};