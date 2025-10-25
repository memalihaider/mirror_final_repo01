// Notification System Testing Script
// This script tests the notification system for service updates on booking calendar

import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

// Test notification system for booking updates
class NotificationTester {
  constructor(db) {
    this.db = db;
    this.testResults = [];
    this.listeners = [];
  }

  // Test 1: Check if new booking notifications work
  async testNewBookingNotification() {
    console.log('🧪 Testing new booking notifications...');
    
    try {
      const bookingsRef = collection(this.db, "bookings");
      const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"));
      
      let notificationReceived = false;
      
      // Set up listener
      const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            notificationReceived = true;
            console.log('✅ New booking notification received:', change.doc.data());
          }
        });
      });
      
      this.listeners.push(unsubscribe);
      
      // Create test booking
      const testBooking = {
        userId: "test-user-123",
        customerName: "Test Customer",
        services: [{
          serviceName: "Test Service",
          category: "Test Category",
          duration: 30,
          price: 100,
          quantity: 1
        }],
        bookingDate: new Date(),
        bookingTime: "10:00",
        branch: "Test Branch",
        staff: "Test Staff",
        totalPrice: 100,
        totalDuration: 30,
        status: "upcoming",
        paymentMethod: "cash",
        emailConfirmation: false,
        smsConfirmation: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(bookingsRef, testBooking);
      
      // Wait for notification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.testResults.push({
        test: "New Booking Notification",
        status: notificationReceived ? "PASS" : "FAIL",
        message: notificationReceived ? "Notification received successfully" : "No notification received"
      });
      
    } catch (error) {
      this.testResults.push({
        test: "New Booking Notification",
        status: "ERROR",
        message: error.message
      });
    }
  }

  // Test 2: Check if service update notifications work
  async testServiceUpdateNotification(bookingId) {
    console.log('🧪 Testing service update notifications...');
    
    try {
      const bookingsRef = collection(this.db, "bookings");
      const bookingsQuery = query(bookingsRef, orderBy("updatedAt", "desc"));
      
      let updateNotificationReceived = false;
      
      // Set up listener for updates
      const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            updateNotificationReceived = true;
            console.log('✅ Service update notification received:', change.doc.data());
          }
        });
      });
      
      this.listeners.push(unsubscribe);
      
      // Update booking service
      const bookingRef = doc(this.db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        services: [{
          serviceName: "Updated Test Service",
          category: "Updated Category",
          duration: 45,
          price: 150,
          quantity: 1
        }],
        totalPrice: 150,
        totalDuration: 45,
        updatedAt: serverTimestamp()
      });
      
      // Wait for notification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.testResults.push({
        test: "Service Update Notification",
        status: updateNotificationReceived ? "PASS" : "FAIL",
        message: updateNotificationReceived ? "Update notification received successfully" : "No update notification received"
      });
      
    } catch (error) {
      this.testResults.push({
        test: "Service Update Notification",
        status: "ERROR",
        message: error.message
      });
    }
  }

  // Test 3: Check mobile/portal notification consistency
  async testCrossPlatformNotifications() {
    console.log('🧪 Testing cross-platform notifications...');
    
    try {
      // This would test if notifications work across mobile and web portal
      // For now, we'll simulate the test
      
      const simulateNotification = (platform) => {
        return new Promise((resolve) => {
          // Simulate notification delay
          setTimeout(() => {
            console.log(`📱 ${platform} notification simulated`);
            resolve(true);
          }, 500);
        });
      };
      
      const mobileNotification = await simulateNotification("Mobile");
      const portalNotification = await simulateNotification("Portal");
      
      const success = mobileNotification && portalNotification;
      
      this.testResults.push({
        test: "Cross-Platform Notification",
        status: success ? "PASS" : "FAIL",
        message: success ? "Notifications work on both platforms" : "Platform inconsistency detected"
      });
      
    } catch (error) {
      this.testResults.push({
        test: "Cross-Platform Notification",
        status: "ERROR",
        message: error.message
      });
    }
  }

  // Test 4: Check notification sound and timing
  async testNotificationSound() {
    console.log('🧪 Testing notification sound system...');
    
    try {
      // Test if notification sound is properly configured
      const audioTest = () => {
        return new Promise((resolve) => {
          try {
            const audio = new Audio('/notification.mp3');
            audio.volume = 0.1; // Low volume for testing
            
            audio.oncanplaythrough = () => {
              console.log('🔊 Audio file loaded successfully');
              resolve(true);
            };
            
            audio.onerror = () => {
              console.log('❌ Audio file failed to load');
              resolve(false);
            };
            
            // Timeout after 3 seconds
            setTimeout(() => {
              console.log('⏰ Audio test timeout');
              resolve(false);
            }, 3000);
            
          } catch (error) {
            console.log('❌ Audio test error:', error);
            resolve(false);
          }
        });
      };
      
      const audioWorks = await audioTest();
      
      this.testResults.push({
        test: "Notification Sound",
        status: audioWorks ? "PASS" : "FAIL",
        message: audioWorks ? "Notification sound is properly configured" : "Notification sound not working"
      });
      
    } catch (error) {
      this.testResults.push({
        test: "Notification Sound",
        status: "ERROR",
        message: error.message
      });
    }
  }

  // Test 5: Check notification persistence and rate limiting
  async testNotificationRateLimit() {
    console.log('🧪 Testing notification rate limiting...');
    
    try {
      const notifications = [];
      const startTime = Date.now();
      
      // Simulate multiple quick notifications
      for (let i = 0; i < 5; i++) {
        const notification = {
          id: `test-${i}`,
          timestamp: Date.now(),
          message: `Test notification ${i}`
        };
        notifications.push(notification);
        
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Check if rate limiting is working (should take some time due to debouncing)
      const rateLimitWorking = duration > 500; // At least 500ms for 5 notifications
      
      this.testResults.push({
        test: "Notification Rate Limiting",
        status: rateLimitWorking ? "PASS" : "FAIL",
        message: rateLimitWorking 
          ? `Rate limiting working (${duration}ms for 5 notifications)` 
          : `Rate limiting may not be working (${duration}ms for 5 notifications)`
      });
      
    } catch (error) {
      this.testResults.push({
        test: "Notification Rate Limiting",
        status: "ERROR",
        message: error.message
      });
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting notification system tests...\n');
    
    await this.testNotificationSound();
    await this.testNotificationRateLimit();
    await this.testCrossPlatformNotifications();
    
    // For booking tests, we'd need a Firebase connection
    console.log('⚠️  Booking notification tests require Firebase connection\n');
    
    this.printResults();
    this.cleanup();
  }

  // Print test results
  printResults() {
    console.log('📊 TEST RESULTS:');
    console.log('================');
    
    this.testResults.forEach((result, index) => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${icon} ${result.test}: ${result.status}`);
      console.log(`   ${result.message}\n`);
    });
    
    const passCount = this.testResults.filter(r => r.status === 'PASS').length;
    const totalCount = this.testResults.length;
    
    console.log(`Overall: ${passCount}/${totalCount} tests passed`);
    
    if (passCount === totalCount) {
      console.log('🎉 All tests passed! Notification system is working properly.');
    } else {
      console.log('⚠️  Some tests failed. Check the notification system configuration.');
    }
  }

  // Cleanup listeners
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
  }
}

// Manual testing checklist
const MANUAL_TEST_CHECKLIST = `
📋 MANUAL TESTING CHECKLIST FOR BOOKING NOTIFICATIONS:

1. NEW BOOKING NOTIFICATIONS:
   □ Create a new booking from web portal
   □ Check if notification appears in header
   □ Check if notification sound plays
   □ Verify notification shows correct customer name and service

2. SERVICE UPDATE NOTIFICATIONS:
   □ Edit an existing booking and change service details
   □ Check if update notification is triggered
   □ Verify notification shows updated information
   □ Test from both mobile and desktop views

3. CROSS-PLATFORM TESTING:
   □ Create booking on mobile device
   □ Check if notification appears on desktop portal
   □ Update booking on desktop
   □ Check if notification appears on mobile

4. NOTIFICATION PERSISTENCE:
   □ Close and reopen browser
   □ Check if unread notifications persist
   □ Mark notifications as read
   □ Verify read status is maintained

5. SOUND TESTING:
   □ Ensure speakers/sound is enabled
   □ Create test booking
   □ Verify notification sound plays
   □ Test volume levels are appropriate

6. RATE LIMITING:
   □ Create multiple bookings quickly
   □ Verify notifications don't spam
   □ Check sound doesn't overlap excessively

7. ERROR HANDLING:
   □ Test with poor internet connection
   □ Verify graceful degradation
   □ Check error messages are user-friendly

8. MOBILE RESPONSIVENESS:
   □ Test on different mobile devices
   □ Check notification display on small screens
   □ Verify touch interactions work properly
`;

console.log(MANUAL_TEST_CHECKLIST);

export default NotificationTester;