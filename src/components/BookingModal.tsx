import { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { XCircle, Trash2, Plus } from "lucide-react";
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingService as OriginalBookingService, BookingFormData, PaymentDetail } from '@/types/booking';

// Extend BookingService to include tip for this component
type BookingService = OriginalBookingService & { tip?: number };

// Memoized components to prevent unnecessary re-renders
interface ServiceRowProps {
  service: BookingService; // local extended type
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
    <div className={GRID_ROW} style={{ gridTemplateColumns: "3fr 2fr 2fr 2fr 1fr 2fr 1fr" }}>
      <div>
        <select className={SELECT_CLASS} value={service.serviceName} onChange={(e) => handleChange("serviceName", e.target.value)}>
          <option value="">Service</option>
          {filteredServiceOptions.map((serviceOption: any) => (
            <option key={serviceOption.id} value={serviceOption.name}>{serviceOption.name}</option>
          ))}
        </select>
      </div>
      <div>
        <select className={SELECT_CLASS} value={service.staffMember || ""} onChange={(e) => handleChange("staffMember", e.target.value)}>
          <option value="">Staff</option>
          {memoizedStaffOptions.map((staff: string) => <option key={staff} value={staff}>{staff}</option>)}
        </select>
      </div>
      <div>
        <input type="number" min={0} className={INPUT_CLASS} placeholder="Duration" value={service.duration} onChange={(e) => handleChange("duration", Number(e.target.value || 0))} />
      </div>
      <div>
        <input type="number" min={0} step="0.01" className={INPUT_CLASS} placeholder="Price" value={service.price} onChange={(e) => handleChange("price", Number(e.target.value || 0))} />
      </div>
      <div>
        <input type="number" min={1} className={INPUT_CLASS} placeholder="Qty" value={service.quantity} onChange={(e) => handleChange("quantity", Number(e.target.value || 1))} />
      </div>
      <div>
        <input type="number" min={0} step="0.01" className={INPUT_CLASS} placeholder="Tip" value={(service as any).tip || 0} onChange={(e) => handleChange("tip", e.target.value)} />
      </div>
      <div className="flex justify-center items-center">
        {showRemove && <button onClick={handleRemoveClick} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove"><Trash2 className="w-4 h-4" /></button>}
      </div>
    </div>
  );
});

ServiceRow.displayName = 'ServiceRow';

// Memoized PaymentDetailRow component
interface PaymentDetailRowProps {
  payment: PaymentDetail & { cardNumber?: string; cardholderName?: string; referenceNumber?: string };
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

  // Use cached payment methods to prevent recreation - performance optimized
  const paymentMethodOptions = useMemo(() => {
    return paymentMethods.length > 0 ? paymentMethods : PAYMENT_METHODS;
  }, [paymentMethods]);

  // Check if this is a card payment method
  const isCardPayment = useMemo(() => {
    const method = payment.method.toLowerCase();
    return method.includes('card') || method.includes('credit') || method.includes('debit');
  }, [payment.method]);

