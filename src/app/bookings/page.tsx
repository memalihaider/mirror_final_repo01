"use client";

import { useState, useMemo, useCallback, useEffect, memo } from "react";
import AccessWrapper from "@/components/AccessWrapper";
import { ClientOnly } from '@/components/ClientOnly';
// import { BookingsFilterBar } from '@/components/BookingsFilterBar';
import { ScheduleDashboard } from '@/components/ScheduleDashboard';
import ScheduleBoard from '@/components/ScheduleBoard';
import { BookingModal } from '@/components/BookingModal';
import { InvoiceModal } from '@/components/InvoiceModal';
import { useBookings } from '@/hooks/useBookings';
import { useResources } from '@/hooks/useResources';
import { useDebounceCallback } from '@/lib/debounce';
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

// Memoized empty service template to prevent recreation
const EMPTY_SERVICE_TEMPLATE = {
  serviceId: "",
  serviceName: "",
  category: "",
  duration: 30,
  price: 0,
  quantity: 1
} as const;

function BookingsPage() {
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

  // Loading state management - simplified for performance
  const [isLoading, setIsLoading] = useState(true);

  // Remove loading once data is ready - no artificial delays
  useEffect(() => {
    if (!loading && !resourcesLoading) {
      setIsLoading(false);
    }
  }, [loading, resourcesLoading]);

  // Optimized filtered bookings with early returns and variable caching
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];
    
    // Pre-calculate filter conditions to avoid repeated operations
    const searchTermLower = searchTerm.toLowerCase();
    const hasSearchTerm = searchTerm.length > 0;
    const hasFilters = Object.values(filters).some(Boolean);
    const isStatusAll = statusFilter === "all";
    
    // Early return if no filters applied
    if (!hasSearchTerm && !hasFilters && isStatusAll) {
      return bookings;
    }

    // Cache filter values to avoid repeated property access
    const filtersBranch = filters.branch;
    const filtersStaff = filters.staff;
    const filtersDate = filters.date;
    const filtersCustomer = filters.customer.toLowerCase();
    const filtersTime = filters.time;

    return bookings.filter((booking) => {
      // Early return for status filter (most selective first)
      if (!isStatusAll && booking.status !== statusFilter) return false;
      
      // Individual filters with early returns in order of selectivity
      if (filtersBranch && booking.branch !== filtersBranch) return false;
      if (filtersStaff && booking.staff !== filtersStaff) return false;
      if (filtersDate && format(booking.bookingDate, "yyyy-MM-dd") !== filtersDate) return false;
      if (filtersCustomer && !booking.customerName.toLowerCase().includes(filtersCustomer)) return false;
      if (filtersTime && booking.bookingTime !== filtersTime) return false;

      // Search term filtering last (most expensive)
      if (hasSearchTerm) {
        const customerNameLower = booking.customerName.toLowerCase();
        const branchLower = booking.branch.toLowerCase();
        
        return customerNameLower.includes(searchTermLower) ||
               branchLower.includes(searchTermLower) ||
               booking.services.some((s) => s.serviceName.toLowerCase().includes(searchTermLower));
      }

      return true;
    });
  }, [bookings, searchTerm, statusFilter, filters]);

  // Memoized unique times with Set optimization and early return
  const uniqueTimes = useMemo(() => {
    if (!bookings.length) return [];
    
    const timeSet = new Set<string>();
    // Use for loop for better performance with large arrays
    for (let i = 0; i < bookings.length; i++) {
      const time = bookings[i].bookingTime;
      if (time) timeSet.add(time);
    }
    return Array.from(timeSet).sort();
  }, [bookings]);

  // Memoized branches data with stable reference
  const memoizedBranches = useMemo(() => 
    branches.length ? branches : BRANCH_OPTIONS,
    [branches]
  );

  // Memoized staff and services for stable references
  const memoizedStaff = useMemo(() => staff, [staff]);
  const memoizedServices = useMemo(() => services, [services]);
  const memoizedPaymentMethods = useMemo(() => paymentMethods, [paymentMethods]);

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
      paymentDetails: [{ method: "cash", amount: 0 }],
      customPaymentMethod: "",
      emailConfirmation: false,
      smsConfirmation: false,
      status: "upcoming",
      staff: prefillStaff,
      services: [EMPTY_SERVICE_TEMPLATE],
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
      paymentDetails: (booking as any).paymentDetails || [{ method: booking.paymentMethod || "cash", amount: booking.totalPrice || 0 }],
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
            staffMember: (s as any).staffMember || "",
          }))
        : [{ ...EMPTY_SERVICE_TEMPLATE, staffMember: "" }],
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

  // Debounced modal close handlers to prevent rapid cascading updates
  const debouncedCloseCreateModal = useDebounceCallback(handleCloseCreateModal, 50);
  const debouncedCloseInvoiceModal = useDebounceCallback(handleCloseInvoiceModal, 50);

  // Loading screen - dark overlay with proper z-index
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 z-[9999] flex flex-col items-center justify-center">
        <div className="w-64 max-w-full mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-white mb-2">
            Loading Bookings...
          </div>
          <div className="text-sm text-gray-300">
            Please wait while we fetch your data
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessWrapper>
      <ClientOnly>
        <div className="w-full px-4 sm:px-2 lg:px-2 dark:text-white">
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
            staffOptions={memoizedStaff}
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
            staffOptions={memoizedStaff}
            serviceOptions={memoizedServices}
            paymentMethods={memoizedPaymentMethods}
            enabledHours={enabledHours}
            onSave={handleSaveBooking}
            onDelete={handleDeleteBooking}
            onClose={debouncedCloseCreateModal}
            onGenerateInvoice={handleOpenInvoice}
          />

          <InvoiceModal
            isOpen={showInvoiceModal}
            invoiceData={invoiceData}
            onClose={debouncedCloseInvoiceModal}
          />
        </div>
      </ClientOnly>
    </AccessWrapper>
  );
}

// Export memoized component for better performance
export default memo(BookingsPage);