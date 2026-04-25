import { createContext, useContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import API from "../api";

const AuthContext = createContext();

// Global socket instance
let socket = null;

export function getSocket() {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || "http://localhost:5000";
    socket = io(socketUrl, { autoConnect: false });
  }
  return socket;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));

  // Sync user from DB on app load so avatar/name are always fresh
  useEffect(() => {
    if (!token) return;
    API.get("/auth/me").then(({ data }) => {
      const fresh = { id: data._id, name: data.name, email: data.email, role: data.role, avatar: data.avatar || null, phone: data.phone || null };
      localStorage.setItem("user", JSON.stringify(fresh));
      setUser(fresh);
    }).catch(() => {});
  }, [token]);

  // Handle socket connection based on authentication status
  useEffect(() => {
    const socket = getSocket();

    if (user?.id) {
      // User is logged in - connect socket and emit join
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("join", user.id.toString());
      console.log("User logged in, socket connected:", user.id);
    } else {
      // User is logged out - disconnect socket
      if (socket.connected) {
        socket.disconnect();
        console.log("User logged out, socket disconnected");
      }
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect on unmount, only on logout
    };
  }, [user]);

  const login = (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    localStorage.setItem("user", JSON.stringify(merged));
    setUser(merged);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
