import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, Timestamp, addDoc, 
  serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BookingService } from '@/types/booking';

// Cache to prevent unnecessary state updates with identical data
let lastBookingsSnapshot: Booking[] = [];

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const bookingsQuery = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const bookingsData = snapshot.docs.map((d) => {
          const data = d.data() as any;
          
          // Normalize bookingDate
          let bookingDate: Date;
          if (data.bookingDate?.toDate) {
            bookingDate = data.bookingDate.toDate();
          } else if (typeof data.bookingDate === "string") {
            bookingDate = new Date(data.bookingDate);
          } else if (data.bookingDate?.seconds) {
            bookingDate = new Date(data.bookingDate.seconds * 1000);
          } else {
            bookingDate = new Date();
          }

          return {
            id: d.id,
            userId: data.userId || "",
            customerName: data.customerName || "",
            services: (data.services || []) as BookingService[],
            bookingDate,
            bookingTime: data.bookingTime || "",
            branch: data.branch || "",
            staff: data.staff?.trim() || data.staffName?.trim() || "Unassigned",
            totalPrice: data.totalPrice || 0,
            totalDuration: data.totalDuration || 0,
            status: (data.status as "upcoming" | "past" | "cancelled") || "upcoming",
            paymentMethod: data.paymentMethod || "cash",
            emailConfirmation: data.emailConfirmation || false,
            smsConfirmation: data.smsConfirmation || false,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            remarks: data.remarks ?? null,
            customerEmail: data.customerEmail || "",
            tipAmount: data.tipAmount || 0,
            discount: data.discount || 0,
          } as Booking;
        });

        // Only update state if data actually changed (prevent unnecessary re-renders)
        if (JSON.stringify(bookingsData) !== JSON.stringify(lastBookingsSnapshot)) {
          lastBookingsSnapshot = bookingsData;
          setBookings(bookingsData);
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching bookings:", error);
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const updateBookingStatus = useCallback(async (bookingId: string, newStatus: Booking['status']) => {
    try {
      // Optimistic update
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));

      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
      // Revert on error - re-fetch from cache
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: lastBookingsSnapshot.find(b => b.id === bookingId)?.status || "upcoming" } : b
      ));
      throw error;
    }
  }, []);

  const saveBooking = useCallback(async (bookingData: any, editingId?: string) => {
    const payload = {
      ...bookingData,
      bookingDate: Timestamp.fromDate(bookingData.bookingDate),
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      const ref = doc(db, "bookings", editingId);
      await updateDoc(ref, payload);
    } else {
      await addDoc(collection(db, "bookings"), {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  }, []);

  const deleteBooking = useCallback(async (bookingId: string) => {
    await deleteDoc(doc(db, "bookings", bookingId));
  }, []);

  return {
    bookings,
    loading,
    updateBookingStatus,
    saveBooking,
    deleteBooking,
  };
}