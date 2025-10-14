import { useState, useCallback, useMemo, memo } from 'react';

interface FilterBarProps {
  branches: string[];
  staff: string[];
  uniqueTimes: string[];
  onFiltersChange: (filters: any) => void;
}

// Memoize helper functions outside component
const toDisplayAMPM = (hhmm: string) => {
  const [hStr, m] = hhmm.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  return `${h}:${m} ${suffix}`;
};

// Memoized Select component to prevent unnecessary re-renders
const FilterSelect = memo(({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = "All",
  showTimeFormat = false 
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder?: string;
  showTimeFormat?: boolean;
}) => (
  <div className="flex-shrink-0">
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[140px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {showTimeFormat ? `${toDisplayAMPM(option)} (${option})` : option}
        </option>
      ))}
    </select>
  </div>
));

FilterSelect.displayName = 'FilterSelect';

// Memoized Input component
const FilterInput = memo(({ 
  label, 
  value, 
  onChange, 
  type = "text",
  placeholder = "" 
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div className="flex-1 min-w-[200px]">
    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm w-full bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    />
  </div>
));

FilterInput.displayName = 'FilterInput';

export function BookingsFilterBar({ branches, staff, uniqueTimes, onFiltersChange }: FilterBarProps) {
  const [filters, setFilters] = useState({
    branch: "",
    staff: "",
    date: "",
    customer: "",
    time: ""
  });

  // Memoize the filter change handler
  const handleFilterChange = useCallback((key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  // Memoize clear filters function
  const clearFilters = useCallback(() => {
    const clearedFilters = {
      branch: "",
      staff: "",
      date: "",
      customer: "",
      time: ""
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

  // Memoize individual filter handlers to prevent recreation
  const handleBranchChange = useCallback((value: string) => {
    handleFilterChange('branch', value);
  }, [handleFilterChange]);

  const handleStaffChange = useCallback((value: string) => {
    handleFilterChange('staff', value);
  }, [handleFilterChange]);

  const handleDateChange = useCallback((value: string) => {
    handleFilterChange('date', value);
  }, [handleFilterChange]);

  const handleCustomerChange = useCallback((value: string) => {
    handleFilterChange('customer', value);
  }, [handleFilterChange]);

  const handleTimeChange = useCallback((value: string) => {
    handleFilterChange('time', value);
  }, [handleFilterChange]);

  // Memoize option arrays to prevent unnecessary re-renders
  const memoizedBranches = useMemo(() => branches, [branches]);
  const memoizedStaff = useMemo(() => staff, [staff]);
  const memoizedUniqueTimes = useMemo(() => uniqueTimes, [uniqueTimes]);

  // Check if any filter is active for conditional rendering
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => value !== "");
  }, [filters]);

  return (
    <div className="mb-6 w-full">
      <div className="w-full flex flex-wrap items-end gap-4 bg-white/80 dark:bg-slate-800/60 p-4 rounded-2xl shadow-sm border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
        {/* Branch Filter */}
        <FilterSelect
          label="Branch"
          value={filters.branch}
          options={memoizedBranches}
          onChange={handleBranchChange}
          placeholder="All Branches"
        />

        {/* Staff Filter */}
        <FilterSelect
          label="Staff"
          value={filters.staff}
          options={memoizedStaff}
          onChange={handleStaffChange}
          placeholder="All Staff"
        />

        {/* Date Filter */}
        <div className="flex-shrink-0">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
            Date
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white min-w-[140px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Customer Search */}
        <FilterInput
          label="Customer"
          value={filters.customer}
          onChange={handleCustomerChange}
          placeholder="Search customer..."
        />

        {/* Time Filter */}
        <FilterSelect
          label="Time"
          value={filters.time}
          options={memoizedUniqueTimes}
          onChange={handleTimeChange}
          placeholder="All Times"
          showTimeFormat={true}
        />

        {/* Clear filters button - Only show when filters are active */}
        {hasActiveFilters && (
          <div className="flex-shrink-0">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-600 hover:bg-gray-200 dark:hover:bg-slate-500 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span>Filters active</span>
        </div>
      )}
    </div>
  );
}