  return (
    <>
      <div className={GRID_ROW} style={{ gridTemplateColumns: "2fr 1.5fr 2fr 0.5fr" }}>
        <div>
          <select className={SELECT_CLASS} value={payment.method} onChange={(e) => handleChange("method", e.target.value)}>
            <option value="">Method</option>
            {paymentMethods.length > 0
              ? paymentMethods.map((method: any) => <option key={method.id} value={method.name || method.method || method.title || ""}>{(method.name || method.method || method.title || "").toUpperCase()}</option>)
              : PAYMENT_METHODS.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
          </select>
        </div>
        <div>
          <input type="text" className={INPUT_CLASS} placeholder="Ref #" value={(payment as any).referenceNumber || ""} onChange={(e) => handleChange("referenceNumber", e.target.value)} />
        </div>
        <div>
          <input type="number" min={0} step="0.01" className={INPUT_CLASS} placeholder="Amount (AED)" value={payment.amount} onChange={(e) => handleChange("amount", Number(e.target.value || 0))} />
        </div>
        <div className="flex justify-center items-center">
          {showRemove && <button onClick={handleRemoveClick} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove"><Trash2 className="w-4 h-4" /></button>}
        </div>
      </div>
      {isCardPayment && (
        <div className={`${GRID_ROW} bg-blue-50`} style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div><input type="text" className={INPUT_CLASS} placeholder="Cardholder Name" value={(payment as any).cardholderName || ""} onChange={(e) => handleChange("cardholderName", e.target.value)} /></div>
          <div><input type="text" className={INPUT_CLASS} placeholder="Card # (XXXX-XXXX-XXXX-XXXX)" value={(payment as any).cardNumber || ""} onChange={(e) => { const value = e.target.value.replace(/[^0-9-]/g, ""); handleChange("cardNumber", value); }} maxLength={19} /></div>
        </div>
      )}
    </>
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

const emptyService: BookingService & { tip?: number } = {
  serviceId: "",
  serviceName: "",
  category: "",
  duration: 30,
  price: 0,
  quantity: 1,
  staffMember: "",
  tip: 0,
};

// Cached static data to prevent recreation on every render - performance optimized
const BRANCH_OPTIONS = Object.freeze([
  "AI Bustaan",
  "Marina",
  "TECOM",
  "AL Muraqabat",
  "IBN Batutta Mall",
] as const);

const PAYMENT_METHODS = Object.freeze(["cash", "card", "tabby", "tamara", "apple pay", "google pay", "samsung wallet", "paypal", "american express", "ewallet STC pay", "bank transfer", "cash on delivery", "other"] as const);

// Consistent styling classes for performance and maintainability
const INPUT_CLASS = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white";
const SELECT_CLASS = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white cursor-pointer";
const LABEL_CLASS = "block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-tight";
const GRID_SECTION = "border border-gray-200 rounded-lg overflow-hidden";
const GRID_HEADER = "grid gap-0 px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-50 border-b border-gray-200 text-xs font-bold text-gray-700 uppercase tracking-wide";
const GRID_ROW = "grid gap-0 px-4 py-2.5 border-b border-gray-100 hover:bg-gray-50 transition-colors";

// Cached time slot generation function with memoization - performance optimized
const generateTimeSlotsCache = new Map<string, string[]>();

function generateTimeSlots(start = 0, end = 12 * 120, step = 15): string[] {
  const cacheKey = `${start}-${end}-${step}`;
  
  if (generateTimeSlotsCache.has(cacheKey)) {
    return generateTimeSlotsCache.get(cacheKey)!;
  }
  
  const slots: string[] = [];
  for (let t = start; t <= end; t += step) {
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
  }
  
  generateTimeSlotsCache.set(cacheKey, slots);
  return slots;
}

// Pre-generated and cached time slots to avoid recalculation - performance optimized
const TIMESLOTS = generateTimeSlots();

// Cached AM/PM conversion function with memoization - performance optimized
const ampmCache = new Map<string, string>();

function toDisplayAMPM(hhmm: string): string {
  if (ampmCache.has(hhmm)) {
    return ampmCache.get(hhmm)!;
  }
  
  const [hStr, m] = hhmm.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h = h - 12;
  
  const result = `${h}:${m} ${suffix}`;
  ampmCache.set(hhmm, result);
  return result;
}

// Optimized calculation function with memoization - performance optimized
function calcTotals(services: (BookingService & { tip?: number })[]): { totalPrice: number; totalDuration: number; totalTip: number } {
  const totalPrice = services.reduce(
    (sum, s) => sum + (Number(s.price) || 0) * (Number(s.quantity) || 0),
    0
  );
  const totalDuration = services.reduce(
    (sum, s) => sum + (Number(s.duration) || 0) * (Number(s.quantity) || 0),
    0
  );
  const totalTip = services.reduce(
    (sum, s) => sum + (Number(s.tip) || 0),
    0
  );
  return { totalPrice, totalDuration, totalTip };
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
  // Stable empty service reference to prevent recreation - performance optimized
  const memoizedEmptyService = useMemo(() => ({ ...emptyService }), []);

  // Stable initial form data to prevent recreation - performance optimized
  const initialFormData = useMemo(() => ({
    branch: BRANCH_OPTIONS[0],
    serviceDate: format(new Date(), "yyyy-MM-dd"),
    serviceTime: "10:00",
    customerName: "",
    customerEmail: "",
    trn: "",
    paymentMethod: "cash",
    paymentDetails: [{ method: "cash", amount: 0 }],
    customPaymentMethod: "",
    emailConfirmation: false,
    smsConfirmation: false,
    status: "upcoming" as const,
    staff: "",
    services: [memoizedEmptyService],
    remarks: "",
    tip: 0,
    discount: 0
  }), [memoizedEmptyService]);

  // Memoize filtered time slots to prevent recalculation - performance optimized
  const filteredTimeSlots = useMemo(() => {
    return TIMESLOTS.filter((slot) => {
      const hour = slot.split(":")[0];
      return !!enabledHours[hour];
    });
  }, [enabledHours]);

  // Memoize service categories to prevent recalculation - performance optimized
  const serviceCategories = useMemo(() => {
    return Array.from(new Set(serviceOptions.map((s) => s.category)));
  }, [serviceOptions]);

  const [formData, setFormData] = useState<BookingFormData>(initialFormData);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Track if component is mounted to prevent state updates on unmounted component
  const isMountedRef = useMemo(() => ({ current: true }), []);

  // Memoized calculations - moved here to be available for validation
  const totals = useMemo(() => calcTotals(formData.services), [formData.services]);
  // Remove formData.tip from finalTotal, use per-service tip instead
  const finalTotal = useMemo(() => totals.totalPrice + totals.totalTip - (formData.discount || 0), [totals.totalPrice, totals.totalTip, formData.discount]);

  // Memoized payment total calculation
  const totalPaid = useMemo(() => {
    return formData.paymentDetails.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [formData.paymentDetails]);

  // Memoized payment mismatch check
  const paymentMismatch = useMemo(() => {
    return Math.abs(totalPaid - finalTotal) > 0.01;
  }, [totalPaid, finalTotal]);

  // Optimized form data update - performance optimized with stable references
  useEffect(() => {
    if (isOpen && bookingData) {
      // Ensure paymentDetails exists for backward compatibility
      const updatedBookingData = {
        ...bookingData,
        paymentDetails: bookingData.paymentDetails || [{ method: bookingData.paymentMethod || "cash", amount: 0 }]
      };
      setFormData(updatedBookingData);
    } else if (isOpen) {
      // Reset form only when opening using memoized data
      setFormData(initialFormData);
      setSelectedCategory("");
    }
  }, [isOpen, bookingData, initialFormData]);

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

        // For tip, ensure it's a number
        if (field === "tip") {
          return { ...s, tip: Number(value) || 0 };
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
      if (isMountedRef.current) setSaving(true);
      // Update paymentMethod for backward compatibility
      const dataToSave = {
        ...formData,
        paymentMethod: formData.paymentDetails.map(p => p.method).join(", ")
      };
      await onSave(dataToSave, editingId || undefined);
      // Close immediately without waiting for state updates
      if (isMountedRef.current) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking");
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  }, [formData, editingId, validateForm, onSave, onClose, isMountedRef]);

  // Optimized delete handler
  const handleDelete = useCallback(async () => {
    if (!editingId) return;
    if (!confirm("Delete this booking? This action cannot be undone.")) return;

    try {
      if (isMountedRef.current) setDeleting(true);
      await onDelete(editingId);
      if (isMountedRef.current) {
        onClose();
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking");
    } finally {
      if (isMountedRef.current) setDeleting(false);
    }
  }, [editingId, onDelete, onClose, isMountedRef]);

  // Optimized close handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Cleanup on unmount - prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, [isMountedRef]);

  // Early return if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fadeIn"
        onClick={handleClose}
      />
      
      {/* Side Panel - Fixed to right edge with smooth slide animation */}
      <div className="relative w-full max-w-4xl h-screen bg-white flex flex-col ml-auto z-50 animate-slideInRight shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gradient-to-r from-pink-600 to-pink-700 text-white flex-shrink-0">
          <h3 className="text-lg font-bold tracking-tight">
            {isEditing ? "\u270d\ufe0f Edit Booking" : "\u2795 New Booking"}
          </h3>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded text-sm font-semibold transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button onClick={handleClose} className="text-white hover:bg-blue-800 p-1 rounded transition-colors" title="Close" disabled={saving || deleting}>
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
            {/* Top Form Section */}
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className={LABEL_CLASS}>Branch</label>
                  <select className={SELECT_CLASS} value={formData.branch} onChange={(e) => handleInputChange('branch', e.target.value)}>
                    {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>TRN</label>
                  <input type="text" className={INPUT_CLASS} placeholder="Tax ID" value={(formData as any).trn || ""} onChange={(e) => handleInputChange('trn', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Email</label>
                  <input type="email" className={INPUT_CLASS} placeholder="customer@email.com" value={formData.customerEmail} onChange={(e) => handleInputChange('customerEmail', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Category</label>
                  <select className={SELECT_CLASS} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="">All</option>
                    {serviceCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLASS}>Staff</label>
                  <select className={SELECT_CLASS} value={formData.staff} onChange={(e) => handleInputChange('staff', e.target.value)}>
                    <option value="">Select</option>
                    {staffOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Date & Time & Customer */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={LABEL_CLASS}>Date</label>
                <input type="date" className={INPUT_CLASS} value={formData.serviceDate} onChange={(e) => handleInputChange('serviceDate', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Time</label>
                <select className={SELECT_CLASS} value={formData.serviceTime} onChange={(e) => handleInputChange('serviceTime', e.target.value)}>
                  {filteredTimeSlots.map((slot) => <option key={slot} value={slot}>{toDisplayAMPM(slot)}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Customer Name</label>
                <input type="text" className={INPUT_CLASS} placeholder="Full name" value={formData.customerName} onChange={(e) => handleInputChange('customerName', e.target.value)} />
              </div>
            </div>

            {/* Services Table */}
            <div className={GRID_SECTION}>
              <div className={GRID_HEADER} style={{ gridTemplateColumns: "3fr 2fr 2fr 2fr 1fr 2fr 1fr" }}>
                <div>Service</div>
                <div>Staff</div>
                <div>Duration</div>
                <div>Price</div>
                <div>Qty</div>
                <div>Tip</div>
                <div className="text-center">×</div>
              </div>
              {formData.services.map((s, idx) => (
                <div className={GRID_ROW} style={{ gridTemplateColumns: "3fr 2fr 2fr 2fr 1fr 2fr 1fr" }} key={idx}>
                  <div>
                    <select className={SELECT_CLASS} value={s.serviceName} onChange={(e) => handleServiceChange(idx, "serviceName", e.target.value)}>
                      <option value="">Service</option>
                      {serviceOptions.filter((serviceOption: any) => selectedCategory ? serviceOption.category === selectedCategory : true).map((serviceOption: any) => <option key={serviceOption.id} value={serviceOption.name}>{serviceOption.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <select className={SELECT_CLASS} value={s.staffMember || ""} onChange={(e) => handleServiceChange(idx, "staffMember", e.target.value)}>
                      <option value="">Staff</option>
                      {staffOptions.map((staff: string) => <option key={staff} value={staff}>{staff}</option>)}
                    </select>
                  </div>
                  <div><input type="number" min={0} className={INPUT_CLASS} placeholder="30" value={s.duration} onChange={(e) => handleServiceChange(idx, "duration", Number(e.target.value || 0))} /></div>
                  <div><input type="number" min={0} step="0.01" className={INPUT_CLASS} placeholder="0.00" value={s.price} onChange={(e) => handleServiceChange(idx, "price", Number(e.target.value || 0))} /></div>
                  <div><input type="number" min={1} className={INPUT_CLASS} placeholder="1" value={s.quantity} onChange={(e) => handleServiceChange(idx, "quantity", Number(e.target.value || 1))} /></div>
                  <div><input type="number" min={0} step="0.01" className={INPUT_CLASS} placeholder="0" value={(s as any).tip || 0} onChange={(e) => handleServiceChange(idx, "tip", e.target.value)} /></div>
                  <div className="flex justify-center items-center">
                    {formData.services.length > 1 && <button onClick={() => handleRemoveServiceRow(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded" title="Remove"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              ))}
              <div className="px-3 py-2 bg-gray-50 grid gap-2" style={{ gridTemplateColumns: "auto 1fr auto" }}>
                <div><label className={LABEL_CLASS}>Discount %</label><input type="number" min="0" max="100" step="0.1" className={INPUT_CLASS} placeholder="0" value={formData.discount || ""} onChange={(e) => handleInputChange('discount', Number(e.target.value) || 0)} /></div>
                <div className="flex items-end justify-center py-1.5"><span className="text-sm font-bold text-gray-800">Total: AED {finalTotal.toFixed(2)}</span></div>
                <div><label className={LABEL_CLASS}>Tip Total</label><div className="py-2 px-3 bg-white border border-gray-300 rounded text-sm font-semibold text-gray-700">AED {totals.totalTip.toFixed(2)}</div></div>
              </div>
            </div>

            <button onClick={handleAddServiceRow} className="flex items-center gap-2 px-3 py-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              <Plus className="w-3 h-3" />
              Add Service
            </button>

            {/* Payment Details */}
            <div className={GRID_SECTION}>
              <div className={GRID_HEADER} style={{ gridTemplateColumns: "2fr 1.5fr 2fr 0.5fr" }}>
                <div>Method</div>
                <div>Ref #</div>
                <div>Amount</div>
                <div className="text-center">×</div>
              </div>
              {formData.paymentDetails.map((payment, idx) => (
                <PaymentDetailRow key={idx} payment={payment} index={idx} paymentMethods={paymentMethods} onChange={handlePaymentDetailChange} onRemove={handleRemovePaymentDetail} showRemove={formData.paymentDetails.length > 1} />
              ))}
              <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="text-xs font-bold text-gray-700">Paid: <span className="text-blue-600 font-semibold">AED {totalPaid.toFixed(2)}</span></div>
                <div className="text-xs font-bold text-gray-700">Expected: <span className="text-blue-600 font-semibold">AED {finalTotal.toFixed(2)}</span></div>
                {paymentMismatch && <div className="col-span-2 text-xs text-red-600 font-semibold">⚠️ Mismatch</div>}
              </div>
            </div>

            <button onClick={handleAddPaymentDetail} className="flex items-center gap-2 px-3 py-1.5 text-xs text-green-600 hover:text-green-700 font-semibold transition-colors">
              <Plus className="w-3 h-3" />
              Add Payment
            </button>

            {/* Remarks & Status */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className={LABEL_CLASS}>Remarks</label>
                <textarea className={`${INPUT_CLASS} resize-none`} rows={3} placeholder="Optional notes..." value={formData.remarks} onChange={(e) => handleInputChange('remarks', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Status</label>
                <select className={SELECT_CLASS} value={formData.status} onChange={(e) => handleInputChange('status', e.target.value)}>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        <div className="px-5 py-2.5 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end gap-2 flex-shrink-0">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors" disabled={saving || deleting}>
            Close
          </button>
          <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded transition-colors disabled:opacity-60" disabled={saving || deleting}>
            {saving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save")}
          </button>
        </div>
      </div>
    </div>
  );
});