import { useState, useMemo } from 'react';
import { Calendar, Clock, User, CreditCard } from "lucide-react";
import { format, isSameDay } from 'date-fns';
import { Booking } from '@/types/booking';

interface ScheduleBoardProps {
  bookings: Booking[];
  staffOptions: string[];
  scheduleDate: string;
  scheduleBranch: string;
  enabledHours: Record<string, boolean>;
  onCellClick: (staff: string, time: string) => void;
  onEditBooking: (booking: Booking) => void;
  onGenerateInvoice: (booking: Booking) => void;
}

const TIMESLOTS = generateTimeSlots();

function generateTimeSlots(start = 0, end = 12 * 120, step = 15) {
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

function toDisplayAMPM(hhmm: string) {
  const [hStr, m] = hhmm.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
}

function getStatusBlock(status: string) {
  switch (status) {
    case "upcoming":
      return "bg-emerald-50 border-emerald-300 text-emerald-800";
    case "past":
      return "bg-gray-50 border-gray-300 text-gray-700";
    case "cancelled":
      return "bg-rose-50 border-rose-300 text-rose-800 line-through";
    default:
      return "bg-slate-50 border-slate-300 text-slate-800";
  }
}

export function ScheduleBoard({ 
  bookings, 
  staffOptions, 
  scheduleDate, 
  scheduleBranch, 
  enabledHours, 
  onCellClick, 
  onEditBooking, 
  onGenerateInvoice 
}: ScheduleBoardProps) {
  
  // Remove duplicate staff names and ensure uniqueness
  const uniqueStaffOptions = useMemo(() => {
    const seen = new Set();
    return staffOptions.filter(staff => {
      if (seen.has(staff)) {
        console.warn(`Duplicate staff name found: ${staff}`);
        return false;
      }
      seen.add(staff);
      return true;
    });
  }, [staffOptions]);

  const scheduleMatrix = useMemo(() => {
    const map: Record<string, Record<string, Booking[]>> = {};

    // Initialize empty slots
    TIMESLOTS.forEach((t) => {
      map[t] = {};
      uniqueStaffOptions.forEach((s) => (map[t][s] = []));
      map[t]["Unassigned"] = [];
    });

    bookings.forEach((b) => {
      const matchDate = format(b.bookingDate, "yyyy-MM-dd") === scheduleDate;
      const matchBranch = scheduleBranch === "all" || b.branch === scheduleBranch;
      const hour = b.bookingTime?.split(":")[0] ?? "";
      const hourEnabled = !!enabledHours[hour];

      if (!matchDate || !matchBranch || !hourEnabled) return;

      const t = b.bookingTime;
      const sName = b.staff && uniqueStaffOptions.includes(b.staff) ? b.staff : "Unassigned";

      if (!map[t]) map[t] = {};
      if (!map[t][sName]) map[t][sName] = [];

      map[t][sName].push(b);
    });

    return map;
  }, [bookings, scheduleDate, scheduleBranch, uniqueStaffOptions, enabledHours]);

  const formatDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  };

  const normalizeTime = (timeStr: string) => {
    if (!timeStr) return "";
    let [hh, mm] = timeStr.split(":");
    if (!mm) mm = "00";
    const lowerTime = timeStr.toLowerCase();
    const isPM = lowerTime.includes("pm");
    const isAM = lowerTime.includes("am");
    hh = hh.replace(/\D/g, "");
    let hourNum = parseInt(hh, 10);
    if (isPM && hourNum !== 12) hourNum += 12;
    if (isAM && hourNum === 12) hourNum = 0;
    return `${hourNum.toString().padStart(2, "0")}:${mm.substring(0, 2)}`;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-gray-100 border border-white/20 shadow-2xl backdrop-blur-sm mb-10 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>

      {/* Header */}
      <div className="relative p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg animate-float">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800">Schedule Board</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-transparent"></div>
        </div>
        <div className="absolute top-2 right-2 w-12 h-12 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-bounce-subtle"></div>
      </div>

      <div className="relative overflow-x-auto w-full">
        <div className="w-full relative">
          <div
            className="grid sticky top-0 z-20"
            style={{
              gridTemplateColumns: `180px repeat(${uniqueStaffOptions.length}, 200px)`,
            }}
          >
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white border-b border-gray-600 px-4 py-4 font-bold sticky left-0 z-30 shadow-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Time
              </div>
            </div>
            {uniqueStaffOptions.map((sName, index) => (
              <div
                key={`staff-${sName}-${index}`}
                className={`bg-gradient-to-r ${index % 2 === 0
                  ? 'from-blue-500 to-indigo-600'
                  : 'from-purple-500 to-pink-600'
                  } text-white border-b border-white/20 px-4 py-4 font-bold text-center shadow-lg animate-fade-in-delay`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center gap-2">
                  <User className="w-4 h-4" />
                  {sName}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {TIMESLOTS.map((t) => {
            const hour = t.split(":")[0].padStart(2, "0");
            const hourEnabled = !!enabledHours[hour];
            if (!hourEnabled) return null;

            return (
              <div
                key={`timeslot-${t}`}
                className="grid"
                style={{
                  gridTemplateColumns: `180px repeat(${uniqueStaffOptions.length}, 200px)`,
                }}
              >
                <div className="sticky left-0 z-10 bg-gray-50 border-t border-b px-4 py-3 font-medium">
                  {toDisplayAMPM(t)}
                </div>

                {uniqueStaffOptions.map((sName) => {
                  const today = new Date();
                  const yesterday = new Date();
                  yesterday.setDate(today.getDate() - 1);
                  const allowedDates = [formatDate(yesterday), formatDate(today)];

                  const allItems = bookings.filter((b) => {
                    const bookingDay = formatDate(b.bookingDate);
                    const normalizedBookingTime = normalizeTime(b.bookingTime);

                    const [startHour, startMin] = normalizedBookingTime.split(":").map(Number);
                    const bookingStart = startHour * 60 + startMin;
                    const bookingEnd = bookingStart + (b.totalDuration || 30);

                    const normalizedSlotTime = normalizeTime(t);
                    const [slotHour, slotMin] = normalizedSlotTime.split(":").map(Number);
                    const slotMinutes = slotHour * 60 + slotMin;

                    const staffMatch = b.staff ? b.staff === sName : true;

                    return (
                      staffMatch &&
                      allowedDates.includes(bookingDay) &&
                      slotMinutes >= bookingStart &&
                      slotMinutes < bookingEnd
                    );
                  });

                  return (
                    <div
                      key={`cell-${t}-${sName}`}
                      className={`border-t border-b border-l px-2 py-2 min-h-[64px] ${!hourEnabled
                        ? "bg-gray-50 opacity-70 pointer-events-none"
                        : ""
                        }`}
                      onClick={(e) => {
                        if (!hourEnabled) return;
                        if (allItems.length === 0) {
                          onCellClick(sName, t);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        {allItems.map((b) => (
                          <BookingCard
                            key={`booking-${b.id}-${t}-${sName}`}
                            booking={b}
                            onEdit={onEditBooking}
                            onGenerateInvoice={onGenerateInvoice}
                          />
                        ))}

                        {allItems.length === 0 && hourEnabled && (
                          <div className="w-full h-full flex items-center justify-center">
                            <button
                              className="text-[11px] text-emerald-700 hover:text-emerald-900"
                              onClick={() => onCellClick(sName, t)}
                            >
                              +
                            </button>
                          </div>
                        )}

                        {allItems.length === 0 && !hourEnabled && (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            Disabled
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking, onEdit, onGenerateInvoice }: any) {
  const handleInvoiceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onGenerateInvoice(booking);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger edit if the click wasn't on the invoice button
    if (!(e.target as HTMLElement).closest('.invoice-button')) {
      onEdit(booking);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`w-full text-left text-xs rounded-md border px-2 py-2 hover:shadow transition cursor-pointer ${getStatusBlock(
        booking.status
      )}`}
      title={`${booking.customerName} @ ${booking.bookingTime}`}
    >
      <div className="flex justify-between items-start">
        <div className="font-semibold truncate">
          {booking.customerName}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleInvoiceClick}
            className="invoice-button text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
            title="Generate Invoice"
          >
            Invoice
          </button>
          <span className="text-[11px] opacity-80">
            {toDisplayAMPM(booking.bookingTime)}
          </span>
        </div>
      </div>
      <div className="truncate text-[12px]">
        {booking.services.map((s: any) => s.serviceName).join(", ")}
      </div>
      <div className="flex items-center text-[11px] opacity-80 mt-1">
        <Clock className="w-3 h-3 mr-1" />
        {toDisplayAMPM(booking.bookingTime)} • {booking.totalDuration}m
      </div>
      <div className="flex items-center text-[11px] opacity-80 mt-1">
        <CreditCard className="w-3 h-3 mr-1" />
        {booking.paymentMethod || "cash"}
      </div>
    </div>
  );
}