'use client';

import { useMemo, useCallback, memo, useState, useEffect, useRef } from 'react';
import { Calendar, Clock, CreditCard, User, Plus, Search, Filter, X, CheckCircle, AlertCircle } from "lucide-react";
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

// Enhanced caching system
const CACHE = {
  timeConversions: new Map<string, string>(),
  bookingPositions: new Map<string, any>(),
  displayTimes: new Map<string, string>()
};

// Ultra-fast time conversion
const toDisplayAMPM = (time: string): string => {
  if (CACHE.timeConversions.has(time)) {
    return CACHE.timeConversions.get(time)!;
  }

  if (time.includes('AM') || time.includes('PM')) {
    CACHE.timeConversions.set(time, time);
    return time;
  }
  
  const [hStr, m] = time.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h = h - 12;
  const result = `${h}:${m} ${suffix}`;
  CACHE.timeConversions.set(time, result);
  return result;
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

// Optimized position calculation
const calculateBookingPosition = (bookingTime: string, duration: number) => {
  const cacheKey = `${bookingTime}-${duration}`;
  if (CACHE.bookingPositions.has(cacheKey)) {
    return CACHE.bookingPositions.get(cacheKey);
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

  CACHE.bookingPositions.set(cacheKey, result);
  return result;
};

// Notification System
interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  duration?: number;
}

const NotificationContainer = memo(({ notifications, removeNotification }: {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-out ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-500 text-green-800'
              : notification.type === 'error'
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-blue-50 border-blue-500 text-blue-800'
          } animate-in slide-in-from-right-full`}
        >
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${
              notification.type === 'success'
                ? 'text-green-500'
                : notification.type === 'error'
                ? 'text-red-500'
                : 'text-blue-500'
            }`}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : notification.type === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-sm opacity-90 mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
});

NotificationContainer.displayName = 'NotificationContainer';

