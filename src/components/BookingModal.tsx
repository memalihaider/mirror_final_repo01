import { useState, useEffect, useCallback, memo } from 'react';
import { XCircle, Trash2, Plus } from "lucide-react";
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingService, BookingFormData } from '@/types/booking';

// Memoized components to prevent unnecessary re-renders
const ServiceRow = memo(({ service, index, serviceOptions, selectedCategory, onChange, onRemove, showRemove }: any) => {
  const handleChange = useCallback((field: string, value: any) => {
    onChange(index, field, value);
  }, [index, onChange]);

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
      <div className="col-span-4">
        <select
          className="w-full border rounded-md px-3 py-2"
          value={service.serviceName}
          onChange={(e) => handleChange("serviceName", e.target.value)}
        >
          <option value="">Select a service</option>
          {serviceOptions
            .filter((serviceOption: any) =>
              selectedCategory
                ? serviceOption.category === selectedCategory
                : true
            )
            .map((serviceOption: any) => (
              <option key={serviceOption.id} value={serviceOption.name}>
                {serviceOption.name}
              </option>
            ))}
        </select>
      </div>
      <div className="col-span-2">
        <input
          type="number"
          min={0}
          className="w-full border rounded-md px-3 py-2"
          value={service.duration}
          onChange={(e) => handleChange("duration", Number(e.target.value || 0))}
        />
      </div>
      <div className="col-span-2">
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border rounded-md px-3 py-2"
          value={service.price}
          onChange={(e) => handleChange("price", Number(e.target.value || 0))}
        />
      </div>
      <div className="col-span-1">
        <input
          type="number"
          min={1}
          className="w-full border rounded-md px-3 py-2"
          value={service.quantity}
          onChange={(e) => handleChange("quantity", Number(e.target.value || 1))}
        />
      </div>
      <div className="col-span-1 flex justify-end items-center">
        {showRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-2 rounded hover:bg-red-50 text-red-600 transition-colors"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

ServiceRow.displayName = 'ServiceRow';

interface BookingModalProps {
  isOpen: boolean;
  isEditing: boolean;
  editingId: string | null;
  bookingData: BookingFormData | null;
  staffOptions: string[];
  serviceOptions: any[];
  paymentMethods: any[];
  enabledHours: Record<string, boolean>;
  onSave: (data: BookingFormData, editingId?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
  onGenerateInvoice?: (booking: Booking) => void;
}

const emptyService: BookingService = {
  serviceId: "",
  serviceName: "",
  category: "",
  duration: 30,
  price: 0,
  quantity: 1,
};

const BRANCH_OPTIONS = [
  "AI Bustaan",
  "Marina",
  "TECOM",
  "AL Muraqabat",
  "IBN Batutta Mall",
];

const PAYMENT_METHODS = ["cash", "card", "tabby", "tamara", "apple pay", "google pay", "samsung wallet", "paypal", "american express", "ewallet STC pay", "bank transfer", "cash on delivery", "other"];

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

function calcTotals(services: BookingService[]) {
  const totalPrice = services.reduce(
    (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
    0
  );
  const totalDuration = services.reduce(
    (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
    0
  );
  return { totalPrice, totalDuration };
}

export function BookingModal({
  isOpen,
  isEditing,
  editingId,
  bookingData,
  staffOptions,
  serviceOptions,
  paymentMethods,
  enabledHours,
  onSave,
  onDelete,
  onClose,
  onGenerateInvoice
}: BookingModalProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    branch: BRANCH_OPTIONS[0],
    serviceDate: format(new Date(), "yyyy-MM-dd"),
    serviceTime: "10:00",
    customerName: "",
    customerEmail: "",
    paymentMethod: "cash",
    customPaymentMethod: "",
    emailConfirmation: false,
    smsConfirmation: false,
    status: "upcoming",
    staff: "",
    services: [{ ...emptyService }],
    remarks: "",
    tip: 0,
    discount: 0
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Optimized form data update
  useEffect(() => {
    if (isOpen && bookingData) {
      setFormData(bookingData);
    } else if (isOpen) {
      // Reset form only when opening
      setFormData({
        branch: BRANCH_OPTIONS[0],
        serviceDate: format(new Date(), "yyyy-MM-dd"),
        serviceTime: "10:00",
        customerName: "",
        customerEmail: "",
        paymentMethod: "cash",
        customPaymentMethod: "",
        emailConfirmation: false,
        smsConfirmation: false,
        status: "upcoming",
        staff: "",
        services: [{ ...emptyService }],
        remarks: "",
        tip: 0,
        discount: 0
      });
      setSelectedCategory("");
    }
  }, [isOpen, bookingData]);

  // Memoized handlers
  const handleServiceChange = useCallback((idx: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((s, i) => {
        if (i !== idx) return s;

        if (field === "serviceName") {
          const selectedService = serviceOptions.find(
            (service) => service.name === value
          );
          if (selectedService) {
            return {
              ...s,
              serviceName: value,
              duration: selectedService.duration || 0,
              price: selectedService.price || 0,
              category: selectedService.category || s.category,
            };
          }
        }

        return { ...s, [field]: value };
      })
    }));
  }, [serviceOptions]);

  const handleAddServiceRow = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { ...emptyService }]
    }));
  }, []);

  const handleRemoveServiceRow = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  }, []);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.customerName.trim()) return "Customer name is required";
    if (!formData.serviceDate) return "Service date is required";
    if (!formData.serviceTime) return "Service time is required";
    if (!formData.branch) return "Branch is required";
    if (!formData.staff) return "Staff is required";
    if (formData.services.length === 0) return "Add at least one service";
    const hasName = formData.services.every((s) => s.serviceName.trim().length > 0);
    if (!hasName) return "Each service must have a name";
    const selectedHour = formData.serviceTime.split(":")[0];
    if (!enabledHours[selectedHour]) return "Selected time falls into a disabled hour";
    return null;
  }, [formData, enabledHours]);

  // Optimized save handler
  const handleSave = useCallback(async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      setSaving(true);
      await onSave(formData, editingId || undefined);
      // Close immediately without waiting for state updates
      onClose();
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking");
    } finally {
      setSaving(false);
    }
  }, [formData, editingId, validateForm, onSave, onClose]);

  // Optimized delete handler
  const handleDelete = useCallback(async () => {
    if (!editingId) return;
    if (!confirm("Delete this booking? This action cannot be undone.")) return;

    try {
      setDeleting(true);
      await onDelete(editingId);
      onClose();
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking");
    } finally {
      setDeleting(false);
    }
  }, [editingId, onDelete, onClose]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Memoized calculations
  const formTotals = useCallback(() => calcTotals(formData.services), [formData.services]);

  const totals = formTotals();
  const finalTotal = totals.totalPrice + (formData.tip || 0) - (formData.discount || 0);

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 overflow-y-auto h-full w-full animate-fade-in">
      <div className="relative top-10 mx-auto w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3">
        <div className="bg-white rounded-lg shadow-xl border animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">
              {isEditing ? "Edit Schedule" : "Add Schedule"}
            </h3>
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
                  title="Delete booking"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Close"
                disabled={saving || deleting}
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Top selects */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Branch
                </label>
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={formData.branch}
                  onChange={(e) => handleInputChange('branch', e.target.value)}
                >
                  {BRANCH_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer Email
                </label>
                <input
                  type="email"
                  placeholder="Customer email"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Select One</option>
                  {Array.from(new Set(serviceOptions.map((s) => s.category))).map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Staff
                </label>
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={formData.staff}
                  onChange={(e) => handleInputChange('staff', e.target.value)}
                >
                  <option value="">Select One</option>
                  {staffOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Method - FIXED: Remove multiple attribute */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              >
                {paymentMethods.length > 0
                  ? paymentMethods.map((method: any) => (
                      <option
                        key={method.id}
                        value={method.name || method.method || method.title || ""}
                      >
                        {(method.name || method.method || method.title || "").toUpperCase()}
                      </option>
                    ))
                  : PAYMENT_METHODS.map((p) => (
                      <option key={p} value={p}>
                        {p.toUpperCase()}
                      </option>
                    ))}
                <option value="custom">Custom</option>
              </select>
              {formData.paymentMethod === "custom" && (
                <div className="mt-2">
                  <input
                    type="text"
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="Enter custom payment method"
                    value={formData.customPaymentMethod}
                    onChange={(e) =>
                      handleInputChange("customPaymentMethod", e.target.value)
                    }
                  />
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Service Date
                </label>
                <input
                  type="date"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={formData.serviceDate}
                  onChange={(e) => handleInputChange('serviceDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time Slot
                </label>
                <select
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={formData.serviceTime}
                  onChange={(e) => handleInputChange('serviceTime', e.target.value)}
                >
                  {TIMESLOTS.filter((slot) => {
                    const hour = slot.split(":")[0];
                    return !!enabledHours[hour];
                  }).map((slot) => (
                    <option key={slot} value={slot}>
                      {toDisplayAMPM(slot)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Customer
                </label>
                <input
                  type="text"
                  placeholder="Customer name"
                  className="mt-1 w-full border rounded-md px-3 py-2"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                />
              </div>
            </div>

            {/* Services table */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
                <div className="col-span-4">Service</div>
                <div className="col-span-2">Duration (min)</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-1 text-right">—</div>
              </div>

              {formData.services.map((s, idx) => (
                <ServiceRow
                  key={idx}
                  service={s}
                  index={idx}
                  serviceOptions={serviceOptions}
                  selectedCategory={selectedCategory}
                  onChange={handleServiceChange}
                  onRemove={handleRemoveServiceRow}
                  showRemove={formData.services.length > 1}
                />
              ))}

              {/* Tip + Discount + Total */}
              <div className="px-4 py-3 border-t space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tip Amount (AED)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 w-full border rounded-md px-3 py-2"
                      placeholder="Enter tip"
                      value={formData.tip || ""}
                      onChange={(e) => handleInputChange('tip', Number(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="mt-1 w-full border rounded-md px-3 py-2"
                      placeholder="Enter discount percentage"
                      value={formData.discount || ""}
                      onChange={(e) => handleInputChange('discount', Number(e.target.value) || 0)}
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <div className="text-sm font-semibold text-gray-800">
                      Final Total: AED {finalTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleAddServiceRow}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>

            {/* Remarks & toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Remarks (optional)
                </label>
                <textarea
                  className="mt-1 w-full border rounded-md px-3 py-2 min-h-[80px]"
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Application Status
                  </label>
                  <select
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                  >
                    <option value="upcoming">Approved (Upcoming)</option>
                    <option value="past">Completed (Past)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              disabled={saving || deleting}
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-60 transition-colors"
              disabled={saving || deleting}
            >
              {saving
                ? isEditing
                  ? "Updating..."
                  : "Saving..."
                : isEditing
                  ? "Update"
                  : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}