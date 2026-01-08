export interface BookingService {
  serviceId?: string;
  serviceName: string;
  category: string;
  duration: number;
  price: number;
  quantity: number;
  staffMember?: string; // Staff assigned to this specific service
}

export type BookingStatus = "upcoming" | "past" | "cancelled";

export interface PaymentDetail {
  method: string;
  amount: number;
  cardNumber?: string;
  cardholderName?: string;
  referenceNumber?: string;
}

export interface Booking {
  id: string;
  userId: string;
  customerName: string;
  services: BookingService[];
  bookingDate: Date;
  bookingTime: string;
  branch: string;
  staff: string | null;
  totalPrice: number;
  totalDuration: number;
  status: BookingStatus;
  paymentMethod: string; // Keep for backward compatibility
  paymentDetails?: PaymentDetail[]; // New field for multiple payments
  emailConfirmation: boolean;
  smsConfirmation: boolean;
  createdAt: Date;
  updatedAt: Date;
  remarks?: string | null;
  customerEmail?: string;
  tipAmount?: number;
  discount?: number;
}

export interface BookingFormData {
  branch: string;
  serviceDate: string;
  serviceTime: string;
  customerName: string;
  customerEmail: string;
  trn?: string;
  paymentMethod: string; // Keep for backward compatibility
  paymentDetails: PaymentDetail[]; // New field for multiple payments
  customPaymentMethod: string;
  emailConfirmation: boolean;
  smsConfirmation: boolean;
  status: BookingStatus;
  staff: string;
  services: BookingService[];
  remarks: string;
  tip: number;
  discount: number;
}