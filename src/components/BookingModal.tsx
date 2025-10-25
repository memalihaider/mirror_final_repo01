import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { XCircle, Trash2, Plus } from "lucide-react";
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingService, BookingFormData, PaymentDetail } from '@/types/booking';

// Memoized components to prevent unnecessary re-renders
interface ServiceRowProps {
  service: BookingService;
  index: number;
  serviceOptions: any[];
  selectedCategory: string;
  staffOptions: string[];
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

const ServiceRow = memo(({ service, index, serviceOptions, selectedCategory, staffOptions, onChange, onRemove, showRemove }: ServiceRowProps) => {
  const handleChange = useCallback((field: string, value: any) => {
    onChange(index, field, value);
  }, [index, onChange]);

  const handleRemoveClick = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  // Memoize filtered service options to prevent recalculation on every render
  const filteredServiceOptions = useMemo(() => {
    return serviceOptions.filter((serviceOption: any) =>
      selectedCategory ? serviceOption.category === selectedCategory : true
    );
  }, [serviceOptions, selectedCategory]);

  // Memoize staff options to prevent recreation
  const memoizedStaffOptions = useMemo(() => staffOptions, [staffOptions]);

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
      <div className="col-span-3">
        <select
          className="w-full border rounded-md px-3 py-2"
          value={service.serviceName}
          onChange={(e) => handleChange("serviceName", e.target.value)}
        >
          <option value="">Select a service</option>
          {filteredServiceOptions.map((serviceOption: any) => (
            <option key={serviceOption.id} value={serviceOption.name}>
              {serviceOption.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <select
          className="w-full border rounded-md px-3 py-2"
          value={service.staffMember || ""}
          onChange={(e) => handleChange("staffMember", e.target.value)}
        >
          <option value="">Select staff</option>
          {memoizedStaffOptions.map((staff: string) => (
            <option key={staff} value={staff}>
              {staff}
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
            onClick={handleRemoveClick}
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

// Memoized PaymentDetailRow component
interface PaymentDetailRowProps {
  payment: PaymentDetail;
  index: number;
  paymentMethods: any[];
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  showRemove: boolean;
}

const PaymentDetailRow = memo(({ payment, index, paymentMethods, onChange, onRemove, showRemove }: PaymentDetailRowProps) => {
  const handleChange = useCallback((field: string, value: any) => {
    onChange(index, field, value);
  }, [index, onChange]);

  const handleRemoveClick = useCallback(() => {
    onRemove(index);
  }, [index, onRemove]);

  // Memoize default payment methods to prevent recreation
  const defaultPaymentMethods = useMemo(() => [
    "cash", "card", "tabby", "tamara", "apple pay", "google pay", 
    "samsung wallet", "paypal", "american express", "ewallet STC pay", 
    "bank transfer", "cash on delivery", "other"
  ], []);

  // Memoize payment method options
  const paymentMethodOptions = useMemo(() => {
    return paymentMethods.length > 0 ? paymentMethods : defaultPaymentMethods;
  }, [paymentMethods, defaultPaymentMethods]);

  return (
    <div className="grid grid-cols-12 gap-2 px-4 py-3 border-t">
      <div className="col-span-6">
        <select
          className="w-full border rounded-md px-3 py-2"
          value={payment.method}
          onChange={(e) => handleChange("method", e.target.value)}
        >
          <option value="">Select payment method</option>
          {paymentMethods.length > 0
            ? paymentMethods.map((method: any) => (
                <option
                  key={method.id}
                  value={method.name || method.method || method.title || ""}
                >
                  {(method.name || method.method || method.title || "").toUpperCase()}
                </option>
              ))
            : defaultPaymentMethods.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
        </select>
      </div>
      <div className="col-span-4">
        <input
          type="number"
          min={0}
          step="0.01"
          className="w-full border rounded-md px-3 py-2"
          placeholder="Amount (AED)"
          value={payment.amount}
          onChange={(e) => handleChange("amount", Number(e.target.value || 0))}
        />
      </div>
      <div className="col-span-2 flex justify-end items-center">
        {showRemove && (
          <button
            onClick={handleRemoveClick}
            className="p-2 rounded hover:bg-red-50 text-red-600 transition-colors"
            title="Remove payment method"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});

PaymentDetailRow.displayName = 'PaymentDetailRow';

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
  staffMember: "",
};

const BRANCH_OPTIONS = [
  "AI Bustaan",
  "Marina",
  "TECOM",
  "AL Muraqabat",
  "IBN Batutta Mall",
];

const PAYMENT_METHODS = ["cash", "card", "tabby", "tamara", "apple pay", "google pay", "samsung wallet", "paypal", "american express", "ewallet STC pay", "bank transfer", "cash on delivery", "other"];

function generateTimeSlots(start = 0, end = 12 * 120, step = 15) {
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  return slots;
}

// Pre-generate time slots to avoid recalculation
const TIMESLOTS = generateTimeSlots();

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

export const BookingModal = memo(function BookingModal({
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
  // Memoize empty service to prevent recreation
  const memoizedEmptyService = useMemo(() => ({ ...emptyService }), []);

  // Memoize filtered time slots to prevent recalculation
  const filteredTimeSlots = useMemo(() => {
    return TIMESLOTS.filter((slot) => {
      const hour = slot.split(":")[0];
      return !!enabledHours[hour];
    });
  }, [enabledHours]);

  // Memoize service categories to prevent recalculation
  const serviceCategories = useMemo(() => {
    return Array.from(new Set(serviceOptions.map((s) => s.category)));
  }, [serviceOptions]);

  const [formData, setFormData] = useState<BookingFormData>({
    branch: BRANCH_OPTIONS[0],
    serviceDate: format(new Date(), "yyyy-MM-dd"),
    serviceTime: "10:00",
    customerName: "",
    customerEmail: "",
    paymentMethod: "cash",
    paymentDetails: [{ method: "cash", amount: 0 }],
    customPaymentMethod: "",
    emailConfirmation: false,
    smsConfirmation: false,
    status: "upcoming",
    staff: "",
    services: [memoizedEmptyService],
    remarks: "",
    tip: 0,
    discount: 0
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Memoized calculations - moved here to be available for validation
  const totals = useMemo(() => calcTotals(formData.services), [formData.services]);
  const finalTotal = useMemo(() => totals.totalPrice + (formData.tip || 0) - (formData.discount || 0), [totals.totalPrice, formData.tip, formData.discount]);

  // Memoized payment total calculation
  const totalPaid = useMemo(() => {
    return formData.paymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [formData.paymentDetails]);

  // Memoized payment mismatch check
  const paymentMismatch = useMemo(() => {
    return Math.abs(totalPaid - finalTotal) > 0.01;
  }, [totalPaid, finalTotal]);

  // Optimized form data update
  useEffect(() => {
    if (isOpen && bookingData) {
      // Ensure paymentDetails exists for backward compatibility
      const updatedBookingData = {
        ...bookingData,
        paymentDetails: bookingData.paymentDetails || [{ method: bookingData.paymentMethod || "cash", amount: 0 }]
      };
      setFormData(updatedBookingData);
    } else if (isOpen) {
      // Reset form only when opening
      setFormData({
        branch: BRANCH_OPTIONS[0],
        serviceDate: format(new Date(), "yyyy-MM-dd"),
        serviceTime: "10:00",
        customerName: "",
        customerEmail: "",
        paymentMethod: "cash",
        paymentDetails: [{ method: "cash", amount: 0 }],
        customPaymentMethod: "",
        emailConfirmation: false,
        smsConfirmation: false,
        status: "upcoming",
        staff: "",
        services: [memoizedEmptyService],
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

  // Payment details handlers
  const handlePaymentDetailChange = useCallback((idx: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.map((p, i) => {
        if (i !== idx) return p;
        return { ...p, [field]: value };
      })
    }));
  }, []);

  const handleAddPaymentDetail = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: [...prev.paymentDetails, { method: "", amount: 0 }]
    }));
  }, []);

  const handleRemovePaymentDetail = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.filter((_, i) => i !== index)
    }));
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
    
    // Validate payment details
    if (formData.paymentDetails.length === 0) return "Add at least one payment method";
    const hasValidPayments = formData.paymentDetails.every((p) => p.method.trim().length > 0 && p.amount > 0);
    if (!hasValidPayments) return "Each payment method must have a valid method and amount";
    
    // Check if total payment amount matches the final total using memoized values
    if (paymentMismatch) {
      return `Total payment amount (${totalPaid.toFixed(2)}) must equal the final total (${finalTotal.toFixed(2)})`;
    }
    
    return null;
  }, [formData, enabledHours, paymentMismatch, totalPaid, finalTotal]);

  // Optimized save handler
  const handleSave = useCallback(async () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      setSaving(true);
      // Update paymentMethod for backward compatibility
      const dataToSave = {
        ...formData,
        paymentMethod: formData.paymentDetails.map(p => p.method).join(", ")
      };
      await onSave(dataToSave, editingId || undefined);
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
                  {serviceCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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
                  {filteredTimeSlots.map((slot) => (
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
                <div className="col-span-3">Service</div>
                <div className="col-span-2">Staff Member</div>
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
                  staffOptions={staffOptions}
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

            {/* Payment Details Section */}
            <div className="border rounded-lg">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold">
                <div className="col-span-6">Payment Method</div>
                <div className="col-span-4">Amount (AED)</div>
                <div className="col-span-2 text-right">—</div>
              </div>

              {formData.paymentDetails.map((payment, idx) => (
                <PaymentDetailRow
                  key={idx}
                  payment={payment}
                  index={idx}
                  paymentMethods={paymentMethods}
                  onChange={handlePaymentDetailChange}
                  onRemove={handleRemovePaymentDetail}
                  showRemove={formData.paymentDetails.length > 1}
                />
              ))}

              {/* Payment Summary */}
              <div className="px-4 py-3 border-t bg-gray-50">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Total Payments: AED {totalPaid.toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    Expected: AED {finalTotal.toFixed(2)}
                  </span>
                </div>
                {paymentMismatch && (
                  <div className="text-sm text-red-600 mt-1">
                    ⚠️ Payment total does not match expected amount
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleAddPaymentDetail}
              className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:text-green-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
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
});