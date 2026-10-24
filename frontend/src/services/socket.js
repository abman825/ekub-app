import { io } from 'socket.io-client';

const SOCKET_URL = 'https://ekub-app.onrender.com';

export const socket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
  withCredentials: true,
  autoConnect: true
});