"use client";

import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, Volume2, VolumeX, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  id: string;
  test: string;
  status: 'PASS' | 'FAIL' | 'ERROR' | 'RUNNING';
  message: string;
  timestamp: Date;
}

export default function NotificationTestComponent() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTestingRunning, setIsTestingRunning] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastNotification, setLastNotification] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenersRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.3;

    return () => {
      // Cleanup listeners on unmount
      listenersRef.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  const addTestResult = (test: string, status: TestResult['status'], message: string) => {
    const result: TestResult = {
      id: Date.now().toString(),
      test,
      status,
      message,
      timestamp: new Date()
    };
    setTestResults(prev => [...prev, result]);
  };

  // Test 1: Audio System Test
  const testAudioSystem = async () => {
    addTestResult("Audio System", "RUNNING", "Testing notification sound...");
    
    try {
      if (!audioRef.current) {
        addTestResult("Audio System", "ERROR", "Audio element not initialized");
        return;
      }

      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        addTestResult("Audio System", "PASS", "Notification sound played successfully");
      } else {
        addTestResult("Audio System", "FAIL", "Audio play method returned undefined");
      }
    } catch (error) {
      addTestResult("Audio System", "ERROR", `Audio test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 2: Firebase Listener Test
  const testFirebaseListener = async () => {
    addTestResult("Firebase Listener", "RUNNING", "Setting up Firebase listener...");
    
    try {
      if (!db) {
        addTestResult("Firebase Listener", "ERROR", "Firebase not initialized");
        return;
      }

      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"));
      
      let listenerWorking = false;
      
      const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        listenerWorking = true;
        setNotificationCount(prev => prev + 1);
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added" || change.type === "modified") {
            const data = change.doc.data();
            setLastNotification({
              type: change.type,
              id: change.doc.id,
              customerName: data.customerName,
              services: data.services,
              timestamp: new Date()
            });
            
            // Play notification sound
            if (soundEnabled && audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(console.error);
            }
          }
        });
        }, (error) => {
          addTestResult("Firebase Listener", "ERROR", `Listener error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });      listenersRef.current.push(unsubscribe);
      
      // Wait a moment to see if listener initializes
      setTimeout(() => {
        if (listenerWorking) {
          addTestResult("Firebase Listener", "PASS", "Firebase listener working correctly");
        } else {
          addTestResult("Firebase Listener", "FAIL", "Firebase listener not receiving data");
        }
      }, 2000);

    } catch (error) {
      addTestResult("Firebase Listener", "ERROR", `Firebase setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 3: Create Test Booking
  const createTestBooking = async () => {
    addTestResult("Create Test Booking", "RUNNING", "Creating test booking...");
    
    try {
      if (!db) {
        addTestResult("Create Test Booking", "ERROR", "Firebase not initialized");
        return;
      }

      const testBooking = {
        userId: `test-user-${Date.now()}`,
        customerName: `Test Customer ${Math.floor(Math.random() * 1000)}`,
        services: [{
          serviceName: "Notification Test Service",
          category: "Testing",
          duration: 30,
          price: 0,
          quantity: 1
        }],
        bookingDate: new Date(),
        bookingTime: "10:00",
        branch: "Test Branch",
        staff: "Test Staff",
        totalPrice: 0,
        totalDuration: 30,
        status: "upcoming",
        paymentMethod: "cash",
        emailConfirmation: false,
        smsConfirmation: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        remarks: "Notification system test booking"
      };

      const bookingsRef = collection(db, "bookings");
      await addDoc(bookingsRef, testBooking);
      
      addTestResult("Create Test Booking", "PASS", "Test booking created successfully");
      
    } catch (error) {
      addTestResult("Create Test Booking", "ERROR", `Failed to create test booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Test 4: Update Test Booking
  const updateTestBooking = async () => {
    if (!lastNotification || !lastNotification.id) {
      addTestResult("Update Test Booking", "ERROR", "No test booking available to update");
      return;
    }

    addTestResult("Update Test Booking", "RUNNING", "Updating test booking...");
    
    try {
      if (!db) {
        addTestResult("Update Test Booking", "ERROR", "Firebase not initialized");
        return;
      }

      const bookingRef = doc(db, "bookings", lastNotification.id);
      await updateDoc(bookingRef, {
        services: [{
          serviceName: "UPDATED Test Service",
          category: "Updated Testing",
          duration: 45,
          price: 100,
          quantity: 1
        }],
        totalPrice: 100,
        totalDuration: 45,
        updatedAt: serverTimestamp(),
        remarks: "Updated notification system test booking"
      });
      
      addTestResult("Update Test Booking", "PASS", "Test booking updated successfully");
      
    } catch (error) {
      addTestResult("Update Test Booking", "ERROR", `Failed to update test booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Run All Tests
  const runAllTests = async () => {
    setIsTestingRunning(true);
    setTestResults([]);
    setNotificationCount(0);
    setLastNotification(null);

    addTestResult("Test Suite", "RUNNING", "Starting notification system tests...");

    await testAudioSystem();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testFirebaseListener();
    await new Promise(resolve => setTimeout(resolve, 2000));

    await createTestBooking();
    await new Promise(resolve => setTimeout(resolve, 3000));

    await updateTestBooking();
    await new Promise(resolve => setTimeout(resolve, 2000));

    addTestResult("Test Suite", "PASS", "All tests completed");
    setIsTestingRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'ERROR':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'RUNNING':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'PASS': return 'bg-green-50 border-green-200 text-green-800';
      case 'FAIL': return 'bg-red-50 border-red-200 text-red-800';
      case 'ERROR': return 'bg-red-100 border-red-300 text-red-900';
      case 'RUNNING': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              Notification System Tester
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                soundEnabled 
                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Sound {soundEnabled ? 'ON' : 'OFF'}
            </button>
            
            <button
              onClick={runAllTests}
              disabled={isTestingRunning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Notifications Received</div>
            <div className="text-2xl font-bold text-gray-800">{notificationCount}</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Last Notification</div>
            <div className="text-lg font-semibold text-gray-800">
              {lastNotification ? lastNotification.type.toUpperCase() : 'None'}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">Test Status</div>
            <div className="text-lg font-semibold text-gray-800">
              {isTestingRunning ? 'Running...' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Last Notification Details */}
        {lastNotification && (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Last Notification Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Type:</span> {lastNotification.type}
              </div>
              <div>
                <span className="font-medium text-blue-700">Customer:</span> {lastNotification.customerName}
              </div>
              <div>
                <span className="font-medium text-blue-700">Time:</span> {lastNotification.timestamp.toLocaleTimeString()}
              </div>
              <div>
                <span className="font-medium text-blue-700">ID:</span> {lastNotification.id.substring(0, 8)}...
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
          
          {testResults.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No tests run yet. Click "Run All Tests" to start testing.
            </div>
          ) : (
            testResults.map((result) => (
              <div
                key={result.id}
                className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <div className="font-semibold">{result.test}</div>
                      <div className="text-sm opacity-75">{result.message}</div>
                    </div>
                  </div>
                  <div className="text-xs opacity-75">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Manual Testing Instructions */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">
            Manual Testing Checklist
          </h3>
          <div className="space-y-2 text-sm text-yellow-700">
            <div>✓ Create a new booking from the bookings page</div>
            <div>✓ Edit an existing booking and change service details</div>
            <div>✓ Check if notifications appear in the header</div>
            <div>✓ Verify notification sounds play (if enabled)</div>
            <div>✓ Test on both mobile and desktop</div>
            <div>✓ Check cross-browser compatibility</div>
          </div>
        </div>
      </div>
    </div>
  );
}