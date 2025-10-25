"use client";

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, Eye, EyeOff, Volume2, VolumeX, RefreshCw } from 'lucide-react';

interface DebugEvent {
  id: string;
  timestamp: Date;
  type: 'bookings' | 'services' | 'chats';
  changeType: 'added' | 'modified' | 'removed';
  docId: string;
  data: any;
  source: string;
  notificationTriggered: boolean;
}

export default function NotificationDebugger() {
  const [isVisible, setIsVisible] = useState(false);
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [maxEvents, setMaxEvents] = useState(50);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenersRef = useRef<(() => void)[]>([]);
  const initialLoadFlags = useRef({
    bookings: true,
    services: true,
    chats: true
  });

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.2;

    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const addEvent = (event: Omit<DebugEvent, 'id' | 'timestamp'>) => {
    const newEvent: DebugEvent = {
      ...event,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, maxEvents - 1)]);
    
    // Play sound if notification would be triggered
    if (event.notificationTriggered && soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  };

  const startListening = () => {
    if (!db) {
      console.error("Firebase not initialized");
      return;
    }

    // Reset initial load flags
    initialLoadFlags.current = {
      bookings: true,
      services: true,
      chats: true
    };

    // Clear existing listeners
    listenersRef.current.forEach(unsubscribe => unsubscribe());
    listenersRef.current = [];

    // Listen to bookings
    const bookingsRef = collection(db, "bookings");
    const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"));
    
    const bookingsUnsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const source = snapshot.metadata.fromCache ? "cache" : "server";
      
      if (initialLoadFlags.current.bookings) {
        initialLoadFlags.current.bookings = false;
        addEvent({
          type: 'bookings',
          changeType: 'added',
          docId: 'initial-load',
          data: { count: snapshot.docs.length },
          source: source,
          notificationTriggered: false
        });
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const shouldNotify = change.type === 'added' || change.type === 'modified';
        
        addEvent({
          type: 'bookings',
          changeType: change.type,
          docId: change.doc.id,
          data: change.doc.data(),
          source: source,
          notificationTriggered: shouldNotify
        });
      });
    });

    // Listen to services
    const servicesRef = collection(db, "services");
    const servicesQuery = query(servicesRef, orderBy("createdAt", "desc"));
    
    const servicesUnsubscribe = onSnapshot(servicesQuery, (snapshot) => {
      const source = snapshot.metadata.fromCache ? "cache" : "server";
      
      if (initialLoadFlags.current.services) {
        initialLoadFlags.current.services = false;
        addEvent({
          type: 'services',
          changeType: 'added',
          docId: 'initial-load',
          data: { count: snapshot.docs.length },
          source: source,
          notificationTriggered: false
        });
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const shouldNotify = change.type === 'added' || change.type === 'modified';
        
        addEvent({
          type: 'services',
          changeType: change.type,
          docId: change.doc.id,
          data: change.doc.data(),
          source: source,
          notificationTriggered: shouldNotify
        });
      });
    });

    // Listen to chats
    const chatsRef = collection(db, "chats");
    const chatsQuery = query(chatsRef, orderBy("createdAt", "desc"));
    
    const chatsUnsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      const source = snapshot.metadata.fromCache ? "cache" : "server";
      
      if (initialLoadFlags.current.chats) {
        initialLoadFlags.current.chats = false;
        addEvent({
          type: 'chats',
          changeType: 'added',
          docId: 'initial-load',
          data: { count: snapshot.docs.length },
          source: source,
          notificationTriggered: false
        });
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const shouldNotify = change.type === 'added';
        
        addEvent({
          type: 'chats',
          changeType: change.type,
          docId: change.doc.id,
          data: change.doc.data(),
          source: source,
          notificationTriggered: shouldNotify
        });
      });
    });

    listenersRef.current = [bookingsUnsubscribe, servicesUnsubscribe, chatsUnsubscribe];
    setIsListening(true);
  };

  const stopListening = () => {
    listenersRef.current.forEach(unsubscribe => unsubscribe());
    listenersRef.current = [];
    setIsListening(false);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  const getEventColor = (event: DebugEvent) => {
    if (event.docId === 'initial-load') return 'bg-gray-100 border-gray-300';
    if (event.notificationTriggered) return 'bg-green-100 border-green-300';
    return 'bg-blue-100 border-blue-300';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bookings': return '📅';
      case 'services': return '🛠️';
      case 'chats': return '💬';
      default: return '📄';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Show Notification Debugger"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Notification Debugger</h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isListening 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isListening ? 'Stop' : 'Start'} Listening
          </button>
          
          <button
            onClick={clearEvents}
            className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm font-medium"
          >
            Clear
          </button>
          
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 rounded ${
              soundEnabled ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="text-xs text-gray-600 mb-2">
          Events: {events.length} | Listening: {isListening ? '🟢' : '🔴'}
        </div>
        
        {events.length === 0 ? (
          <div className="text-center text-gray-500 py-4">
            No events yet. Click "Start Listening" to monitor Firebase changes.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className={`p-2 rounded border text-xs ${getEventColor(event)}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{getTypeIcon(event.type)}</span>
                    <span className="font-medium">{event.type}</span>
                    <span className="text-blue-600">{event.changeType}</span>
                    {event.notificationTriggered && <span className="text-green-600">🔔</span>}
                  </div>
                  <span className="text-gray-500">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="text-gray-600">
                  <div>ID: {event.docId}</div>
                  <div>Source: {event.source}</div>
                  {event.data.customerName && (
                    <div>Customer: {event.data.customerName}</div>
                  )}
                  {event.data.name && (
                    <div>Name: {event.data.name}</div>
                  )}
                  {event.data.count !== undefined && (
                    <div>Count: {event.data.count}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}