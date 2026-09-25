import type { Server } from "socket.io";

let ioInstance: Server | null = null;

export const setSocketIO = (io: Server) => {
  ioInstance = io;
};

export const getSocketIO = (): Server => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized");
  }

  return ioInstance;
};