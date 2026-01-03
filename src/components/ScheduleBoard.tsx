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

// Pre-computed constants - ULTRA FAST
const TIMESLOTS = (() => {
  const slots: string[] = [];
  for (let t = 0; t <= 12 * 120; t += 15) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
})();

// GLOBAL CACHE - Shared across all instances
const GLOBAL_CACHE = {
  timeConversions: new Map<string, string>(),
  bookingPositions: new Map<string, any>(),
  displayTimes: new Map<string, string>(),
  paymentMethods: new Map<string, any>()
};

// ULTRA-FAST time conversion
const toDisplayAMPM = (time: string): string => {
  return GLOBAL_CACHE.timeConversions.get(time) || (() => {
    if (time.includes('AM') || time.includes('PM')) {
      GLOBAL_CACHE.timeConversions.set(time, time);
      return time;
    }
    
    const [hStr, m] = time.split(":");
    let h = Number(hStr);
    const suffix = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    else if (h > 12) h = h - 12;
    const result = `${h}:${m} ${suffix}`;
    GLOBAL_CACHE.timeConversions.set(time, result);
    return result;
  })();
};

const calculateEndTime = (startTime: string, duration: number): string => {
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

// ULTRA-FAST position calculation
const calculateBookingPosition = (bookingTime: string, duration: number) => {
  const cacheKey = `${bookingTime}-${duration}`;
  if (GLOBAL_CACHE.bookingPositions.has(cacheKey)) {
    return GLOBAL_CACHE.bookingPositions.get(cacheKey);
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
  
  const totalSlotsFromMidnight = (hours * 60 + minutes) / 15;
  const startSlotIndex = Math.min(Math.floor(totalSlotsFromMidnight), TIMESLOTS.length - 1);

  const result = {
    startSlotIndex,
    durationInSlots,
    startMinutes,
    endMinutes: startMinutes + duration,
    endTime: calculateEndTime(bookingTime, duration),
    normalizedTime
  };

  GLOBAL_CACHE.bookingPositions.set(cacheKey, result);
  return result;
};

// Notification System removed for performance - stub only
const NotificationContainer = memo(({ notifications, removeNotification }: {
  notifications: any[];
  removeNotification: (id: string) => void;
}) => null);

NotificationContainer.displayName = 'NotificationContainer';

// ULTRA-FAST Payment Methods Display
const PaymentMethodsDisplay = memo(({ paymentMethods }: { paymentMethods: string[] | string }) => {
  const methods = useMemo(() => {
    if (Array.isArray(paymentMethods)) {
      return paymentMethods;
    }
    if (typeof paymentMethods === 'string' && paymentMethods.trim() !== '') {
      return paymentMethods.includes(',') 
        ? paymentMethods.split(',').map(m => m.trim()).filter(m => m !== '')
        : [paymentMethods.trim()];
    }
    return ['cash'];
  }, [paymentMethods]);

  // Pre-computed payment configs
  const paymentConfigs = useMemo(() => {
    const configs = {
      'cash': { icon: '💵', label: 'Cash' },
      'card': { icon: '💳', label: 'Card' },
      'credit card': { icon: '💳', label: 'Card' },
      'upi': { icon: '📱', label: 'UPI' },
      'wallet': { icon: '👛', label: 'Wallet' },
      'netbanking': { icon: '🏦', label: 'Net Banking' },
      'cheque': { icon: '📄', label: 'Cheque' },
      'paypal': { icon: '🔵', label: 'PayPal' }
    };
    
    return methods.map(method => {
      const normalized = method.toLowerCase().trim();
      return configs[normalized as keyof typeof configs] || { icon: '💳', label: method };
    });
  }, [methods]);

  if (methods.length === 0) {
    return (
      <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
        <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0 text-gray-400" />
        <span className="text-gray-500 italic">No payment</span>
      </div>
    );
  }

  if (methods.length === 1) {
    return (
      <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
        <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
        <span className="flex items-center gap-1">
          <span>{paymentConfigs[0].icon}</span>
          <span>{paymentConfigs[0].label}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0 group relative">
      <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1">
          <span>{paymentConfigs[0].icon}</span>
          <span>{paymentConfigs[0].label}</span>
        </span>
        <span className="bg-blue-100 text-blue-700 px-1 rounded text-[10px] font-bold border border-blue-200 ml-1">
          +{methods.length - 1}
        </span>
      </div>
    </div>
  );
});

PaymentMethodsDisplay.displayName = 'PaymentMethodsDisplay';

// Drag and drop removed for performance

// ULTRA-OPTIMIZED BookingCard - No drag/drop for performance
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

  // PRE-COMPUTED values from parent - no calculations here
  const { serviceNames, statusStyle, displayTime, endTimeDisplay, cardHeight } = useMemo(() => ({
    serviceNames: booking.services?.map((s: any) => s.serviceName).join(", ") || "No services",
    statusStyle: getStatusBlock(booking.status),
    displayTime: GLOBAL_CACHE.displayTimes.get(booking.bookingTime) || toDisplayAMPM(booking.bookingTime),
    endTimeDisplay: toDisplayAMPM(calculateEndTime(booking.bookingTime, booking.totalDuration || 30)),
    cardHeight: slotDuration * 60 - 8
  }), [booking, slotDuration]);

  return (
    <div
      onClick={handleCardClick}
      className={`w-full rounded-lg ${statusStyle.background} ${statusStyle.border} ${statusStyle.text} shadow-lg cursor-pointer overflow-hidden absolute top-1 left-1 right-1 bottom-1`}
      style={{ 
        height: `${cardHeight}px`, 
        minHeight: '52px'
      }}
      title={booking.customerName}
    >
      <div className={`${statusStyle.header} border-b border-white/20 px-2 py-1 flex justify-between items-center`}>
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
              {displayTime}
            </span>
          )}
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
              {displayTime} - {endTimeDisplay}
            </span>
          </div>

          <PaymentMethodsDisplay paymentMethods={booking.paymentMethods || booking.paymentMethod} />
          
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

const TimeSlot = memo(({ time }: { time: string }) => {
  const displayTime = useMemo(() => toDisplayAMPM(time), [time]);
  
  return (
    <div className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 px-4 py-4 font-bold text-gray-800 h-[60px] flex items-center truncate">
      {displayTime}
    </div>
  );
});

TimeSlot.displayName = 'TimeSlot';

// ULTRA-FAST ScheduleCell - No drag/drop for performance
const ScheduleCell = memo(({ 
  time, 
  staff, 
  isOccupied, 
  hasPrimary, 
  onCellClick, 
  primaryBookings,
  getSlotDuration,
  onEditBooking,
  onGenerateInvoice,
  isAdmin
}: any) => {
  const handleClick = useCallback(() => {
    if (!isOccupied) {
      onCellClick(staff, time);
    }
  }, [isOccupied, staff, time, onCellClick]);

  return (
    <div
      className={`border-r border-gray-200 relative h-full ${!isOccupied ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      <div className="p-1 h-full relative">
        {!isOccupied && !hasPrimary ? (
          <button
            className="flex items-center justify-center w-10 h-10 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-full border-2 border-dashed border-emerald-400 hover:border-emerald-500 z-10"
            onClick={(e) => {
              e.stopPropagation();
              onCellClick(staff, time);
            }}
            title="Add Booking"
          >
            <Plus className="w-5 h-5 font-bold" />
          </button>
        ) : (
          primaryBookings.map((b: Booking) => {
            const slotDuration = getSlotDuration(b);
            return (
              <BookingCard
                key={`booking-${b.id}-${time}-${staff}`}
                booking={b}
                onEdit={onEditBooking}
                onGenerateInvoice={onGenerateInvoice}
                isAdmin={isAdmin}
                showTime={true}
                slotDuration={slotDuration}
              />
            );
          })
        )}
      </div>
    </div>
  );
});

ScheduleCell.displayName = 'ScheduleCell';

// FAST FilterBar
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
    }, 150);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  const handleFilterChange = useCallback((key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({ branch: "", staff: "", date: "", customer: "", time: "" });
    setLocalSearch("");
  }, [onFiltersChange]);

  const hasActiveFilters = localSearch || Object.values(filters).some(val => val !== "");

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 mb-4">
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Search Bookings
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {[
          { key: 'branch', label: 'Branch', options: branches, width: 'w-40' },
          { key: 'staff', label: 'Staff', options: staff, width: 'w-40' },
          { key: 'time', label: 'Time', options: uniqueTimes, width: 'w-40' }
        ].map(({ key, label, options, width }) => (
          <div key={key} className={`w-full ${width}`}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
            <select
              value={filters[key]}
              onChange={(e) => handleFilterChange(key, e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All {label}</option>
              {key === 'staff' && <option value="Unassigned">Unassigned</option>}
              {options.map(option => (
                <option key={option} value={option}>
                  {key === 'time' ? toDisplayAMPM(option) : option}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className="w-full lg:w-40">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {hasActiveFilters && (
          <div className="w-full lg:w-auto">
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Clear
            </button>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
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
    branch: "", staff: "", date: "", customer: "", time: ""
  });
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  // Simplified - drag/drop removed for performance
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const effectiveFilters = Object.keys(filters).length > 0 ? filters : localFilters;
  const effectiveSearchTerm = searchTerm || localSearchTerm;

  // ULTRA-FAST computations
  const enabledTimeSlots = useMemo(() => {
    return TIMESLOTS.filter(time => enabledHours[time.split(":")[0]] === true);
  }, [enabledHours]);

  const uniqueStaffOptions = useMemo(() => {
    const staffSet = new Set(staffOptions || []);
    staffSet.add("Unassigned");
    bookings?.forEach(booking => {
      if (booking.staff?.trim()) staffSet.add(booking.staff);
    });
    return Array.from(staffSet);
  }, [staffOptions, bookings]);

  const [uniqueBranches, uniqueTimes] = useMemo(() => {
    const branches = new Set<string>();
    const times = new Set<string>();
    bookings?.forEach(booking => {
      if (booking.branch) branches.add(booking.branch);
      if (booking.bookingTime) times.add(booking.bookingTime);
    });
    return [Array.from(branches).sort(), Array.from(times).sort()];
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (!bookings?.length) return [];

    let filtered = bookings.filter(booking => {
      if (scheduleDate) {
        const bookingDate = new Date(booking.bookingDate);
        const scheduleDateObj = new Date(scheduleDate);
        if (!isSameDay(bookingDate, scheduleDateObj)) return false;
      }

      if (scheduleBranch && scheduleBranch !== 'all' && booking.branch !== scheduleBranch) {
        return false;
      }

      const hasSearch = effectiveSearchTerm.length > 0;
      if (hasSearch) {
        const searchTermLower = effectiveSearchTerm.toLowerCase();
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
          if (booking.staff && booking.staff.trim() && booking.staff !== "—") return false;
        } else if (booking.staff !== effectiveFilters.staff) return false;
      }
      if (effectiveFilters.date && format(new Date(booking.bookingDate), "yyyy-MM-dd") !== effectiveFilters.date) return false;
      if (effectiveFilters.time && booking.bookingTime !== effectiveFilters.time) return false;

      return true;
    });

    return filtered;
  }, [bookings, scheduleDate, scheduleBranch, effectiveSearchTerm, effectiveFilters]);

  const visibleStaffMembers = uniqueStaffOptions;

  // ULTRA-FAST booking cell map
  const bookingCellMap = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};
    
    // Initialize only enabled slots
    enabledTimeSlots.forEach(time => {
      map[time] = {};
      visibleStaffMembers.forEach(staff => {
        map[time][staff] = [];
      });
    });

    // Populate bookings
    filteredBookings.forEach(booking => {
      const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
      const staff = booking.staff && visibleStaffMembers.includes(booking.staff) ? booking.staff : "Unassigned";

      for (let i = 0; i < position.durationInSlots; i++) {
        const slotIndex = position.startSlotIndex + i;
        if (slotIndex < TIMESLOTS.length) {
          const timeSlot = TIMESLOTS[slotIndex];
          if (map[timeSlot]?.[staff] && !map[timeSlot][staff].some(b => b.id === booking.id)) {
            map[timeSlot][staff].push(booking);
          }
        }
      }
    });

    return map;
  }, [filteredBookings, enabledTimeSlots, visibleStaffMembers]);

  // PRE-COMPUTE utility functions
  const utils = useMemo(() => ({
    isPrimarySlot: (booking: Booking, time: string) => {
      const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
      return TIMESLOTS[position.startSlotIndex] === time;
    },
    getSlotDuration: (booking: Booking) => {
      const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
      return position.durationInSlots;
    },
    isCellOccupied: (time: string, staff: string) => {
      return (bookingCellMap[time]?.[staff] || []).length > 0;
    },
    hasPrimaryBookings: (time: string, staff: string) => {
      const cellBookings = bookingCellMap[time]?.[staff] || [];
      return cellBookings.some(booking => {
        const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
        return TIMESLOTS[position.startSlotIndex] === time;
      });
    }
  }), [bookingCellMap]);

  const handleCellClick = useCallback((staff: string, time: string) => {
    onCellClick(staff, time);
  }, [onCellClick]);

  return (
    <>
      <NotificationContainer notifications={notifications} removeNotification={removeNotification} />

      <div className="relative overflow-hidden rounded-2xl bg-slate-50 border-2 border-gray-300 shadow-2xl backdrop-blur-sm mb-0">
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
          </div>
        </div>

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
          <div className="grid sticky top-0 z-30 bg-white border-b-2 border-gray-300"
            style={{ gridTemplateColumns: `180px repeat(${visibleStaffMembers.length}, 200px)` }}>
            <div className="sticky left-0 z-40 bg-white border-r-2 border-gray-300 px-4 py-3 font-extrabold text-gray-800 h-[60px] flex items-center">
              Time
            </div>
            {visibleStaffMembers.map((staffName) => (
              <StaffHeader key={staffName} staffName={staffName} />
            ))}
          </div>

          {enabledTimeSlots.map((time) => (
            <div key={time} className="grid border-b border-gray-200"
              style={{ gridTemplateColumns: `180px repeat(${visibleStaffMembers.length}, 200px)`, height: '60px' }}>
              <TimeSlot time={time} />
              {visibleStaffMembers.map((sName) => {
                const cellBookings = bookingCellMap[time]?.[sName] || [];
                const primaryBookings = cellBookings.filter(booking => utils.isPrimarySlot(booking, time));
                return (
                  <ScheduleCell
                    key={`${time}-${sName}`}
                    time={time}
                    staff={sName}
                    isOccupied={utils.isCellOccupied(time, sName)}
                    hasPrimary={utils.hasPrimaryBookings(time, sName)}
                    onCellClick={handleCellClick}
                    primaryBookings={primaryBookings}
                    getSlotDuration={utils.getSlotDuration}
                    onEditBooking={onEditBooking}
                    onGenerateInvoice={onGenerateInvoice}
                    isAdmin={isAdmin}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}