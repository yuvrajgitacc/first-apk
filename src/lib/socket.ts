import { io } from "socket.io-client";
import { API_URL } from "./api";

const SOCKET_URL = API_URL;

export const socket = io(SOCKET_URL, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export const initSocket = () => {
    if (!socket.connected) {
        console.log("🔌 Initializing socket connection...");
        socket.connect();
    }
};