'use client';

import { useMemo, useCallback, memo } from 'react';
import { Calendar, Clock, CreditCard, User, Plus } from "lucide-react";
import { format } from 'date-fns';
import { Booking } from '@/types/booking';
import { useAuth } from '@/contexts/AuthContext';

interface ScheduleBoardProps {
  bookings: Booking[];
  staffOptions: string[];
  scheduleDate: string;
  scheduleBranch: string;
  enabledHours: Record<string, boolean>;
  onCellClick: (staff: string, time: string) => void;
  onEditBooking: (booking: Booking) => void;
  onGenerateInvoice: (booking: Booking) => void;
  filters?: any;
  searchTerm?: string;
}

// Helper functions first
function generateTimeSlots(start = 0, end = 12 * 120, step = 15) {
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

const TIMESLOTS = generateTimeSlots();

const toDisplayAMPM = (hhmm: string) => {
  const [hStr, m] = hhmm.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
};

// Calculate end time based on start time and duration
const calculateEndTime = (startTime: string, duration: number) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

// Enhanced status blocks with better colors and styling
const getStatusBlock = (status: string) => {
  switch (status) {
    case "upcoming":
      return {
        background: "bg-gradient-to-r from-blue-500 to-blue-600",
        border: "border-2 border-blue-400 shadow-md",
        text: "text-white",
        header: "bg-blue-600/20"
      };
    case "past":
      return {
        background: "bg-gradient-to-r from-green-500 to-green-600",
        border: "border-2 border-green-400 shadow-md",
        text: "text-white",
        header: "bg-green-600/20"
      };
    case "cancelled":
      return {
        background: "bg-gradient-to-r from-red-500 to-red-600",
        border: "border-2 border-red-400 shadow-md",
        text: "text-white",
        header: "bg-red-600/20"
      };
    default:
      return {
        background: "bg-gradient-to-r from-blue-500 to-blue-600",
        border: "border-2 border-blue-400 shadow-md",
        text: "text-white",
        header: "bg-blue-600/20"
      };
  }
};

// Calculate time slot position and duration
const calculateBookingPosition = (bookingTime: string, duration: number) => {
  const [hours, minutes] = bookingTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const durationInSlots = Math.max(1, Math.ceil(duration / 15)); // Each slot is 15 minutes
  const startSlotIndex = TIMESLOTS.findIndex(slot => {
    const [slotHours, slotMinutes] = slot.split(':').map(Number);
    return slotHours === hours && slotMinutes === minutes;
  });
  
  return {
    startSlotIndex,
    durationInSlots,
    startMinutes,
    endMinutes: startMinutes + duration,
    endTime: calculateEndTime(bookingTime, duration)
  };
};

// Memoized BookingCard component with responsive text containment
const BookingCard = memo(({ booking, onEdit, onGenerateInvoice, isAdmin, showTime = true, slotDuration = 1 }: any) => {
  const handleInvoiceClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateInvoice(booking);
  }, [booking, onGenerateInvoice]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.invoice-button')) {
      onEdit(booking);
    }
  }, [booking, onEdit]);

  const serviceNames = useMemo(() => 
    booking.services.map((s: any) => s.serviceName).join(", "),
    [booking.services]
  );

  const statusStyle = getStatusBlock(booking.status);
  const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
  
  // Fixed height calculation - each slot is exactly 60px
  const cardHeight = slotDuration * 60 - 8; // 8px for margin/padding

  return (
    <div
      onClick={handleCardClick}
      className={`w-full rounded-lg ${statusStyle.background} ${statusStyle.border} ${statusStyle.text} shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden absolute top-1 left-1 right-1 bottom-1`}
      style={{ 
        height: `${cardHeight}px`,
        minHeight: '52px' // Minimum height to show basic content
      }}
      title={`${booking.customerName} - ${serviceNames} @ ${toDisplayAMPM(booking.bookingTime)} (${booking.totalDuration}min)`}
    >
      {/* Header Section with enhanced border effect */}
      <div className={`${statusStyle.header} border-b border-white/20 px-2 py-1`}>
        <div className="flex justify-between items-center min-w-0">
          <div className="flex-1 min-w-0 pr-2">
            <div className="font-extrabold text-sm truncate tracking-tight overflow-hidden text-ellipsis" title={booking.customerName}>
              {booking.customerName}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
            {booking.status === "past" &&(
              <button
                onClick={handleInvoiceClick}
                className="invoice-button text-[10px] px-2 py-1 rounded-lg bg-white text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300 hover:border-gray-400 whitespace-nowrap font-bold shadow-sm flex-shrink-0"
                title="Generate Invoice"
              >
                💰 Invoice
              </button>
            )}
            {showTime && (
              <span className="text-[10px] font-black bg-black bg-opacity-30 px-2 py-1 rounded-md whitespace-nowrap tracking-tight flex-shrink-0">
                {toDisplayAMPM(booking.bookingTime)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content Section with responsive text containment */}
      <div className="p-2 h-full flex flex-col min-w-0">
        {/* Services - Bold and clear with proper truncation */}
        <div className="mb-2 flex-shrink-0 min-w-0">
          <div className="text-xs font-semibold opacity-95 line-clamp-1 tracking-wide overflow-hidden text-ellipsis break-words" title={serviceNames}>
            {serviceNames}
          </div>
        </div>

        {/* Details Section - Responsive text containment */}
        <div className="flex-1 min-h-0 space-y-1 min-w-0">
          {/* Time Range - Responsive */}
          <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
            <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="truncate tracking-wide overflow-hidden text-ellipsis min-w-0">
              {toDisplayAMPM(booking.bookingTime)} - {toDisplayAMPM(position.endTime)}
            </span>
          </div>

          {/* Payment Method - Responsive */}
          <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
            <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="truncate tracking-wide overflow-hidden text-ellipsis min-w-0">{booking.paymentMethod || "cash"}</span>
          </div>

          {/* Staff - Responsive when shown */}
          {booking.staff && slotDuration >= 2 && (
            <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
              <User className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="truncate tracking-wide overflow-hidden text-ellipsis min-w-0">{booking.staff}</span>
            </div>
          )}
        </div>

        {/* Duration indicator with better visibility */}
        <div className="absolute bottom-1 right-1">
          <div className="text-[10px] font-bold bg-black bg-opacity-40 px-2 py-0.5 rounded-md border border-white/20">
            {booking.totalDuration || 30}m
          </div>
        </div>
      </div>
    </div>
  );
});

