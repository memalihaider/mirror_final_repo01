"use client";

import { useState } from 'react';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Smartphone, Monitor, Database, TestTube } from 'lucide-react';

export default function FirebaseNotificationTester() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastBookingId, setLastBookingId] = useState<string | null>(null);
  const [lastServiceId, setLastServiceId] = useState<string | null>(null);

  // Simulate mobile app creating a booking
  const simulateMobileBooking = async () => {
    if (!db) {
      alert("Firebase not initialized");
      return;
    }

    setIsCreating(true);
    try {
      const mockMobileBooking = {
        userId: `mobile-user-${Date.now()}`,
        customerName: `Mobile Customer ${Math.floor(Math.random() * 1000)}`,
        services: [{
          serviceName: "Mobile App Service",
          category: "Mobile Category",
          duration: 45,
          price: 120,
          quantity: 1
        }],
        bookingDate: new Date(),
        bookingTime: "14:30",
        branch: "Mobile Branch",
        staff: "Mobile Staff",
        totalPrice: 120,
        totalDuration: 45,
        status: "upcoming",
        paymentMethod: "mobile_payment",
        emailConfirmation: true,
        smsConfirmation: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        remarks: "Created from mobile app simulation",
        source: "mobile_app" // Add source tracking
      };

      const bookingsRef = collection(db, "bookings");
      const docRef = await addDoc(bookingsRef, mockMobileBooking);
      setLastBookingId(docRef.id);
      
      console.log("📱 Mobile booking created:", docRef.id);
      alert(`Mobile booking created! ID: ${docRef.id}`);
      
    } catch (error) {
      console.error("Error creating mobile booking:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Simulate Firebase function/backend creating a booking
  const simulateFirebaseBooking = async () => {
    if (!db) {
      alert("Firebase not initialized");
      return;
    }

    setIsCreating(true);
    try {
      const mockFirebaseBooking = {
        userId: `firebase-system-${Date.now()}`,
        customerName: `Firebase Customer ${Math.floor(Math.random() * 1000)}`,
        services: [{
          serviceName: "Firebase Function Service",
          category: "System Category",
          duration: 60,
          price: 200,
          quantity: 1
        }],
        bookingDate: new Date(),
        bookingTime: "16:00",
        branch: "System Branch",
        staff: "Auto-assigned Staff",
        totalPrice: 200,
        totalDuration: 60,
        status: "upcoming",
        paymentMethod: "system_payment",
        emailConfirmation: false,
        smsConfirmation: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        remarks: "Created from Firebase function simulation",
        source: "firebase_function" // Add source tracking
      };

      const bookingsRef = collection(db, "bookings");
      const docRef = await addDoc(bookingsRef, mockFirebaseBooking);
      setLastBookingId(docRef.id);
      
      console.log("🔥 Firebase booking created:", docRef.id);
      alert(`Firebase booking created! ID: ${docRef.id}`);
      
    } catch (error) {
      console.error("Error creating Firebase booking:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Update the last created booking (simulate service change)
  const simulateServiceUpdate = async () => {
    if (!db || !lastBookingId) {
      alert("No booking to update. Create a booking first.");
      return;
    }

    setIsUpdating(true);
    try {
      const bookingRef = doc(db, "bookings", lastBookingId);
      const updatedData = {
        services: [{
          serviceName: "UPDATED Service Name",
          category: "UPDATED Category",
          duration: 90,
          price: 250,
          quantity: 1
        }],
        totalPrice: 250,
        totalDuration: 90,
        updatedAt: serverTimestamp(),
        remarks: "Service updated via test simulation",
        lastUpdateSource: "test_simulation"
      };

      await updateDoc(bookingRef, updatedData);
      
      console.log("📝 Booking updated:", lastBookingId);
      alert(`Booking updated! ID: ${lastBookingId}`);
      
    } catch (error) {
      console.error("Error updating booking:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Add a new service to the services collection
  const simulateServiceAddition = async () => {
    if (!db) {
      alert("Firebase not initialized");
      return;
    }

    setIsCreating(true);
    try {
      const mockService = {
        name: `Test Service ${Math.floor(Math.random() * 1000)}`,
        category: "Test Category",
        duration: 45,
        price: 150,
        description: "Service added via notification testing",
        active: true,
        branch: "Test Branch",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: "notification_test"
      };

      const servicesRef = collection(db, "services");
      const docRef = await addDoc(servicesRef, mockService);
      setLastServiceId(docRef.id);
      
      console.log("🛠️ Service created:", docRef.id);
      alert(`Service created! ID: ${docRef.id}`);
      
    } catch (error) {
      console.error("Error creating service:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <TestTube className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          Firebase Notification Tester
        </h2>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">
            🧪 Test Scenarios
          </h3>
          <p className="text-sm text-yellow-700">
            These tests simulate bookings and services being created/updated from different sources.
            Watch the notification debugger (bottom-right corner) and browser console for results.
          </p>
        </div>

        {/* Mobile App Simulation */}
        <div className="border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Mobile App Simulation</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Simulates a booking being created from a mobile application
          </p>
          <button
            onClick={simulateMobileBooking}
            disabled={isCreating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Mobile Booking'}
          </button>
        </div>

        {/* Firebase Function Simulation */}
        <div className="border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Database className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800">Firebase Function Simulation</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Simulates a booking being created by a Firebase Cloud Function or backend service
          </p>
          <button
            onClick={simulateFirebaseBooking}
            disabled={isCreating}
            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Firebase Booking'}
          </button>
        </div>

        {/* Service Update Simulation */}
        <div className="border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Monitor className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-800">Service Update Simulation</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Updates the most recently created booking's service details
          </p>
          <button
            onClick={simulateServiceUpdate}
            disabled={isUpdating || !lastBookingId}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isUpdating ? 'Updating...' : 'Update Last Booking'}
          </button>
          {lastBookingId && (
            <p className="text-xs text-gray-500 mt-2">
              Will update booking: {lastBookingId}
            </p>
          )}
        </div>

        {/* Service Addition Simulation */}
        <div className="border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <TestTube className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">New Service Simulation</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Adds a new service to the services collection
          </p>
          <button
            onClick={simulateServiceAddition}
            disabled={isCreating}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {isCreating ? 'Creating...' : 'Add New Service'}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">
            📋 How to Test:
          </h3>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
            <li>Open the notification debugger (blue bell icon in bottom-right)</li>
            <li>Click "Start Listening" in the debugger</li>
            <li>Run any of the test scenarios above</li>
            <li>Check the debugger for real-time events</li>
            <li>Listen for notification sounds</li>
            <li>Check browser console for detailed logs</li>
          </ol>
        </div>
      </div>
    </div>
  );
}