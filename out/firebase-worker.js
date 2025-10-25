// public/firebase-worker.js
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js');

// Firebase config - same as your existing config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase in worker
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

self.addEventListener('message', async function(e) {
  const { type, payload } = e.data;
  
  try {
    let result;
    
    switch(type) {
      case 'SAVE_BOOKING':
        result = await saveBooking(payload);
        break;
      case 'UPDATE_BOOKING':
        result = await updateBooking(payload);
        break;
      case 'DELETE_BOOKING':
        result = await deleteBooking(payload);
        break;
    }
    
    self.postMessage({ success: true, result, type });
  } catch (error) {
    self.postMessage({ success: false, error: error.message, type });
  }
});

async function saveBooking(payload) {
  if (payload.editingId) {
    const ref = db.collection('bookings').doc(payload.editingId);
    await ref.update({
      ...payload,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: payload.editingId };
  } else {
    const docRef = await db.collection('bookings').add({
      ...payload,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id };
  }
}

async function updateBooking(payload) {
  const ref = db.collection('bookings').doc(payload.id);
  await ref.update({
    ...payload.updates,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return { id: payload.id };
}

async function deleteBooking(bookingId) {
  await db.collection('bookings').doc(bookingId).delete();
  return { id: bookingId };
}