// Enhanced Payment Methods Display
// Enhanced Payment Methods Display for Multiple Payment Methods
const PaymentMethodsDisplay = memo(({ paymentMethods }: { paymentMethods: string[] | string }) => {
  // Normalize payment methods to always be an array
  const methods = useMemo(() => {
    if (Array.isArray(paymentMethods)) {
      return paymentMethods.filter(method => method && method.trim() !== '');
    }
    
    if (typeof paymentMethods === 'string' && paymentMethods.trim() !== '') {
      // Handle comma-separated string or single payment method
      if (paymentMethods.includes(',')) {
        return paymentMethods.split(',').map(m => m.trim()).filter(m => m !== '');
      }
      return [paymentMethods.trim()];
    }
    
    return ['cash']; // Default fallback
  }, [paymentMethods]);

  const getPaymentIcon = (method: string) => {
    const normalizedMethod = method.toLowerCase().trim();
    const icons: Record<string, string> = {
      'cash': '💵',
      'card': '💳',
      'credit card': '💳',
      'debit card': '💳',
      'upi': '📱',
      'wallet': '👛',
      'digital wallet': '👛',
      'netbanking': '🏦',
      'net banking': '🏦',
      'online banking': '🏦',
      'cheque': '📄',
      'check': '📄',
      'paypal': '🔵',
      'paytm': '📱',
      'phonepe': '📱',
      'google pay': '📱'
    };
    return icons[normalizedMethod] || '💳';
  };

  const getPaymentLabel = (method: string) => {
    const normalizedMethod = method.toLowerCase().trim();
    const labels: Record<string, string> = {
      'cash': 'Cash',
      'card': 'Card',
      'credit card': 'Card',
      'debit card': 'Card',
      'upi': 'UPI',
      'wallet': 'Wallet',
      'digital wallet': 'Wallet',
      'netbanking': 'Net Banking',
      'net banking': 'Net Banking',
      'online banking': 'Net Banking',
      'cheque': 'Cheque',
      'check': 'Cheque',
      'paypal': 'PayPal',
      'paytm': 'Paytm',
      'phonepe': 'PhonePe',
      'google pay': 'Google Pay'
    };
    return labels[normalizedMethod] || method;
  };

  // Show different display based on number of payment methods
  if (methods.length === 0) {
    return (
      <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
        <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0 text-gray-400" />
        <span className="text-gray-500 italic">No payment method</span>
      </div>
    );
  }

  if (methods.length === 1) {
    const method = methods[0];
    return (
      <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
        <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
        <span className="flex items-center gap-1 transition-opacity duration-150">
          <span>{getPaymentIcon(method)}</span>
          <span>{getPaymentLabel(method)}</span>
        </span>
      </div>
    );
  }

  // Multiple payment methods - show compact display with tooltip
  return (
    <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0 group relative">
      <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
      <div className="flex items-center gap-1">
        {/* Show first method with icon */}
        <span className="flex items-center gap-1">
          <span>{getPaymentIcon(methods[0])}</span>
          <span>{getPaymentLabel(methods[0])}</span>
        </span>
        
        {/* Show +X more for additional methods */}
        <span className="bg-blue-100 text-blue-700 px-1 rounded text-[10px] font-bold border border-blue-200 ml-1">
          +{methods.length - 1}
        </span>
      </div>

      {/* Hover tooltip showing all methods */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 transform-gpu">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl whitespace-nowrap border border-gray-700">
          <div className="font-semibold mb-1 border-b border-gray-600 pb-1 flex items-center gap-2">
            <CreditCard className="w-3 h-3" />
            Payment Methods:
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {methods.map((method, index) => (
              <div key={`${method}-${index}`} className="flex items-center gap-2 py-0.5">
                <span className="text-xs">{getPaymentIcon(method)}</span>
                <span className="text-xs">{getPaymentLabel(method)}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-700">
            {methods.length} method(s) selected
          </div>
        </div>
        
        {/* Tooltip arrow */}
        <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
});

PaymentMethodsDisplay.displayName = 'PaymentMethodsDisplay';

// Alternative: Ultra-compact version for very small spaces
const CompactPaymentMethodsDisplay = memo(({ paymentMethods }: { paymentMethods: string[] | string }) => {
  const methods = useMemo(() => {
    if (Array.isArray(paymentMethods)) {
      return paymentMethods.filter(method => method && method.trim() !== '');
    }
    
    if (typeof paymentMethods === 'string' && paymentMethods.trim() !== '') {
      if (paymentMethods.includes(',')) {
        return paymentMethods.split(',').map(m => m.trim()).filter(m => m !== '');
      }
      return [paymentMethods.trim()];
    }
    
    return ['cash'];
  }, [paymentMethods]);

  const getPaymentIcon = (method: string) => {
    const normalizedMethod = method.toLowerCase().trim();
    const icons: Record<string, string> = {
      'cash': '💵',
      'card': '💳',
      'upi': '📱',
      'wallet': '👛',
      'netbanking': '🏦',
      'cheque': '📄',
      'paypal': '🔵'
    };
    return icons[normalizedMethod] || '💳';
  };

  if (methods.length === 0) {
    return (
      <div className="flex items-center text-[10px] font-semibold opacity-90 min-w-0">
        <CreditCard className="w-2.5 h-2.5 mr-1 flex-shrink-0 text-gray-400" />
        <span className="text-gray-500">No payment</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-[10px] font-semibold opacity-90 min-w-0 group relative">
      <CreditCard className="w-2.5 h-2.5 mr-1 flex-shrink-0" />
      <div className="flex items-center gap-0.5">
        {/* Show icons for first 2 methods */}
        {methods.slice(0, 2).map((method, index) => (
          <span key={index} className="transition-opacity duration-150">
            {getPaymentIcon(method)}
          </span>
        ))}
        
        {/* Show +X for additional methods */}
        {methods.length > 2 && (
          <span className="bg-blue-100 text-blue-700 px-0.5 rounded text-[8px] font-bold border border-blue-200">
            +{methods.length - 2}
          </span>
        )}
      </div>

      {/* Compact hover tooltip */}
      {methods.length > 1 && (
        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
          <div className="bg-gray-800 text-white text-[10px] rounded py-1 px-2 shadow-lg whitespace-nowrap">
            {methods.slice(0, 3).map((method, index) => (
              <div key={index} className="flex items-center gap-1">
                <span>{getPaymentIcon(method)}</span>
                <span>{method}</span>
              </div>
            ))}
            {methods.length > 3 && (
              <div className="text-gray-400 text-[9px] mt-0.5">
                +{methods.length - 3} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

CompactPaymentMethodsDisplay.displayName = 'CompactPaymentMethodsDisplay';

// Enhanced version with colored badges
const BadgePaymentMethodsDisplay = memo(({ paymentMethods }: { paymentMethods: string[] | string }) => {
  const methods = useMemo(() => {
    if (Array.isArray(paymentMethods)) {
      return paymentMethods.filter(method => method && method.trim() !== '');
    }
    
    if (typeof paymentMethods === 'string' && paymentMethods.trim() !== '') {
      if (paymentMethods.includes(',')) {
        return paymentMethods.split(',').map(m => m.trim()).filter(m => m !== '');
      }
      return [paymentMethods.trim()];
    }
    
    return ['cash'];
  }, [paymentMethods]);

  const getPaymentConfig = (method: string) => {
    const normalizedMethod = method.toLowerCase().trim();
    const configs: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
      'cash': { icon: '💵', label: 'Cash', color: 'text-green-800', bgColor: 'bg-green-100' },
      'card': { icon: '💳', label: 'Card', color: 'text-blue-800', bgColor: 'bg-blue-100' },
      'credit card': { icon: '💳', label: 'Card', color: 'text-blue-800', bgColor: 'bg-blue-100' },
      'upi': { icon: '📱', label: 'UPI', color: 'text-purple-800', bgColor: 'bg-purple-100' },
      'wallet': { icon: '👛', label: 'Wallet', color: 'text-orange-800', bgColor: 'bg-orange-100' },
      'netbanking': { icon: '🏦', label: 'Net Banking', color: 'text-indigo-800', bgColor: 'bg-indigo-100' },
      'cheque': { icon: '📄', label: 'Cheque', color: 'text-gray-800', bgColor: 'bg-gray-100' },
      'paypal': { icon: '🔵', label: 'PayPal', color: 'text-blue-800', bgColor: 'bg-blue-100' }
    };
    
    return configs[normalizedMethod] || { icon: '💳', label: method, color: 'text-gray-800', bgColor: 'bg-gray-100' };
  };

  if (methods.length === 0) {
    return (
      <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
        <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0 text-gray-400" />
        <span className="text-gray-500 italic">No payment method</span>
      </div>
    );
  }

  if (methods.length === 1) {
    const config = getPaymentConfig(methods[0]);
    return (
      <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0">
        <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bgColor} ${config.color} border`}>
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0 group relative">
      <CreditCard className="w-3 h-3 mr-1.5 flex-shrink-0" />
      <div className="flex items-center gap-1">
        {/* Show first method as badge */}
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${getPaymentConfig(methods[0]).bgColor} ${getPaymentConfig(methods[0]).color} border`}>
          <span>{getPaymentConfig(methods[0]).icon}</span>
          <span>{getPaymentConfig(methods[0]).label}</span>
        </span>
        
        {/* Show +X more badge */}
        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-1.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-300 shadow-sm">
          +{methods.length - 1}
        </span>
      </div>

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl border border-gray-700">
          <div className="font-semibold mb-2 flex items-center gap-2">
            <CreditCard className="w-3 h-3" />
            All Payment Methods
          </div>
          <div className="flex flex-wrap gap-1">
            {methods.map((method, index) => {
              const config = getPaymentConfig(method);
              return (
                <span 
                  key={index}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] ${config.bgColor} ${config.color} border`}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

BadgePaymentMethodsDisplay.displayName = 'BadgePaymentMethodsDisplay';

// Optimized drag data
const createDragData = (booking: Booking) => ({
  type: 'booking',
  id: booking.id,
  customerName: booking.customerName,
  staff: booking.staff,
  bookingTime: booking.bookingTime,
  duration: booking.totalDuration
});

// Ultra-optimized BookingCard
const BookingCard = memo(({ 
  booking, 
  onEdit, 
  onGenerateInvoice, 
  isAdmin, 
  showTime = true, 
  slotDuration = 1,
  onDragStart,
  onDragEnd
}: any) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleInvoiceClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateInvoice(booking);
  }, [booking, onGenerateInvoice]);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.invoice-button') && 
        !(e.target as HTMLElement).closest('.drag-handle')) {
      onEdit(booking);
    }
  }, [booking, onEdit]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    const dragData = createDragData(booking);
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
    
    // Smooth visual feedback
    if (cardRef.current) {
      cardRef.current.style.transform = 'scale(0.98)';
      cardRef.current.style.opacity = '0.8';
    }
    
    onDragStart?.(booking);
  }, [booking, onDragStart]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'scale(1)';
      cardRef.current.style.opacity = '1';
    }
    onDragEnd?.();
  }, [onDragEnd]);

  // Pre-computed values
  const { serviceNames, statusStyle, position, cardHeight, displayTime } = useMemo(() => {
    const serviceNames = booking.services?.map((s: any) => s.serviceName).join(", ") || "No services";
    const statusStyle = getStatusBlock(booking.status);
    const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
    const cardHeight = slotDuration * 60 - 8;
    
    // Cache display time
    let displayTime = CACHE.displayTimes.get(booking.bookingTime);
    if (!displayTime) {
      displayTime = toDisplayAMPM(booking.bookingTime);
      CACHE.displayTimes.set(booking.bookingTime, displayTime);
    }
    
    return { serviceNames, statusStyle, position, cardHeight, displayTime };
  }, [booking, slotDuration]);

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`w-full rounded-lg ${statusStyle.background} ${statusStyle.border} ${statusStyle.text} shadow-lg hover:shadow-xl transition-all duration-200 ease-out cursor-grab active:cursor-grabbing overflow-hidden absolute top-1 left-1 right-1 bottom-1 booking-card transform-gpu`}
      style={{ 
        height: `${cardHeight}px`, 
        minHeight: '52px',
        willChange: 'transform, opacity'
      }}
      title={`Drag to move - ${booking.customerName} - ${serviceNames}`}
    >
      <div className={`${statusStyle.header} border-b border-white/20 px-2 py-1 flex justify-between items-center transition-colors duration-150`}>
        <div className="flex-1 min-w-0 pr-2">
          <div className="font-extrabold text-sm truncate flex items-center">
            <span className="drag-handle mr-1 cursor-grab transition-transform hover:scale-110">⠿</span>
            {booking.customerName}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 min-w-0">
          {booking.status === "past" && (
            <button
              onClick={handleInvoiceClick}
              className="invoice-button text-[10px] px-2 py-1 rounded-lg bg-white text-gray-800 hover:bg-gray-100 transition-all duration-150 ease-out border border-gray-300 hover:border-gray-400 whitespace-nowrap font-bold shadow-sm flex-shrink-0 hover:scale-105 transform-gpu"
            >
              💰 Invoice
            </button>
          )}
          {showTime && (
            <span className="text-[10px] font-black bg-black bg-opacity-30 px-2 py-1 rounded-md whitespace-nowrap tracking-tight flex-shrink-0 transition-opacity duration-150">
              {displayTime}
            </span>
          )}
        </div>
      </div>

      <div className="p-2 h-full flex flex-col min-w-0">
        <div className="mb-2 flex-shrink-0 min-w-0">
          <div className="text-xs font-semibold opacity-95 line-clamp-1 transition-opacity duration-150">
            {serviceNames}
          </div>
        </div>

        <div className="flex-1 min-h-0 space-y-1 min-w-0">
          <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0 transition-opacity duration-150">
            <Clock className="w-3 h-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">
              {displayTime} - {toDisplayAMPM(position.endTime)}
            </span>
          </div>

          <PaymentMethodsDisplay paymentMethods={booking.paymentMethods || booking.paymentMethod} />
          
          {booking.staff && slotDuration >= 2 && (
            <div className="flex items-center text-[11px] font-semibold opacity-95 min-w-0 transition-opacity duration-150">
              <User className="w-3 h-3 mr-1.5 flex-shrink-0" />
              <span className="truncate">{booking.staff}</span>
            </div>
          )}
        </div>

        <div className="absolute bottom-1 right-1 transition-transform duration-150 hover:scale-105">
          <div className="text-[10px] font-bold bg-black bg-opacity-40 px-2 py-0.5 rounded-md border border-white/20 transform-gpu">
            {booking.totalDuration || 30}m
          </div>
        </div>
      </div>
    </div>
  );
});

BookingCard.displayName = 'BookingCard';

const StaffHeader = memo(({ staffName }: { staffName: string }) => (
  <div className="sticky top-0 z-20 bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-300 px-4 py-3 font-extrabold text-gray-800 text-sm truncate transition-colors duration-150 hover:bg-gray-200/50">
    {staffName}
  </div>
));

StaffHeader.displayName = 'StaffHeader';

const TimeSlot = memo(({ time }: { time: string }) => {
  const displayTime = useMemo(() => toDisplayAMPM(time), [time]);
  
  return (
    <div className="sticky left-0 z-10 bg-gray-100 border-r-2 border-gray-300 px-4 py-4 font-bold text-gray-800 h-[60px] flex items-center truncate transition-colors duration-150 hover:bg-gray-200">
      {displayTime}
    </div>
  );
});

TimeSlot.displayName = 'TimeSlot';

// Optimized ScheduleCell
const ScheduleCell = memo(({ 
  time, 
  staff, 
  isOccupied, 
  hasPrimary, 
  onCellClick, 
  onDropBooking,
  cellBookings,
  primaryBookings,
  isPrimarySlot,
  getSlotDuration,
  onEditBooking,
  onGenerateInvoice,
  isAdmin,
  onDragStart,
  onDragEnd
}: any) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isOccupied && !isDragOver) {
      setIsDragOver(true);
    }
  }, [isOccupied, isDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only leave if not dragging over child elements
    if (!cellRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      if (dragData.type === 'booking') {
        onDropBooking(dragData, staff, time);
      }
    } catch (error) {
      console.log('Invalid drop data');
    }
  }, [staff, time, onDropBooking]);

  const handleClick = useCallback(() => {
    if (!isOccupied) {
      onCellClick(staff, time);
    }
  }, [isOccupied, staff, time, onCellClick]);

  // Memoized cell content
  const cellContent = useMemo(() => {
    if (isDragOver && !isOccupied) {
      return (
        <div className="flex flex-col items-center justify-center text-blue-600 font-bold h-full animate-pulse">
          <div className="text-2xl mb-1 transform-gpu">⬇️</div>
          <div className="text-xs">Drop to Move</div>
        </div>
      );
    }

    if (!isOccupied && !hasPrimary) {
      return (
        <button
          className="flex items-center justify-center w-10 h-10 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 rounded-full transition-all duration-200 ease-out border-2 border-dashed border-emerald-400 hover:border-emerald-500 hover:shadow-lg z-10 transform-gpu hover:scale-110"
          onClick={(e) => {
            e.stopPropagation();
            onCellClick(staff, time);
          }}
          title="Add Booking"
        >
          <Plus className="w-5 h-5 font-bold transition-transform duration-200" />
        </button>
      );
    }

    return primaryBookings.map((b: Booking) => {
      const slotDuration = getSlotDuration(b);
      return (
        <BookingCard
          key={`booking-${b.id}-${time}-${staff}`}
          booking={b}
          onEdit={onEditBooking}
          onGenerateInvoice={onGenerateInvoice}
          isAdmin={isAdmin}
          showTime={isPrimarySlot(b, time)}
          slotDuration={slotDuration}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      );
    });
  }, [
    isDragOver, isOccupied, hasPrimary, primaryBookings, staff, time, 
    onCellClick, getSlotDuration, onEditBooking, onGenerateInvoice, 
    isAdmin, isPrimarySlot, onDragStart, onDragEnd
  ]);

  return (
    <div
      ref={cellRef}
      className={`border-r border-gray-200 relative h-full transition-all duration-200 ease-out transform-gpu ${
        isDragOver 
          ? 'bg-blue-100 border-2 border-blue-400 border-dashed scale-[0.98]' 
          : !isOccupied 
            ? 'hover:bg-gray-50/80 cursor-pointer hover:scale-[1.02]' 
            : 'hover:bg-gray-50/30'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      style={{ willChange: 'transform, background-color' }}
    >
      <div className="p-1 h-full relative">
        {cellContent}
      </div>
    </div>
  );
});

ScheduleCell.displayName = 'ScheduleCell';

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
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange(localSearch);
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
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
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border border-gray-200 mb-4 transition-all duration-300 ease-out hover:shadow-md">
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
        <div className="flex-1 w-full">
          <label className="text-sm font-medium text-gray-700 mb-1 block transition-colors duration-150">
            Search Bookings
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors duration-150" />
            <input
              type="text"
              placeholder="Search by customer name, service, branch..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-out hover:border-gray-400 transform-gpu"
            />
          </div>
        </div>

        <div className="w-full lg:w-40">
          <label className="text-sm font-medium text-gray-700 mb-1 block transition-colors duration-150">
            Branch
          </label>
          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-out hover:border-gray-400 transform-gpu"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-40">
          <label className="text-sm font-medium text-gray-700 mb-1 block transition-colors duration-150">
            Staff
          </label>
          <select
            value={filters.staff}
            onChange={(e) => handleFilterChange('staff', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-out hover:border-gray-400 transform-gpu"
          >
            <option value="">All Staff</option>
            <option value="Unassigned">Unassigned</option>
            {staff.map(staffMember => (
              <option key={staffMember} value={staffMember}>{staffMember}</option>
            ))}
          </select>
        </div>

        <div className="w-full lg:w-40">
          <label className="text-sm font-medium text-gray-700 mb-1 block transition-colors duration-150">
            Date
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-out hover:border-gray-400 transform-gpu"
          />
        </div>

        <div className="w-full lg:w-40">
          <label className="text-sm font-medium text-gray-700 mb-1 block transition-colors duration-150">
            Time
          </label>
          <select
            value={filters.time}
            onChange={(e) => handleFilterChange('time', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ease-out hover:border-gray-400 transform-gpu"
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
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 ease-out hover:scale-105 transform-gpu"
            >
              <X className="w-4 h-4 transition-transform duration-150" />
              Clear
            </button>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 transition-all duration-200">
          <Filter className="w-4 h-4 animate-pulse" />
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
  const [draggedBooking, setDraggedBooking] = useState<Booking | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Notification system
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    setTimeout(() => {
      removeNotification(id);
    }, notification.duration || 4000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Optimized drag handlers
  const handleDragStart = useCallback((booking: Booking) => {
    setDraggedBooking(booking);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBooking(null);
  }, []);

  // Optimized drop handler
  const handleDropBooking = useCallback((dragData: any, newStaff: string, newTime: string) => {
    const originalBooking = bookings.find(b => b.id === dragData.id);
    if (!originalBooking) {
      addNotification({
        type: 'error',
        title: 'Move Failed',
        message: 'Could not find booking data',
        duration: 3000
      });
      return;
    }

    const confirmed = window.confirm(
      `Move booking for ${originalBooking.customerName} to ${newStaff} at ${toDisplayAMPM(newTime)}?`
    );
    
    if (confirmed) {
      const updatedBooking = {
        ...originalBooking,
        staff: newStaff,
        bookingTime: newTime
      };
      
      onEditBooking(updatedBooking);
      
      addNotification({
        type: 'success',
        title: 'Booking Moved',
        message: `Successfully moved ${originalBooking.customerName} to ${newStaff} at ${toDisplayAMPM(newTime)}`,
        duration: 4000
      });
    }
  }, [bookings, onEditBooking, addNotification]);

  const effectiveFilters = Object.keys(filters).length > 0 ? filters : localFilters;
  const effectiveSearchTerm = searchTerm || localSearchTerm;

  // Memoized computations
  const enabledTimeSlots = useMemo(() => {
    return TIMESLOTS.filter(time => {
      const hour = time.split(":")[0];
      return enabledHours[hour] === true;
    });
  }, [enabledHours]);

  const uniqueStaffOptions = useMemo(() => {
    const staffSet = new Set(staffOptions || []);
    staffSet.add("Unassigned");
    
    bookings?.forEach(booking => {
      if (booking.staff?.trim() && !staffSet.has(booking.staff)) {
        staffSet.add(booking.staff);
      }
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
    
    return [
      Array.from(branches).sort(),
      Array.from(times).sort()
    ];
  }, [bookings]);

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

  const filteredBookings = useMemo(() => {
    if (!bookings?.length) return [];

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
    
    if (!hasSearch && !hasFilters) return filtered;

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
          if (booking.staff && booking.staff.trim() && booking.staff !== "—") return false;
        } else if (booking.staff !== effectiveFilters.staff) return false;
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

  const bookingCellMap = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};
    
    enabledTimeSlots.forEach(time => {
      map[time] = {};
      visibleStaffMembers.forEach(staff => {
        map[time][staff] = [];
      });
    });

    filteredBookings.forEach(booking => {
      const timeSlots = getBookingTimeSlots(booking);
      const staff = booking.staff && visibleStaffMembers.includes(booking.staff) 
        ? booking.staff 
        : "Unassigned";

      timeSlots.forEach(timeSlot => {
        if (map[timeSlot]?.[staff]) {
          const cellBookings = map[timeSlot][staff];
          if (!cellBookings.some(b => b.id === booking.id)) {
            cellBookings.push(booking);
          }
        }
      });
    });

    return map;
  }, [filteredBookings, enabledTimeSlots, visibleStaffMembers, getBookingTimeSlots]);

  const { isPrimarySlot, getSlotDuration, isCellOccupied, hasPrimaryBookings } = useMemo(() => ({
    isPrimarySlot: (booking: Booking, time: string) => {
      const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
      return TIMESLOTS[position.startSlotIndex] === time;
    },
    getSlotDuration: (booking: Booking) => {
      const position = calculateBookingPosition(booking.bookingTime, booking.totalDuration || 30);
      return position.durationInSlots;
    },
    isCellOccupied: (time: string, staff: string) => {
      const cellBookings = bookingCellMap[time]?.[staff] || [];
      return cellBookings.length > 0;
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

  const hasActiveFilters = useMemo(() => {
    return effectiveSearchTerm || 
           effectiveFilters.branch || 
           effectiveFilters.staff || 
           effectiveFilters.date || 
           effectiveFilters.time;
  }, [effectiveSearchTerm, effectiveFilters]);

  return (
    <>
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />

      <div className="relative overflow-hidden rounded-2xl bg-slate-50 border-2 border-gray-300 shadow-2xl backdrop-blur-sm mb-0 transition-all duration-300 ease-out hover:shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-pulse-slow"></div>

        <div className="relative p-6 border-b-2 border-gray-300 bg-gradient-to-r from-gray-50 to-white transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg border-2 border-indigo-400 transition-transform duration-300 hover:scale-105 transform-gpu">
              <Calendar className="w-5 h-5 text-white transition-transform duration-200" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-800 tracking-wide transition-colors duration-150">
                Schedule Board
              </h3>
              <div className="text-sm text-gray-600 mt-1 transition-all duration-200">
                {filteredBookings.length} bookings • {enabledTimeSlots.length} time slots • {visibleStaffMembers.length} staff
                {draggedBooking && (
                  <span className="ml-2 text-blue-600 font-bold animate-pulse">
                    🎯 Dragging: {draggedBooking.customerName}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent transition-all duration-300"></div>
            <div className="text-sm font-semibold text-gray-600 transition-colors duration-150">
              {hasActiveFilters && (
                <span className="text-blue-600 animate-pulse">Filters Active</span>
              )}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-4 transition-all duration-300">
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

        <div className="relative overflow-x-auto w-full transition-all duration-300">
          {/* Staff Header Row */}
          <div 
            className="grid sticky top-0 z-30 bg-white border-b-2 border-gray-300 transition-all duration-300"
            style={{
              gridTemplateColumns: `180px repeat(${visibleStaffMembers.length}, 200px)`,
            }}
          >
            <div className="sticky left-0 z-40 bg-white border-r-2 border-gray-300 px-4 py-3 font-extrabold text-gray-800 h-[60px] flex items-center transition-colors duration-150 hover:bg-gray-100">
              Time
            </div>
            {visibleStaffMembers.map((staffName) => (
              <StaffHeader key={`staff-header-${staffName}`} staffName={staffName} />
            ))}
          </div>

          {/* Time Slots Rows */}
          {enabledTimeSlots.length === 0 ? (
            <div className="text-center py-12 text-gray-500 transition-all duration-300">
              <p>No time slots enabled. Please enable hours in the schedule controls.</p>
            </div>
          ) : (
            enabledTimeSlots.map((time) => (
              <div
                key={`timeslot-${time}`}
                className="grid border-b border-gray-200 transition-all duration-200 ease-out hover:bg-gray-50/30"
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
                    <ScheduleCell
                      key={`cell-${time}-${sName}`}
                      time={time}
                      staff={sName}
                      isOccupied={isOccupied}
                      hasPrimary={hasPrimary}
                      onCellClick={handleCellClick}
                      onDropBooking={handleDropBooking}
                      cellBookings={cellBookings}
                      primaryBookings={primaryBookings}
                      isPrimarySlot={isPrimarySlot}
                      getSlotDuration={getSlotDuration}
                      onEditBooking={onEditBooking}
                      onGenerateInvoice={onGenerateInvoice}
                      isAdmin={isAdmin}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Drag & Drop Instructions */}
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-3 transition-all duration-300">
          <div className="text-sm text-blue-700 text-center animate-pulse-slow">
            <strong>💡 Pro Tip:</strong> Drag booking cards to move them to different time slots or staff members
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-in {
          animation-duration: 300ms;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        .slide-in-from-right-full {
          animation-name: slideInFromRightFull;
        }
        @keyframes slideInFromRightFull {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .transform-gpu {
          transform: translateZ(0);
        }
      `}</style>
    </>
  );
}