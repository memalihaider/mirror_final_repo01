import { Calendar, CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";
import { Booking } from '@/types/booking';
import { useMemo, useCallback, memo } from "react";

interface ScheduleDashboardProps {
  bookings: Booking[];
  enabledHours: Record<string, boolean>;
  onHoursChange: (hours: Record<string, boolean>) => void;
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

// Memoize the AM/PM conversion function
const toDisplayAMPM = (hhmm: string) => {
  const [hStr, m] = hhmm.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
};

// Memoize static data outside component
const TIME_SLOTS = generateTimeSlots();
const UNIQUE_HOURS = Array.from(new Set(TIME_SLOTS.map((t) => t.split(":")[0]))).sort((a, b) => Number(a) - Number(b));

// Color configuration outside component to prevent recreation
const COLOR_CONFIG = {
  blue: {
    gradient: 'from-blue-500 to-cyan-600',
    text: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  green: {
    gradient: 'from-green-500 to-emerald-600',
    text: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  amber: {
    gradient: 'from-amber-500 to-yellow-600',
    text: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200'
  },
  red: {
    gradient: 'from-red-500 to-rose-600',
    text: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200'
  }
};

// Memoized stat card component to prevent unnecessary re-renders
const CompactStatCard = memo(({ title, value, icon: Icon, color }: any) => {
  const config = COLOR_CONFIG[color];

  return (
    <div className={`group relative overflow-hidden rounded-lg ${config.bg} border ${config.border} p-3 transition-all duration-200 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 bg-gradient-to-r ${config.gradient} rounded-lg shadow-sm`}>
            <Icon className="w-3 h-3 text-white" />
          </div>
          <span className={`text-xs font-medium ${config.text}`}>
            {title}
          </span>
        </div>
        <div className={`text-lg font-bold ${config.text}`}>
          {value}
        </div>
      </div>
    </div>
  );
});

CompactStatCard.displayName = 'CompactStatCard';

// Memoized hour toggle component
const CompactHourToggle = memo(({ hour, enabled, onChange }: any) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  }, [onChange]);

  const displayHour = Number(hour) > 12 ? Number(hour) - 12 : Number(hour) === 0 ? 12 : Number(hour);

  return (
    <label 
      className="relative cursor-pointer group"
      title={toDisplayAMPM(`${hour}:00`)}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={handleChange}
        className="sr-only"
      />
      <div className={`
        relative p-1.5 rounded text-[10px] font-medium text-center transition-all duration-150
        border backdrop-blur-sm min-w-[32px]
        ${enabled
          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm border-green-500'
          : 'bg-white/80 text-gray-600 border-gray-300 group-hover:bg-white group-hover:border-gray-400'
        }
        group-hover:scale-105
      `}>
        <div className="flex items-center justify-center">
          {enabled ? (
            <CheckCircle className="w-2.5 h-2.5" />
          ) : (
            <span className="text-[10px] font-medium">
              {displayHour}
            </span>
          )}
        </div>

        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          {toDisplayAMPM(`${hour}:00`)}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    </label>
  );
});

CompactHourToggle.displayName = 'CompactHourToggle';

export function ScheduleDashboard({ bookings, enabledHours, onHoursChange }: ScheduleDashboardProps) {
  // Memoized stats calculation
  const stats = useMemo(() => {
    let total = bookings.length;
    let upcoming = 0;
    let past = 0;
    let cancelled = 0;

    // Single pass through bookings for better performance
    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      switch (booking.status) {
        case "upcoming":
          upcoming++;
          break;
        case "past":
          past++;
          break;
        case "cancelled":
          cancelled++;
          break;
      }
    }

    return { total, upcoming, past, cancelled };
  }, [bookings]);

  // Memoized enabled count calculation
  const enabledCount = useMemo(() => {
    let count = 0;
    const values = Object.values(enabledHours);
    for (let i = 0; i < values.length; i++) {
      if (values[i]) count++;
    }
    return count;
  }, [enabledHours]);

  const totalCount = UNIQUE_HOURS.length;

  // Optimized toggle handlers
  const handleToggleAll = useCallback((enable: boolean) => {
    const newHours: Record<string, boolean> = {};
    for (let i = 0; i < UNIQUE_HOURS.length; i++) {
      newHours[UNIQUE_HOURS[i]] = enable;
    }
    onHoursChange(newHours);
  }, [onHoursChange]);

  const handleHourChange = useCallback((hour: string, enabled: boolean) => {
    onHoursChange({ ...enabledHours, [hour]: enabled });
  }, [enabledHours, onHoursChange]);

  return (
    <div className="w-full">
      {/* Compact Dashboard Container */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-white/20 shadow-lg backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/3 via-purple-500/3 to-pink-500/3"></div>

        <div className="relative p-4 sm:p-5">
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Schedule Controls</h3>
                <p className="text-xs text-gray-600 hidden sm:block">
                  {enabledCount}/{totalCount} hours enabled
                </p>
              </div>
            </div>
            
            {/* Quick Stats - Compact */}
            <div className="flex items-center gap-3">
              <div className="text-center">
                <div className="text-sm font-bold text-indigo-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-600">{stats.upcoming}</div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </div>

          {/* Main Content - Single Row Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Stats Section - Compact */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
                <CompactStatCard 
                  title="Total" 
                  value={stats.total} 
                  icon={Calendar} 
                  color="blue" 
                />
                <CompactStatCard 
                  title="Upcoming" 
                  value={stats.upcoming} 
                  icon={CheckCircle} 
                  color="green" 
                />
                <CompactStatCard 
                  title="Completed" 
                  value={stats.past} 
                  icon={AlertCircle} 
                  color="amber" 
                />
                <CompactStatCard 
                  title="Cancelled" 
                  value={stats.cancelled} 
                  icon={XCircle} 
                  color="red" 
                />
              </div>
            </div>

            {/* Hours Control - Compact */}
            <div className="lg:col-span-8">
              <div className="bg-white/50 rounded-lg p-4 border border-white/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Business Hours</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleAll(true)}
                      className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleToggleAll(false)}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* Compact Hours Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1">
                  {UNIQUE_HOURS.map((hour) => (
                    <CompactHourToggle 
                      key={hour}
                      hour={hour}
                      enabled={!!enabledHours[hour]}
                      onChange={(enabled: boolean) => handleHourChange(hour, enabled)}
                    />
                  ))}
                </div>

                {/* Status Legend */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Enabled</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      <span>Disabled</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {enabledCount}/{totalCount} enabled
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}