import { useState } from 'react';

interface FilterBarProps {
  branches: string[];
  staff: string[];
  uniqueTimes: string[];
  onFiltersChange: (filters: any) => void;
}

export function BookingsFilterBar({ branches, staff, uniqueTimes, onFiltersChange }: FilterBarProps) {
  const [filters, setFilters] = useState({
    branch: "",
    staff: "",
    date: "",
    customer: "",
    time: ""
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      branch: "",
      staff: "",
      date: "",
      customer: "",
      time: ""
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toDisplayAMPM = (hhmm: string) => {
    const [hStr, m] = hhmm.split(":");
    let h = Number(hStr);
    const suffix = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    if (h > 12) h = h - 12;
    return `${h}:${m} ${suffix}`;
  };

  return (
    <div className="mb-6">
      <div className="w-full flex flex-wrap items-center gap-3 mb-4 bg-white/80 dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm">
        {/* Branch */}
        <div>
          <label className="text-xs block mb-1">Branch</label>
          <select
            value={filters.branch}
            onChange={(e) => handleFilterChange('branch', e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Staff */}
        <div>
          <label className="text-xs block mb-1">Staff</label>
          <select
            value={filters.staff}
            onChange={(e) => handleFilterChange('staff', e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Staff</option>
            {staff.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs block mb-1">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
        </div>

        {/* Customer */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs block mb-1">Customer</label>
          <input
            type="text"
            placeholder="Search customer"
            value={filters.customer}
            onChange={(e) => handleFilterChange('customer', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        {/* Time Interval */}
        <div>
          <label className="text-xs block mb-1">Time</label>
          <select
            value={filters.time}
            onChange={(e) => handleFilterChange('time', e.target.value)}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Times</option>
            {uniqueTimes.map((time) => (
              <option key={time} value={time}>
                {toDisplayAMPM(time)} ({time})
              </option>
            ))}
          </select>
        </div>

        {/* Clear filters button */}
        <div className="ml-auto self-end">
          <button
            onClick={clearFilters}
            className="px-3 py-2 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}