'use client';

import { useMemo, useCallback, memo, useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, User, Plus, Search, Filter, X } from "lucide-react";
import { format, isSameDay } from 'date-fns';
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

// Pre-computed constants
const TIMESLOTS = (() => {
  const slots: string[] = [];
  for (let t = 0; t <= 12 * 120; t += 15) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
})();

// FIXED: Enhanced time display function that handles both formats
const toDisplayAMPM = (time: string) => {
  // If time already contains AM/PM, return as is
  if (time.includes('AM') || time.includes('PM')) {
    return time;
  }
  
  // Convert 24h format to 12h format with AM/PM
  const [hStr, m] = time.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
};

const calculateEndTime = (startTime: string, duration: number) => {
  // Handle both "10:00" and "10:00 AM" formats
  let normalizedTime = startTime;
  if (startTime.includes('PM') || startTime.includes('AM')) {
    const [timePart, modifier] = startTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    normalizedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const [hours, minutes] = normalizedTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + duration;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
};

const getStatusBlock = (status: string) => {
  const styles = {
    upcoming: {
      background: "bg-gradient-to-r from-blue-500 to-blue-600",
      border: "border-2 border-blue-400 shadow-md",
      text: "text-white",
      header: "bg-blue-600/20"
    },
    past: {
      background: "bg-gradient-to-r from-green-500 to-green-600",
      border: "border-2 border-green-400 shadow-md",
      text: "text-white",
      header: "bg-green-600/20"
    },
    cancelled: {
      background: "bg-gradient-to-r from-red-500 to-red-600",
      border: "border-2 border-red-400 shadow-md",
      text: "text-white",
      header: "bg-red-600/20"
    }
  };
  return styles[status as keyof typeof styles] || styles.upcoming;
};

// Optimized time slot position calculation
const TIME_SLOT_CACHE = new Map();
const calculateBookingPosition = (bookingTime: string, duration: number) => {
  const cacheKey = `${bookingTime}-${duration}`;
  if (TIME_SLOT_CACHE.has(cacheKey)) {
    return TIME_SLOT_CACHE.get(cacheKey);
  }

  let normalizedTime = bookingTime;
  if (bookingTime.includes('PM') || bookingTime.includes('AM')) {
    const [timePart, modifier] = bookingTime.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    normalizedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const [hours, minutes] = normalizedTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const durationInSlots = Math.max(1, Math.ceil(duration / 15));
  
  // Faster slot index lookup using direct calculation
  const totalSlotsFromMidnight = (hours * 60 + minutes) / 15;
  const startSlotIndex = Math.min(Math.floor(totalSlotsFromMidnight), TIMESLOTS.length - 1);

  const result = {
    startSlotIndex,
    durationInSlots,
    startMinutes,
    endMinutes: startMinutes + duration,
    endTime: calculateEndTime(bookingTime, duration), // Use original bookingTime to preserve format
    normalizedTime
  };

  TIME_SLOT_CACHE.set(cacheKey, result);
  return result;
};

// Optimized BookingCard
const BookingCard = memo(({ 
  booking, 
  onEdit, 
  onGenerateInvoice, 
  isAdmin, 
  showTime = true, 
  slotDuration = 1 
}: any) => {
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
    booking.services?.map((s: any) => s.serviceName).join(", ") || "No services",
    [booking.services]
  );

  const statusStyle = getStatusBlock(booking.status);
  const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
  const cardHeight = slotDuration * 60 - 8;

  return (
    <div
      onClick={handleCardClick}
      className={`w-full rounded-lg ${statusStyle.background} ${statusStyle.border} ${statusStyle.text} shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden absolute top-1 left-1 right-1 bottom-1`}
      style={{ height: `${cardHeight}px`, minHeight: '52px' }}
      title={`${booking.customerName} - ${serviceNames} @ ${toDisplayAMPM(booking.bookingTime)} (${booking.totalDuration}min)`}
    >
      <div className={`${statusStyle.header} border-b border-white/20 px-2 py-1`}>
        <div className="flex justify-between items-center min-w-0">
          <div className="flex-1 min-w-0 pr-2">
            <div className="font-extrabold text-sm truncate">
              {booking.customerName}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
            {booking.status === "past" && (
              <button
                onClick={handleInvoiceClick}
                className="invoice-button text-[10px] px-2 py-1 rounded-lg bg-white text-gray-800 hover:bg-gray-100 transition-colors border border-gray-300 hover:border-gray-400 whitespace-nowrap font-bold shadow-sm flex-shrink-0"
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

      <div className="p-2 h-full flex flex-col min-w-0">
        <div className="mb-2 flex-shrink-0 min-w-0">
          <div className="text-xs font-semibold opacity-95 line-clamp-1">
            {serviceNames}
          </div>
        </div>

        <div className="flex-1 min-h-0 space-y-1 min-w-0">
          <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
            <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">
              {toDisplayAMPM(booking.bookingTime)} - {toDisplayAMPM(position.endTime)}
            </span>
          </div>

          <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
            <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">{booking.paymentMethod || "cash"}</span>
          </div>

          {booking.staff && slotDuration >= 2 && (
            <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
              <User className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">{booking.staff}</span>
            </div>
          )}
        </div>

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

const StaffHeader = memo(({ staffName }: { staffName: string }) => (
  <div className="sticky top-0 z-20 bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300 px-4 py-3 font-extrabold text-gray-800 text-sm truncate">
    {staffName}
  </div>
));

StaffHeader.displayName = 'StaffHeader';

const TimeSlot = memo(({ time }: { time: string }) => (
  <div className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 px-4 py-4 font-bold text-gray-800 h-[60px] flex items-center truncate">
    {toDisplayAMPM(time)}
  </div>
));

TimeSlot.displayName = 'TimeSlot';

// Optimized FilterBar
const FilterBar = memo(({ 
  branches, 
  staff, 
  uniqueTimes, 
  filters, 
  onFiltersChange,
  searchTerm,
  onSearchChange 
}: {
  branches: string[];
  staff: string[];
  uniqueTimes: string[];
  filters: any;
  onFiltersChange: (filters: any) => void;
  searchTerm: string;
  onSearchChange: (search: string) => void;
}) => {
  const [localSearch, setLocalSearch] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      branch: "",
      staff: "",
      date: "",
      customer: "",
      time: ""
    });
    setLocalSearch("");
  }, [onFiltersChange]);

  const hasActiveFilters = localSearch || 
    filters.branch || 
    filters.staff || 
    filters.date || 
    filters.customer || 
    filters.time;

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 mb-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Search Bookings
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by customer name, service, branch..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="w-full lg:w-48">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Branch
          </label>
          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-48">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Staff
          </label>
          <select
            value={filters.staff}
            onChange={(e) => handleFilterChange('staff', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Staff</option>
            <option value="Unassigned">Unassigned</option>
            {staff.map(staffMember => (
              <option key={staffMember} value={staffMember}>{staffMember}</option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-48">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Date
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="w-full lg:w-48">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Time
          </label>
          <select
            value={filters.time}
            onChange={(e) => handleFilterChange('time', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Times</option>
            {uniqueTimes.map(time => (
              <option key={time} value={time}>{toDisplayAMPM(time)}</option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <div className="w-full lg:w-auto">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
          <Filter className="w-4 h-4" />
          <span>Filters Active</span>
        </div>
      )}
    </div>
  );
});

FilterBar.displayName = 'FilterBar';

export default function ScheduleBoard({
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

  const [localFilters, setLocalFilters] = useState({
    branch: "",
    staff: "",
    date: "",
    customer: "",
    time: ""
  });
  const [localSearchTerm, setLocalSearchTerm] = useState("");

  const effectiveFilters = Object.keys(filters).length > 0 ? filters : localFilters;
  const effectiveSearchTerm = searchTerm || localSearchTerm;

  // FIXED: Filter time slots based on enabledHours from ScheduleDashboard
  const enabledTimeSlots = useMemo(() => {
    return TIMESLOTS.filter(time => {
      const hour = time.split(":")[0];
      return enabledHours[hour] === true;
    });
  }, [enabledHours]);

  // Optimized unique staff calculation
  const uniqueStaffOptions = useMemo(() => {
    const staffSet = new Set(staffOptions || []);
    staffSet.add("Unassigned");
    
    if (bookings) {
      for (let i = 0; i < bookings.length; i++) {
        const staff = bookings[i].staff;
        if (staff?.trim() && !staffSet.has(staff)) {
          staffSet.add(staff);
        }
      }
    }
    
    return Array.from(staffSet);
  }, [staffOptions, bookings]);

  // Optimized unique data extraction
  const [uniqueBranches, uniqueTimes] = useMemo(() => {
    const branches = new Set<string>();
    const times = new Set<string>();
    
    if (bookings) {
      for (let i = 0; i < bookings.length; i++) {
        const booking = bookings[i];
        if (booking.branch) branches.add(booking.branch);
        if (booking.bookingTime) times.add(booking.bookingTime);
      }
    }
    
    return [
      Array.from(branches).sort(),
      Array.from(times).sort()
    ];
  }, [bookings]);

  // Optimized booking time slot calculation
  const getBookingTimeSlots = useCallback((booking: Booking) => {
    if (!booking.bookingTime) return [];
    
    const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
    const timeSlots = [];
    
    for (let i = 0; i < position.durationInSlots; i++) {
      const slotIndex = position.startSlotIndex + i;
      if (slotIndex < TIMESLOTS.length && slotIndex >= 0) {
        timeSlots.push(TIMESLOTS[slotIndex]);
      }
    }
    
    return timeSlots;
  }, []);

  // Optimized filtering
  const filteredBookings = useMemo(() => {
    if (!bookings || !bookings.length) return [];

    let filtered = bookings;

    if (scheduleDate) {
      const scheduleDateObj = new Date(scheduleDate);
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return isSameDay(bookingDate, scheduleDateObj);
      });
    }

    if (scheduleBranch && scheduleBranch !== 'all') {
      filtered = filtered.filter(booking => booking.branch === scheduleBranch);
    }

    const hasSearch = effectiveSearchTerm.length > 0;
    const hasFilters = Object.values(effectiveFilters).some(val => val !== "");
    
    if (!hasSearch && !hasFilters) {
      return filtered;
    }

    const searchTermLower = effectiveSearchTerm.toLowerCase();
    
    return filtered.filter((booking) => {
      if (hasSearch) {
        const matchesSearch = 
          booking.customerName?.toLowerCase().includes(searchTermLower) ||
          booking.branch?.toLowerCase().includes(searchTermLower) ||
          booking.services?.some((s) => s.serviceName?.toLowerCase().includes(searchTermLower)) ||
          (booking.staff && booking.staff.toLowerCase().includes(searchTermLower));
        if (!matchesSearch) return false;
      }

      if (effectiveFilters.branch && booking.branch !== effectiveFilters.branch) return false;
      
      if (effectiveFilters.staff) {
        if (effectiveFilters.staff === "Unassigned") {
          if (booking.staff && booking.staff.trim() && booking.staff !== "—") {
            return false;
          }
        } else if (booking.staff !== effectiveFilters.staff) {
          return false;
        }
      }
      
      if (effectiveFilters.date) {
        const bookingDate = format(new Date(booking.bookingDate), "yyyy-MM-dd");
        if (bookingDate !== effectiveFilters.date) return false;
      }
      
      if (effectiveFilters.time && booking.bookingTime !== effectiveFilters.time) return false;

      return true;
    });
  }, [bookings, scheduleDate, scheduleBranch, effectiveSearchTerm, effectiveFilters]);

  const visibleStaffMembers = useMemo(() => uniqueStaffOptions, [uniqueStaffOptions]);

  // Optimized booking cell map creation
  const bookingCellMap = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};
    
    // Pre-initialize map only for enabled time slots
    for (let i = 0; i < enabledTimeSlots.length; i++) {
      const time = enabledTimeSlots[i];
      map[time] = {};
      for (let j = 0; j < visibleStaffMembers.length; j++) {
        const staff = visibleStaffMembers[j];
        map[time][staff] = [];
      }
    }

    // Populate bookings
    for (let i = 0; i < filteredBookings.length; i++) {
      const booking = filteredBookings[i];
      const timeSlots = getBookingTimeSlots(booking);
      const staff = booking.staff && visibleStaffMembers.includes(booking.staff) 
        ? booking.staff 
        : "Unassigned";

      for (let j = 0; j < timeSlots.length; j++) {
        const timeSlot = timeSlots[j];
        if (map[timeSlot]?.[staff]) {
          const cellBookings = map[timeSlot][staff];
          let exists = false;
          for (let k = 0; k < cellBookings.length; k++) {
            if (cellBookings[k].id === booking.id) {
              exists = true;
              break;
            }
          }
          if (!exists) {
            cellBookings.push(booking);
          }
        }
      }
    }

    return map;
  }, [filteredBookings, enabledTimeSlots, visibleStaffMembers, getBookingTimeSlots]);

  const isPrimarySlot = useCallback((booking: Booking, time: string) => {
    const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
    return TIMESLOTS[position.startSlotIndex] === time;
  }, []);

  const getSlotDuration = useCallback((booking: Booking) => {
    const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
    return position.durationInSlots;
  }, []);

  const isCellOccupied = useCallback((time: string, staff: string) => {
    const cellBookings = bookingCellMap[time]?.[staff] || [];
    return cellBookings.length > 0;
  }, [bookingCellMap]);

  const hasPrimaryBookings = useCallback((time: string, staff: string) => {
    const cellBookings = bookingCellMap[time]?.[staff] || [];
    for (let i = 0; i < cellBookings.length; i++) {
      if (isPrimarySlot(cellBookings[i], time)) {
        return true;
      }
    }
    return false;
  }, [bookingCellMap, isPrimarySlot]);

  const handleCellClick = useCallback((staff: string, time: string) => {
    onCellClick(staff, time);
  }, [onCellClick]);

  const hasActiveFilters = useMemo(() => {
    return effectiveSearchTerm || 
           effectiveFilters.branch || 
           effectiveFilters.staff || 
           effectiveFilters.date || 
           effectiveFilters.time;
  }, [effectiveSearchTerm, effectiveFilters]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-50 border-2 border-gray-300 shadow-2xl backdrop-blur-sm mb-0">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>

      <div className="relative p-6 border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg border-2 border-indigo-400">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-800 tracking-wide">Schedule Board</h3>
            <div className="text-sm text-gray-600 mt-1">
              {filteredBookings.length} bookings • {enabledTimeSlots.length} time slots • {visibleStaffMembers.length} staff
            </div>
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
          <div className="text-sm font-semibold text-gray-600">
            {hasActiveFilters && (
              <span className="text-blue-600 animate-pulse">Filters Active</span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-4">
        <FilterBar
          branches={uniqueBranches}
          staff={uniqueStaffOptions}
          uniqueTimes={uniqueTimes}
          filters={effectiveFilters}
          onFiltersChange={setLocalFilters}
          searchTerm={effectiveSearchTerm}
          onSearchChange={setLocalSearchTerm}
        />
      </div>

      <div className="relative overflow-x-auto w-full">
        {/* Staff Header Row */}
        <div 
          className="grid sticky top-0 z-30 bg-white border-b-2 border-gray-300"
          style={{
            gridTemplateColumns: `180px repeat(${visibleStaffMembers.length}, 200px)`,
          }}
        >
          <div className="sticky left-0 z-40 bg-white border-r-2 border-gray-300 px-4 py-3 font-extrabold text-gray-800 h-[60px] flex items-center">
            Time
          </div>
          {visibleStaffMembers.map((staffName) => (
            <StaffHeader key={`staff-header-${staffName}`} staffName={staffName} />
          ))}
        </div>

        {/* Time Slots Rows - Only show enabled time slots */}
        {enabledTimeSlots.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No time slots enabled. Please enable hours in the schedule controls.</p>
            <p className="text-sm mt-2">Enabled hours from dashboard: {Object.keys(enabledHours).filter(h => enabledHours[h]).join(', ')}</p>
          </div>
        ) : (
          enabledTimeSlots.map((time) => (
            <div
              key={`timeslot-${time}`}
              className="grid border-b border-gray-200"
              style={{
                gridTemplateColumns: `180px repeat(${visibleStaffMembers.length}, 200px)`,
                height: '60px'
              }}
            >
              <TimeSlot time={time} />

              {visibleStaffMembers.map((sName: string) => {
                const cellBookings = bookingCellMap[time]?.[sName] || [];
                const primaryBookings = cellBookings.filter((booking: Booking) => 
                  isPrimarySlot(booking, time)
                );
                const isOccupied = isCellOccupied(time, sName);
                const hasPrimary = hasPrimaryBookings(time, sName);

                return (
                  <div
                    key={`cell-${time}-${sName}`}
                    className={`border-r border-gray-200 relative h-full ${
                      !isOccupied ? 'hover:bg-gray-50/80 cursor-pointer' : ''
                    }`}
                    onClick={() => !isOccupied && handleCellClick(sName, time)}
                  >
                    <div className="p-1 h-full relative">
                      {primaryBookings.map((b: Booking) => {
                        const slotDuration = getSlotDuration(b);
                        return (
                          <BookingCard
                            key={`booking-${b.id}-${time}-${sName}`}
                            booking={b}
                            onEdit={onEditBooking}
                            onGenerateInvoice={onGenerateInvoice}
                            isAdmin={isAdmin}
                            showTime={isPrimarySlot(b, time)}
                            slotDuration={slotDuration}
                          />
                        );
                      })}

                      {!isOccupied && !hasPrimary && (
                        <div className="w-full h-full flex items-center justify-center absolute inset-0">
                          <button
                            className="flex items-center justify-center w-10 h-10 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-full transition-all duration-200 border-2 border-dashed border-emerald-400 hover:border-emerald-500 hover:shadow-lg z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(sName, time);
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