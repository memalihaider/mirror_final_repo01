import { useState } from 'react';
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Booking } from '@/types/booking';

interface InvoiceModalProps {
  isOpen: boolean;
  invoiceData: Booking | null;
  onClose: () => void;
}

interface InvoiceFormData {
  title: string;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  branch: string;
  bookingDate: string;
  bookingTime: string;
  staff: string;
  paymentMethod: string;
  services: any[];
  totalPrice: number;
  tip: number;
  discount: number;
  footerText: string;
}

export function InvoiceModal({ isOpen, invoiceData, onClose }: InvoiceModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    title: "Invoice Receipt",
    businessName: "MirrorsBeautyLounge",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    branch: "",
    bookingDate: "",
    bookingTime: "",
    staff: "",
    paymentMethod: "",
    services: [],
    totalPrice: 0,
    tip: 0,
    discount: 0,
    footerText: "Thank you for your booking! We look forward to serving you."
  });

  // Update form data when invoiceData changes
  useState(() => {
    if (invoiceData) {
      setFormData({
        title: "Invoice Receipt",
        businessName: "MirrorsBeautyLounge",
        businessEmail: "",
        businessPhone: "",
        businessAddress: "",
        customerName: invoiceData.customerName || "",
        customerEmail: invoiceData.customerEmail || "",
        customerPhone: "",
        branch: invoiceData.branch || "",
        bookingDate: format(invoiceData.bookingDate, "dd MMM yyyy"),
        bookingTime: invoiceData.bookingTime || "",
        staff: invoiceData.staff || "",
        paymentMethod: invoiceData.paymentMethod || "cash",
        services: invoiceData.services || [],
        totalPrice: invoiceData.totalPrice || 0,
        tip: invoiceData.tipAmount || 0,
        discount: invoiceData.discount || 0,
        footerText: "Thank you for your booking! We look forward to serving you."
      });
    }
  }, [invoiceData]);

  const toDisplayAMPM = (hhmm: string) => {
    const [hStr, m] = hhmm.split(":");
    let h = Number(hStr);
    const suffix = h >= 12 ? "PM" : "AM";
    if (h === 0) h = 12;
    if (h > 12) h = h - 12;
    return `${h}:${m} ${suffix}`;
  };

  const saveInvoiceToFirebase = async (invoiceData: any) => {
    try {
      const userId = invoiceData.userId || uuidv4();
      await addDoc(collection(db, "invoices"), {
        ...invoiceData,
        userId,
        bookingId: invoiceData.id,
        createdAt: new Date(),
      });
      console.log("Invoice saved to Firebase");
    } catch (err) {
      console.error("Error saving invoice:", err);
    }
  };

  const downloadInvoicePDF = async () => {
    const input = document.getElementById("invoice-content");
    if (!input) return;

    try {
      const imgData = await toPng(input, { cacheBust: true });

      const pdfWidth = 150;
      const pdfHeight = 180;
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      const contentWidth = pdfWidth - 10;
      const contentHeight = (input.offsetHeight * contentWidth) / input.offsetWidth;

      const x = 5;
      const y = 5;

      pdf.addImage(imgData, "PNG", x, y, contentWidth, contentHeight);
      pdf.save(`invoice_${invoiceData?.id || Date.now()}.pdf`);

      if (invoiceData) {
        await saveInvoiceToFirebase(invoiceData);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  if (!isOpen || !invoiceData) return null;

  const grandTotal = formData.totalPrice + formData.tip - formData.discount;

  return (
    <div className={`fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4 transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-4 relative max-h-[90vh] overflow-auto">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
          onClick={onClose}
          title="Close"
        >
          ✖
        </button>

        {/* Dropdown Selection Section */}
        <div className="p-4 border-b border-gray-200 rounded mb-4">
          <h3 className="font-semibold text-lg mb-2">Select Branch Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Brand Email Dropdown */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Brand Email</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.businessEmail}
                onChange={(e) => handleFieldChange('businessEmail', e.target.value)}
              >
                <option value="select email">select email</option>
                <option value="branch@mirrosalon.ae">branch@mirrosalon.ae</option>
                <option value="marina@mirrosalon.ae">marina@mirrosalon.ae</option>
                <option value="ibnbattuta@mirrosalon.ae">ibnbattuta@mirrosalon.ae</option>
                <option value="albustan@mirrosalon.ae">albustan@mirrosalon.ae</option>
                <option value="tecom@mirrosalon.ae">tecom@mirrosalon.ae</option>
              </select>
            </div>

            {/* Brand Phone Dropdown */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Brand Phone</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.businessPhone}
                onChange={(e) => handleFieldChange('businessPhone', e.target.value)}
              >
                <option value="select number">select number</option>
                <option value="+971 56 300 5629">Marina Phone: +971 56 300 5629</option>
                <option value="+971 54 321 0758">IBN Battuta Mall Phone: +971 54 321 0758</option>
                <option value="+971 50 545 8263">AI Bustaan Phone: +971 50 545 8263</option>
                <option value="+971 4 568 6219">TECOM Phone: +971 4 568 6219</option>
                <option value="+971 4 269 1449">AI Muraqqabat Phone: +971 4 269 1449</option>
              </select>
            </div>

            {/* Brand Address Dropdown */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Brand Address</label>
              <select
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.businessAddress}
                onChange={(e) => handleFieldChange('businessAddress', e.target.value)}
              >
                <option value="select address">select address</option>
                <option value="Marina Jannah Hotel, Marina - Ground Floor, Shop - 2 Jannah Pl - Dubai Marina - Dubai - United Arab Emirates">
                  Marina Jannah Hotel, Dubai Marina
                </option>
                <option value="IBN Battuta Mall, Metro link area - Sheikh Zayed Rd - Dubai - United Arab Emirates">
                  IBN Battuta Mall, Dubai
                </option>
                <option value="Al Bustan Centre & Residence Al Nahda Road, Qusais, 20107 - Dubai - United Arab Emirates">
                  AI Bustaan, Dubai
                </option>
                <option value="New API Building - Ground Floor - beside Fahad Tower 1 - Barsha Heights - Dubai - United Arab Emirates">
                  TECOM, Dubai
                </option>
                <option value="Dominos Pizza Building, Buhaleeba plaza - M02 - Al Muraqqabat - Dubai - United Arab Emirates">
                  AI Muraqqabat, Dubai
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="p-4 bg-white rounded-lg shadow-md">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2
                className="text-2xl font-bold text-indigo-700"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('title', e.target.innerText)}
              >
                {formData.title}
              </h2>
              <p className="text-sm text-gray-500">
                Booking ID:{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => {}}
                >
                  {invoiceData.id}
                </span>
              </p>
            </div>

            <div className="text-right">
              <p
                className="font-semibold"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('businessName', e.target.innerText)}
              >
                {formData.businessName}
              </p>
              <p
                className="text-sm text-gray-500"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('businessEmail', e.target.innerText)}
              >
                {formData.businessEmail}
              </p>
              <p
                className="text-sm text-gray-500"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('businessPhone', e.target.innerText)}
              >
                {formData.businessPhone}
              </p>
              <p
                className="text-sm text-gray-500"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('businessAddress', e.target.innerText)}
              >
                {formData.businessAddress}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <p>
                <strong>Customer:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('customerName', e.target.innerText)}
                >
                  {formData.customerName}
                </span>
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('customerEmail', e.target.innerText)}
                >
                  {formData.customerEmail || "N/A"}
                </span>
              </p>
              <p>
                <strong>Phone:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('customerPhone', e.target.innerText)}
                >
                  {formData.customerPhone || "-"}
                </span>
              </p>
            </div>
            <div>
              <p>
                <strong>Branch:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('branch', e.target.innerText)}
                >
                  {formData.branch}
                </span>
              </p>
              <p>
                <strong>Date:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('bookingDate', e.target.innerText)}
                >
                  {formData.bookingDate}
                </span>
              </p>
              <p>
                <strong>Time:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('bookingTime', e.target.innerText)}
                >
                  {toDisplayAMPM(formData.bookingTime)}
                </span>
              </p>
              <p>
                <strong>Staff:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('staff', e.target.innerText)}
                >
                  {formData.staff || "-"}
                </span>
              </p>
              <p>
                <strong>Payment Method:</strong>{" "}
                <span
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => handleFieldChange('paymentMethod', e.target.innerText)}
                >
                  {formData.paymentMethod || "cash"}
                </span>
              </p>
            </div>
          </div>

          {/* Services Table */}
          <div className="overflow-hidden rounded border">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {formData.services.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td
                      className="p-3"
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleServiceChange(i, "serviceName", e.target.innerText)}
                    >
                      {s.serviceName}
                    </td>
                    <td
                      className="p-3 text-center"
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleServiceChange(i, "quantity", Number(e.target.innerText) || 0)}
                    >
                      {s.quantity}
                    </td>
                    <td
                      className="p-3 text-right"
                      contentEditable={isEditing}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleServiceChange(i, "price", Number(e.target.innerText.replace(/[^0-9.]/g, "")) || 0)}
                    >
                      AED {Number(s.price).toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      AED {(Number(s.price) * Number(s.quantity)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-6 flex flex-col items-end gap-2 text-sm">
            <div className="flex justify-between w-64">
              <span className="text-gray-600">Subtotal:</span>
              <span
                className="font-semibold"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('totalPrice', Number(e.target.innerText.replace(/[^0-9.]/g, "")) || 0)}
              >
                AED {Number(formData.totalPrice || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-600">Tip Added:</span>
              <span
                className="font-semibold text-green-600"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('tip', Number(e.target.innerText.replace(/[^0-9.]/g, "")) || 0)}
              >
                AED {Number(formData.tip || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-gray-600">Discount Applied:</span>
              <span
                className="font-semibold text-red-600"
                contentEditable={isEditing}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleFieldChange('discount', Number(e.target.innerText.replace(/[^0-9.]/g, "")) || 0)}
              >
                AED {Number(formData.discount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between w-64 border-t pt-2 text-base font-bold">
              <span>Grand Total (AED):</span>
              <span>
                AED {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div
            className="mt-6 text-center text-sm text-gray-500"
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onBlur={(e) => handleFieldChange('footerText', e.target.innerText)}
          >
            {formData.footerText}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-md"
          >
            Close
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-md ${isEditing ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}
          >
            {isEditing ? "Save Invoice" : "Edit Invoice"}
          </button>
          <button
            onClick={downloadInvoicePDF}
            className="px-4 py-2 bg-pink-600 text-white rounded-md"
          >
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}