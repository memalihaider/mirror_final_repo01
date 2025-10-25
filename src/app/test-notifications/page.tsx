"use client";

import NotificationTester from '@/components/NotificationTester';
import FirebaseNotificationTester from '@/components/FirebaseNotificationTester';
import AccessWrapper from '@/components/AccessWrapper';

export default function NotificationTestPage() {
  return (
    <AccessWrapper>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Notification System Testing Suite
            </h1>
            <p className="text-gray-600">
              Comprehensive tools to test and debug the notification system
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🔧 System Tests
              </h2>
              <NotificationTester />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                📱 Firebase & Mobile Tests
              </h2>
              <FirebaseNotificationTester />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              💡 Testing Instructions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h4 className="font-semibold mb-2">Step 1: Enable Debugger</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Click the blue bell icon (bottom-right)</li>
                  <li>Click "Start Listening" in debugger</li>
                  <li>Enable sound in debugger if desired</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Step 2: Run Tests</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Use "System Tests" for audio/Firebase checks</li>
                  <li>Use "Firebase Tests" for mobile/backend simulation</li>
                  <li>Check browser console for detailed logs</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Step 3: Monitor Results</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Green events = notifications triggered</li>
                  <li>Blue events = data changes detected</li>
                  <li>Listen for notification sounds</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Step 4: Real Tests</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Create bookings from /bookings page</li>
                  <li>Edit existing booking services</li>
                  <li>Check cross-platform sync</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AccessWrapper>
  );
}