"use client";

import { useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function GlobalChatNotifier() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSoundAtRef = useRef<number>(0);
  const prevRoomsRef = useRef<{[id: string]: string}>({}); // roomId -> lastMessage

  useEffect(() => {
    if (typeof window === 'undefined') return;
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.5;

    if (!db) return;
    const q = query(collection(db!, 'chatRooms'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        snapshot.forEach((doc) => {
          const data = doc.data() as any;
          const prev = prevRoomsRef.current[doc.id];
          if (prev && data.lastMessage && data.lastMessage !== prev) {
            // play sound (de-duped)
            const now = Date.now();
            if (now - lastSoundAtRef.current > 600) {
              lastSoundAtRef.current = now;
              audioRef.current?.play().catch(() => {});
            }
          }
          prevRoomsRef.current[doc.id] = data.lastMessage || '';
        });
      } catch (e) {
        console.error('GlobalChatNotifier snapshot error', e);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}
