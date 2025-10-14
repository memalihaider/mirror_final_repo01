"use client";

import { useState, useMemo, useCallback } from "react";
import AccessWrapper from "@/components/AccessWrapper";
import { ClientOnly } from '@/components/ClientOnly';
import { BookingsHeader } from '@/components/BookingsHeader';
import { BookingsFilterBar } from '@/components/BookingsFilterBar';
import { ScheduleDashboard } from '@/components/ScheduleDashboard';
import { ScheduleBoard } from '@/components/ScheduleBoard';
import { BookingModal } from '@/components/BookingModal';
import { InvoiceModal } from '@/components/InvoiceModal';
import { useBookings } from '@/hooks/useBookings';
import { useResources } from '@/hooks/useResources';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingFormData } from '@/types/booking';

const BRANCH_OPTIONS = [
  "AI Bustaan",
  "Marina",
  "TECOM",
  "AL Muraqabat",
  "IBN Batutta Mall",
];

export default function BookingsPage() {
  // Hooks for data management
  const { bookings, loading, saveBooking, deleteBooking } = useBookings();
  const { staff, branches, services, paymentMethods, loading: resourcesLoading } = useResources();

  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [filters, setFilters] = useState({
    branch: "",
    staff: "",
    date: "",
    customer: "",
    time: ""
  });
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<Booking | null>(null);
  const [bookingFormData, setBookingFormData] = useState<BookingFormData | null>(null);
  
  // Schedule board states
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [scheduleBranch, setScheduleBranch] = useState<string>("all");
  
  // Hours management
  const uniqueHours = useMemo(() => 
    Array.from(new Set(generateTimeSlots().map((t) => t.split(":")[0]))).sort((a, b) => Number(a) - Number(b)), 
    []
  );
  
  const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(
    () => Object.fromEntries(uniqueHours.map(h => [h, true]))
  );

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        booking.customerName.toLowerCase().includes(q) ||
        booking.branch.toLowerCase().includes(q) ||
        booking.services.some((s) => s.serviceName.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "all" || booking.status === (statusFilter as "upcoming" | "past" | "cancelled");

      const matchesBranch = !filters.branch || booking.branch === filters.branch;
      const matchesStaff = !filters.staff || (booking.staff ? booking.staff === filters.staff : false);
      const matchesDate = !filters.date || format(booking.bookingDate, "yyyy-MM-dd") === filters.date;
      const matchesCustomer = !filters.customer || booking.customerName.toLowerCase().includes(filters.customer.toLowerCase());
      const matchesTime = !filters.time || booking.bookingTime === filters.time;

      return matchesSearch && matchesStatus && matchesBranch && matchesStaff && matchesDate && matchesCustomer && matchesTime;
    });
  }, [bookings, searchTerm, statusFilter, filters]);

  // Unique times for filter dropdown
  const uniqueTimes = useMemo(() => {
    const times = bookings.map((b) => b.bookingTime).filter(Boolean);
    return Array.from(new Set(times)).sort();
  }, [bookings]);

  // Modal handlers
  const handleOpenCreate = useCallback(() => {
    setEditingId(null);
    setBookingFormData(null);
    setShowCreateModal(true);
  }, []);

  const handleOpenCreateFromCell = useCallback((prefillStaff: string, prefillTime: string) => {
    const hour = prefillTime.split(":")[0];
    if (!enabledHours[hour]) return;

    setEditingId(null);
    setBookingFormData({
      branch: BRANCH_OPTIONS[0],
      serviceDate: scheduleDate,
      serviceTime: prefillTime,
      customerName: "",
      customerEmail: "",
      paymentMethod: "cash",
      customPaymentMethod: "",
      emailConfirmation: false,
      smsConfirmation: false,
      status: "upcoming",
      staff: prefillStaff,
      services: [{
        serviceId: "",
        serviceName: "",
        category: "",
        duration: 30,
        price: 0,
        quantity: 1
      }],
      remarks: "",
      tip: 0,
      discount: 0
    });
    setShowCreateModal(true);
  }, [enabledHours, scheduleDate]);

  const handleOpenEdit = useCallback((booking: Booking) => {
    setEditingId(booking.id);
    setBookingFormData({
      branch: booking.branch || BRANCH_OPTIONS[0],
      serviceDate: format(booking.bookingDate, "yyyy-MM-dd"),
      serviceTime: booking.bookingTime || "10:00",
      customerName: booking.customerName || "",
      customerEmail: booking.customerEmail || "",
      paymentMethod: booking.paymentMethod || "cash",
      customPaymentMethod: "",
      emailConfirmation: !!booking.emailConfirmation,
      smsConfirmation: !!booking.smsConfirmation,
      status: booking.status || "upcoming",
      staff: booking.staff || "",
      services: booking.services && booking.services.length > 0
        ? booking.services.map((s) => ({
            serviceId: s.serviceId || "",
            serviceName: s.serviceName || "",
            category: s.category || "",
            duration: Number(s.duration) || 0,
            price: Number(s.price) || 0,
            quantity: Number(s.quantity) || 1,
          }))
        : [{
            serviceId: "",
            serviceName: "",
            category: "",
            duration: 30,
            price: 0,
            quantity: 1
          }],
      remarks: booking.remarks || "",
      tip: booking.tipAmount || 0,
      discount: booking.discount || 0
    });
    setShowCreateModal(true);
  }, []);

  const handleOpenInvoice = useCallback((booking: Booking) => {
    setInvoiceData(booking);
    setShowInvoiceModal(true);
  }, []);

  const handleSaveBooking = useCallback(async (formData: BookingFormData, editingId?: string) => {
    const bookingPayload = {
      userId: uuidv4(),
      customerName: formData.customerName.trim(),
      services: formData.services.map((s) => ({
        ...s,
        price: Number(s.price) || 0,
        duration: Number(s.duration) || 0,
        quantity: Number(s.quantity) || 0,
      })),
      bookingDate: new Date(formData.serviceDate + "T00:00:00"),
      bookingTime: formData.serviceTime,
      branch: formData.branch,
      customerEmail: formData.customerEmail.trim(),
      staff: formData.staff || null,
      totalPrice: formData.services.reduce((sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0), 0),
      totalDuration: formData.services.reduce((sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0), 0),
      status: formData.status,
      paymentMethod: formData.paymentMethod === "custom" ? formData.customPaymentMethod : formData.paymentMethod,
      emailConfirmation: formData.emailConfirmation,
      smsConfirmation: formData.smsConfirmation,
      remarks: formData.remarks || null,
      tipAmount: Number(formData.tip) || 0,
      discount: Number(formData.discount) || 0,
    };

    await saveBooking(bookingPayload, editingId);
  }, [saveBooking]);

  const handleDeleteBooking = useCallback(async (bookingId: string) => {
    await deleteBooking(bookingId);
  }, [deleteBooking]);

  // Loading state
  if (loading || resourcesLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-3 text-pink-600">Loading bookings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessWrapper>
      <ClientOnly>
        <div className="max-w-6xl mx-auto dark:text-white">
          {/* <BookingsHeader onAddBooking={handleOpenCreate} /> */}
          
          <BookingsFilterBar
            branches={branches.length ? branches : BRANCH_OPTIONS}
            staff={staff}
            uniqueTimes={uniqueTimes}
            onFiltersChange={setFilters}
          />

          <ScheduleDashboard
            bookings={filteredBookings}
            enabledHours={enabledHours}
            onHoursChange={setEnabledHours}
          />

          <ScheduleBoard
            bookings={filteredBookings}
            staffOptions={staff}
            scheduleDate={scheduleDate}
            scheduleBranch={scheduleBranch}
            enabledHours={enabledHours}
            onCellClick={handleOpenCreateFromCell}
            onEditBooking={handleOpenEdit}
            onGenerateInvoice={handleOpenInvoice}
          />

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No bookings found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "No bookings have been made yet."}
              </p>
            </div>
          )}

          <BookingModal
            isOpen={showCreateModal}
            isEditing={!!editingId}
            editingId={editingId}
            bookingData={bookingFormData}
            staffOptions={staff}
            serviceOptions={services}
            paymentMethods={paymentMethods}
            enabledHours={enabledHours}
            onSave={handleSaveBooking}
            onDelete={handleDeleteBooking}
            onClose={() => setShowCreateModal(false)}
            onGenerateInvoice={handleOpenInvoice}
          />

          <InvoiceModal
            isOpen={showInvoiceModal}
            invoiceData={invoiceData}
            onClose={() => setShowInvoiceModal(false)}
          />
        </div>
      </ClientOnly>
    </AccessWrapper>
  );
}

// Helper functions
function generateTimeSlots(start = 0, end = 12 * 120, step = 15) {
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

// Import Calendar component
import { Calendar } from "lucide-react";