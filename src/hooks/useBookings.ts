import { useState, useEffect, useCallback } from 'react';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, Timestamp, addDoc, 
  serverTimestamp, deleteDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking, BookingService } from '@/types/booking';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookingsQuery = query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
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

      setBookings(bookingsData);
      setLoading(false);
    });

    return () => unsubscribe();
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
      // Revert on error
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: bookings.find(b => b.id === bookingId)?.status || "upcoming" } : b
      ));
      throw error;
    }
  }, [bookings]);

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