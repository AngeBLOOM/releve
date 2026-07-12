'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function useSocket(): Socket | null {
  const ref = useRef<Socket | null>(null);

  useEffect(() => {
    if (!socketInstance) {
      const token = document.cookie
        .split('; ')
        .find(r => r.startsWith('auth_token='))
        ?.split('=')[1];

      socketInstance = io(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001', {
        withCredentials: true,
        transports: ['websocket'],
        auth: { token },
      });
    }
    ref.current = socketInstance;
  }, []);

  return ref.current;
}
