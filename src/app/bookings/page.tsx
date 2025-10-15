"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import AccessWrapper from "@/components/AccessWrapper";
import { ClientOnly } from '@/components/ClientOnly';
// import { BookingsFilterBar } from '@/components/BookingsFilterBar';
import { ScheduleDashboard } from '@/components/ScheduleDashboard';
import ScheduleBoard from '@/components/ScheduleBoard';
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

// Memoize helper functions outside component
const generateTimeSlots = (start = 0, end = 12 * 120, step = 15) => {
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();
const UNIQUE_HOURS = Array.from(new Set(TIME_SLOTS.map((t) => t.split(":")[0]))).sort((a, b) => Number(a) - Number(b));
const INITIAL_ENABLED_HOURS = Object.fromEntries(UNIQUE_HOURS.map(h => [h, true]));

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
  
  // Schedule board states - use initial state function to avoid recalculations
  const [scheduleDate, setScheduleDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [scheduleBranch, setScheduleBranch] = useState<string>("all");
  
  // Hours management - memoized initial state
  const [enabledHours, setEnabledHours] = useState<Record<string, boolean>>(INITIAL_ENABLED_HOURS);

  // Loading state management
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    if (!loading && !resourcesLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Small delay to ensure smooth transition
      return () => clearTimeout(timer);
    }
  }, [loading, resourcesLoading]);

  // Loading progress simulation
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return 90; // Cap at 90% until actual loading completes
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
      const timer = setTimeout(() => setLoadingProgress(0), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Optimized filtered bookings with early returns and variable caching
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];
    
    const searchTermLower = searchTerm.toLowerCase();
    const hasSearchTerm = searchTerm.length > 0;
    const filtersBranch = filters.branch;
    const filtersStaff = filters.staff;
    const filtersDate = filters.date;
    const filtersCustomer = filters.customer.toLowerCase();
    const filtersTime = filters.time;
    const isStatusAll = statusFilter === "all";

    return bookings.filter((booking) => {
      // Early return for status filter (most selective first)
      if (!isStatusAll && booking.status !== statusFilter) return false;
      
      // Search term filtering with early return
      if (hasSearchTerm) {
        const matchesSearch = 
          booking.customerName.toLowerCase().includes(searchTermLower) ||
          booking.branch.toLowerCase().includes(searchTermLower) ||
          booking.services.some((s) => s.serviceName.toLowerCase().includes(searchTermLower));
        if (!matchesSearch) return false;
      }

      // Individual filters with early returns in order of selectivity
      if (filtersBranch && booking.branch !== filtersBranch) return false;
      if (filtersStaff && booking.staff !== filtersStaff) return false;
      if (filtersDate && format(booking.bookingDate, "yyyy-MM-dd") !== filtersDate) return false;
      if (filtersCustomer && !booking.customerName.toLowerCase().includes(filtersCustomer)) return false;
      if (filtersTime && booking.bookingTime !== filtersTime) return false;

      return true;
    });
  }, [bookings, searchTerm, statusFilter, filters]);

  // Memoized unique times with Set optimization
  const uniqueTimes = useMemo(() => {
    const timeSet = new Set<string>();
    for (let i = 0; i < bookings.length; i++) {
      const time = bookings[i].bookingTime;
      if (time) timeSet.add(time);
    }
    return Array.from(timeSet).sort();
  }, [bookings]);

  // Memoized branches data
  const memoizedBranches = useMemo(() => 
    branches.length ? branches : BRANCH_OPTIONS,
    [branches]
  );

  // Stable callback handlers with proper dependencies
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
    // Pre-calculate totals to avoid multiple reducers
    let totalPrice = 0;
    let totalDuration = 0;
    const processedServices = formData.services.map((s) => {
      const price = Number(s.price) || 0;
      const duration = Number(s.duration) || 0;
      const quantity = Number(s.quantity) || 0;
      totalPrice += price * quantity;
      totalDuration += duration * quantity;
      
      return {
        ...s,
        price,
        duration,
        quantity,
      };
    });

    const bookingPayload = {
      userId: uuidv4(),
      customerName: formData.customerName.trim(),
      services: processedServices,
      bookingDate: new Date(formData.serviceDate + "T00:00:00"),
      bookingTime: formData.serviceTime,
      branch: formData.branch,
      customerEmail: formData.customerEmail.trim(),
      staff: formData.staff || null,
      totalPrice,
      totalDuration,
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

  // Memoized modal handlers to prevent unnecessary re-renders
  const handleCloseCreateModal = useCallback(() => setShowCreateModal(false), []);
  const handleCloseInvoiceModal = useCallback(() => setShowInvoiceModal(false), []);

  // Loading screen
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col items-center justify-center">
        <div className="w-64 max-w-full mx-auto">
          {/* Loading spinner */}
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600"></div>
          </div>
          
          {/* Loading text */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Loading Bookings
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Preparing your schedule...
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div 
              className="bg-pink-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>

          {/* Progress percentage */}
          <div className="text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {loadingProgress}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessWrapper>
      <ClientOnly>
        <div className="w-full px-4 sm:px-6 lg:px-8 dark:text-white">
          {/* <BookingsHeader onAddBooking={handleOpenCreate} /> */}
          
          {/* <BookingsFilterBar
            branches={memoizedBranches}
            staff={staff}
            uniqueTimes={uniqueTimes}
            onFiltersChange={setFilters}
          /> */}

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
            <div className="text-center py-12 w-full">
              <div className="mx-auto h-12 w-12 text-gray-400">📅</div>
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

          <BookingModal isOpen={showCreateModal}
            isEditing={!!editingId}
            editingId={editingId}
            bookingData={bookingFormData}
            staffOptions={staff}
            serviceOptions={services}
            paymentMethods={paymentMethods}
            enabledHours={enabledHours}
            onSave={handleSaveBooking}
            onDelete={handleDeleteBooking}
            onClose={handleCloseCreateModal}
            onGenerateInvoice={handleOpenInvoice}
          />

          <InvoiceModal
            isOpen={showInvoiceModal}
            invoiceData={invoiceData}
            onClose={handleCloseInvoiceModal}
          />
        </div>
      </ClientOnly>
    </AccessWrapper>
  );
}