BookingCard.displayName = 'BookingCard';

// Memoized Staff Header component with enhanced styling
const StaffHeader = memo(({ staffName, isVisible }: { staffName: string; isVisible: boolean }) => (
  <div className={`sticky top-0 z-20 bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300 px-4 py-3 font-extrabold text-gray-800 text-sm truncate tracking-wide overflow-hidden text-ellipsis ${isVisible ? '' : 'hidden'}`}>
    {staffName}
  </div>
));

StaffHeader.displayName = 'StaffHeader';

// Memoized Time Slot component with fixed height and enhanced styling
const TimeSlot = memo(({ time, isVisible }: { time: string; isVisible: boolean }) => (
  <div className={`sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 px-4 py-4 font-bold text-gray-800 h-[60px] flex items-center tracking-wide truncate overflow-hidden text-ellipsis ${isVisible ? '' : 'hidden'}`}>
    {toDisplayAMPM(time)}
  </div>
));

TimeSlot.displayName = 'TimeSlot';

export function ScheduleBoard({
  bookings,
  staffOptions,
  scheduleDate,
  scheduleBranch,
  enabledHours,
  onCellClick,
  onEditBooking,
  onGenerateInvoice,
  filters = {},
  searchTerm = ""
}: ScheduleBoardProps) {
  const { isAdmin } = useAuth();

  // Memoized unique staff
  const uniqueStaffOptions = useMemo(() => {
    return [...new Set(staffOptions)];
  }, [staffOptions]);

  // Memoized enabled time slots - MOVED TO TOP
  const enabledTimeSlots = useMemo(() => {
    return TIMESLOTS.filter(t => {
      const hour = t.split(":")[0].padStart(2, "0");
      return !!enabledHours[hour];
    });
  }, [enabledHours]);

  // Get all time slots that a booking spans - MOVED BEFORE filteredBookings
  const getBookingTimeSlots = useCallback((booking: Booking) => {
    const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
    const timeSlots = [];
    
    for (let i = 0; i < position.durationInSlots; i++) {
      const slotIndex = position.startSlotIndex + i;
      if (slotIndex < TIMESLOTS.length) {
        timeSlots.push(TIMESLOTS[slotIndex]);
      }
    }
    
    return timeSlots;
  }, []);

  // Filter bookings based on search term and filters
  const filteredBookings = useMemo(() => {
    if (!bookings.length) return [];

    const searchTermLower = searchTerm.toLowerCase();
    const hasSearchTerm = searchTerm.length > 0;
    const filtersBranch = filters.branch;
    const filtersStaff = filters.staff;
    const filtersDate = filters.date;
    const filtersCustomer = filters.customer?.toLowerCase() || "";
    const filtersTime = filters.time;

    return bookings.filter((booking) => {
      // Search term filtering
      if (hasSearchTerm) {
        const matchesSearch = 
          booking.customerName.toLowerCase().includes(searchTermLower) ||
          booking.branch.toLowerCase().includes(searchTermLower) ||
          booking.services.some((s) => s.serviceName.toLowerCase().includes(searchTermLower)) ||
          (booking.staff && booking.staff.toLowerCase().includes(searchTermLower));
        if (!matchesSearch) return false;
      }

      // Individual filters
      if (filtersBranch && booking.branch !== filtersBranch) return false;
      if (filtersStaff && booking.staff !== filtersStaff) return false;
      if (filtersDate && format(booking.bookingDate, "yyyy-MM-dd") !== filtersDate) return false;
      if (filtersCustomer && !booking.customerName.toLowerCase().includes(filtersCustomer)) return false;
      if (filtersTime && booking.bookingTime !== filtersTime) return false;

      return true;
    });
  }, [bookings, searchTerm, filters]);

  // Get staff members that have bookings in the filtered results
  const visibleStaffMembers = useMemo(() => {
    const staffWithBookings = new Set<string>();
    
    filteredBookings.forEach(booking => {
      if (booking.staff && uniqueStaffOptions.includes(booking.staff)) {
        staffWithBookings.add(booking.staff);
      }
    });

    // If staff filter is applied, only show that staff member
    if (filters.staff) {
      return uniqueStaffOptions.filter(staff => staff === filters.staff);
    }

    // If no filters, show all staff
    if (!searchTerm && !filters.branch && !filters.date && !filters.customer && !filters.time) {
      return uniqueStaffOptions;
    }

    // Otherwise show only staff with matching bookings
    return Array.from(staffWithBookings);
  }, [filteredBookings, uniqueStaffOptions, filters, searchTerm]);

  // Get time slots that have bookings in the filtered results
  const visibleTimeSlots = useMemo(() => {
    const timesWithBookings = new Set<string>();
    
    filteredBookings.forEach(booking => {
      const timeSlots = getBookingTimeSlots(booking);
      timeSlots.forEach(timeSlot => {
        timesWithBookings.add(timeSlot);
      });
    });

    // If time filter is applied, only show that time slot
    if (filters.time) {
      return enabledTimeSlots.filter(time => time === filters.time);
    }

    // If no filters, show all enabled time slots
    if (!searchTerm && !filters.branch && !filters.staff && !filters.date && !filters.customer) {
      return enabledTimeSlots;
    }

    // Otherwise show only time slots with matching bookings
    return enabledTimeSlots.filter(time => timesWithBookings.has(time));
  }, [filteredBookings, enabledTimeSlots, filters, searchTerm, getBookingTimeSlots]);

  // Memoized cell click handler
  const handleCellClick = useCallback((staff: string, time: string) => {
    onCellClick(staff, time);
  }, [onCellClick]);

  // Create a map of which bookings should be displayed in which cells
  const bookingCellMap = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};
    
    // Initialize the map structure only for visible time slots and staff
    visibleTimeSlots.forEach(time => {
      map[time] = {};
      visibleStaffMembers.forEach(staff => {
        map[time][staff] = [];
      });
    });

    // Place each booking in all the time slots it spans
    filteredBookings.forEach(booking => {
      const timeSlots = getBookingTimeSlots(booking);
      const staff = booking.staff && visibleStaffMembers.includes(booking.staff) 
        ? booking.staff 
        : "Unassigned";

      timeSlots.forEach(timeSlot => {
        if (map[timeSlot] && map[timeSlot][staff] && visibleTimeSlots.includes(timeSlot)) {
          // Only add if not already present (avoid duplicates)
          if (!map[timeSlot][staff].some(b => b.id === booking.id)) {
            map[timeSlot][staff].push(booking);
          }
        }
      });
    });

    return map;
  }, [filteredBookings, visibleTimeSlots, visibleStaffMembers, getBookingTimeSlots]);

  // Check if a booking should be the primary display in a slot (first slot)
  const isPrimarySlot = useCallback((booking: Booking, time: string) => {
    const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
    return TIMESLOTS[position.startSlotIndex] === time;
  }, []);

  // Get slot duration for a booking
  const getSlotDuration = useCallback((booking: Booking) => {
    const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
    return position.durationInSlots;
  }, []);

  // Check if a cell is occupied by any booking (primary or secondary)
  const isCellOccupied = useCallback((time: string, staff: string) => {
    const cellBookings = bookingCellMap[time]?.[staff] || [];
    return cellBookings.length > 0;
  }, [bookingCellMap]);

  // Check if a cell has primary bookings (should show booking cards)
  const hasPrimaryBookings = useCallback((time: string, staff: string) => {
    const cellBookings = bookingCellMap[time]?.[staff] || [];
    return cellBookings.filter(booking => isPrimarySlot(booking, time)).length > 0;
  }, [bookingCellMap, isPrimarySlot]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm || filters.branch || filters.staff || filters.date || filters.customer || filters.time;
  }, [searchTerm, filters]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-50 border-2 border-gray-300 shadow-2xl backdrop-blur-sm mb-0">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>

      {/* Header with enhanced border */}
      <div className="relative p-6 border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg border-2 border-indigo-400">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-extrabold text-gray-800 tracking-wide">Schedule Board</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
          <div className="text-sm font-semibold text-gray-600">
            {filteredBookings.length} bookings • {visibleTimeSlots.length} time slots • {visibleStaffMembers.length} staff
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600 animate-pulse">• Filtered</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto w-full">
        {/* Staff Header Row with enhanced borders - Only show visible staff */}
        <div 
          className="grid sticky top-0 z-30 bg-white border-b-2 border-gray-300"
          style={{
            gridTemplateColumns: `180px repeat(${visibleStaffMembers.length}, 200px)`,
          }}
        >
          <div className="sticky left-0 z-40 bg-white border-r-2 border-gray-300 px-4 py-3 font-extrabold text-gray-800 h-[60px] flex items-center tracking-wide">
            Time
          </div>
          {visibleStaffMembers.map((staffName) => (
            <StaffHeader key={`staff-header-${staffName}`} staffName={staffName} isVisible={true} />
          ))}
        </div>

        {/* Time Slots Rows - Only show visible time slots */}
        {visibleTimeSlots.length === 0 ? (
          <div className="text-center py-12 text-gray-500 font-semibold">
            {hasActiveFilters ? "No bookings match your filters" : "No time slots enabled. Please enable hours in the schedule controls."}
          </div>
        ) : (
          visibleTimeSlots.map((t) => (
            <div
              key={`timeslot-${t}`}
              className="grid border-b border-gray-200"
              style={{
                gridTemplateColumns: `180px repeat(${visibleStaffMembers.length}, 200px)`,
                height: '60px'
              }}
            >
              <TimeSlot time={t} isVisible={true} />

              {visibleStaffMembers.map((sName) => {
                const cellBookings = bookingCellMap[t]?.[sName] || [];
                const primaryBookings = cellBookings.filter(booking => 
                  isPrimarySlot(booking, t)
                );
                const isOccupied = isCellOccupied(t, sName);
                const hasPrimary = hasPrimaryBookings(t, sName);

                return (
                  <div
                    key={`cell-${t}-${sName}`}
                    className={`border-r border-gray-200 transition-colors relative h-full ${
                      !isOccupied ? 'hover:bg-gray-50/80 cursor-pointer' : ''
                    }`}
                    onClick={() => !isOccupied && handleCellClick(sName, t)}
                  >
                    <div className="p-1 h-full relative">
                      {/* Primary Bookings - positioned absolutely to prevent overlap */}
                      {primaryBookings.map((b) => {
                        const slotDuration = getSlotDuration(b);
                        
                        return (
                          <BookingCard
                            key={`booking-${b.id}-${t}-${sName}`}
                            booking={b}
                            onEdit={onEditBooking}
                            onGenerateInvoice={onGenerateInvoice}
                            isAdmin={isAdmin}
                            showTime={isPrimarySlot(b, t)}
                            slotDuration={slotDuration}
                          />
                        );
                      })}

                      {/* Show "+" icon ONLY if cell is completely empty AND no primary bookings */}
                      {!isOccupied && !hasPrimary && (
                        <div className="w-full h-full flex items-center justify-center absolute inset-0">
                          <button
                            className="flex items-center justify-center w-10 h-10 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-full transition-all duration-200 border-2 border-dashed border-emerald-400 hover:border-emerald-500 hover:shadow-lg z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(sName, t);
                            }}
                            title="Add Booking"
                          >
                            <Plus className="w-5 h-5 font-bold" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

