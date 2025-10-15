// import { useState, useEffect } from "react";
// import { toPng } from "html-to-image";
// import jsPDF from "jspdf";
// import { format } from "date-fns";
// import { v4 as uuidv4 } from "uuid";
// import { collection, addDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { Booking } from "@/types/booking";
// import { X } from "lucide-react";

// interface InvoiceModalProps {
//   isOpen: boolean;
//   invoiceData: Booking | null;
//   onClose: () => void;
// }

// interface InvoiceFormData {
//   title: string;
//   businessName: string;
//   businessEmail: string;
//   businessPhone: string;
//   businessAddress: string;
//   customerName: string;
//   customerEmail: string;
//   customerPhone: string;
//   branch: string;
//   bookingDate: string;
//   bookingTime: string;
//   staff: string;
//   paymentMethod: string;
//   services: any[];
//   totalPrice: number;
//   tip: number;
//   discount: number;
//   footerText: string;
// }

// export function InvoiceModal({ isOpen, invoiceData, onClose }: InvoiceModalProps) {
//   const [isEditing, setIsEditing] = useState(false);
//   const [formData, setFormData] = useState<InvoiceFormData>({
//     title: "Invoice Receipt",
//     businessName: "MirrorsBeautyLounge",
//     businessEmail: "",
//     businessPhone: "",
//     businessAddress: "",
//     customerName: "",
//     customerEmail: "",
//     customerPhone: "",
//     branch: "",
//     bookingDate: "",
//     bookingTime: "",
//     staff: "",
//     paymentMethod: "",
//     services: [],
//     totalPrice: 0,
//     tip: 0,
//     discount: 0,
//     footerText: "Thank you for your booking! We look forward to serving you.",
//   });

//   const handleFieldChange = (field: keyof InvoiceFormData, value: any) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   useEffect(() => {
//     if (invoiceData) {
//       setFormData({
//         title: "Invoice Receipt",
//         businessName: "MirrorsBeautyLounge",
//         businessEmail: "",
//         businessPhone: "",
//         businessAddress: "",
//         customerName: invoiceData.customerName || "",
//         customerEmail: invoiceData.customerEmail || "",
//         customerPhone: "",
//         branch: invoiceData.branch || "",
//         bookingDate: format(invoiceData.bookingDate, "dd MMM yyyy"),
//         bookingTime: invoiceData.bookingTime || "",
//         staff: invoiceData.staff || "",
//         paymentMethod: invoiceData.paymentMethod || "cash",
//         services: invoiceData.services || [],
//         totalPrice: invoiceData.totalPrice || 0,
//         tip: invoiceData.tipAmount || 0,
//         discount: invoiceData.discount || 0,
//         footerText: "Thank you for your booking! We look forward to serving you.",
//       });
//     }
//   }, [invoiceData]);

//   const toDisplayAMPM = (hhmm: string) => {
//     const [hStr, m] = hhmm.split(":");
//     let h = Number(hStr);
//     const suffix = h >= 12 ? "PM" : "AM";
//     if (h === 0) h = 12;
//     if (h > 12) h = h - 12;
//     return `${h}:${m} ${suffix}`;
//   };

//   const saveInvoiceToFirebase = async (invoiceData: any) => {
//     try {
//       const userId = invoiceData.userId || uuidv4();
//       await addDoc(collection(db, "invoices"), {
//         ...invoiceData,
//         userId,
//         bookingId: invoiceData.id,
//         createdAt: new Date(),
//       });
//       console.log("✅ Invoice saved to Firebase");
//     } catch (err) {
//       console.error("❌ Error saving invoice:", err);
//     }
//   };

//   const downloadInvoicePDF = async () => {
//     const input = document.getElementById("invoice-content");
//     if (!input) return;

//     try {
//       const imgData = await toPng(input, { cacheBust: true });
//       const pdf = new jsPDF({
//         orientation: "p",
//         unit: "mm",
//         format: "a4",
//       });

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const imgWidth = pageWidth - 20;
//       const imgHeight = (input.offsetHeight * imgWidth) / input.offsetWidth;

//       pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
//       pdf.save(`invoice_${invoiceData?.id || Date.now()}.pdf`);

//       if (invoiceData) await saveInvoiceToFirebase(invoiceData);
//     } catch (error) {
//       console.error("❌ Error generating PDF:", error);
//       alert("Failed to generate PDF");
//     }
//   };

//   if (!isOpen || !invoiceData) return null;

//   const grandTotal =
//     (formData.totalPrice || 0) + (formData.tip || 0) - (formData.discount || 0);

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
//         {/* ===== HEADER ===== */}
//         <div className="p-4 border-b flex justify-between items-center">
//           <h3 className="text-lg font-semibold">Invoice</h3>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         {/* BRANCH SELECTION */}
//         <div className="p-4 border-b border-gray-200 rounded mb-4">
//           <h3 className="font-semibold text-lg mb-2">Select Branch Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="flex flex-col">
//               <label className="text-sm font-medium text-gray-700 mb-1">Brand Email</label>
//               <select
//                 disabled={!isEditing}
//                 className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-indigo-500"
//                 value={formData.businessEmail}
//                 onChange={(e) => handleFieldChange("businessEmail", e.target.value)}
//               >
//                 <option value="">Select email</option>
//                 <option value="branch@mirrosalon.ae">branch@mirrosalon.ae</option>
//                 <option value="marina@mirrosalon.ae">marina@mirrosalon.ae</option>
//                 <option value="ibnbattuta@mirrosalon.ae">ibnbattuta@mirrosalon.ae</option>
//                 <option value="albustan@mirrosalon.ae">albustan@mirrosalon.ae</option>
//                 <option value="tecom@mirrosalon.ae">tecom@mirrosalon.ae</option>
//               </select>
//             </div>

//             <div className="flex flex-col">
//               <label className="text-sm font-medium text-gray-700 mb-1">Brand Phone</label>
//               <select
//                 disabled={!isEditing}
//                 className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-indigo-500"
//                 value={formData.businessPhone}
//                 onChange={(e) => handleFieldChange("businessPhone", e.target.value)}
//               >
//                 <option value="">Select number</option>
//                 <option value="+971 56 300 5629">Marina: +971 56 300 5629</option>
//                 <option value="+971 54 321 0758">IBN Battuta: +971 54 321 0758</option>
//                 <option value="+971 50 545 8263">Al Bustan: +971 50 545 8263</option>
//                 <option value="+971 4 568 6219">TECOM: +971 4 568 6219</option>
//                 <option value="+971 4 269 1449">Al Muraqqabat: +971 4 269 1449</option>
//               </select>
//             </div>

//             <div className="flex flex-col">
//               <label className="text-sm font-medium text-gray-700 mb-1">Brand Address</label>
//               <select
//                 disabled={!isEditing}
//                 className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-indigo-500"
//                 value={formData.businessAddress}
//                 onChange={(e) => handleFieldChange("businessAddress", e.target.value)}
//               >
//                 <option value="">Select address</option>
//                 <option value="Marina Jannah Hotel, Marina - Dubai Marina - Dubai - UAE">
//                   Marina Jannah Hotel, Dubai Marina
//                 </option>
//                 <option value="IBN Battuta Mall - Sheikh Zayed Rd - Dubai - UAE">
//                   IBN Battuta Mall, Dubai
//                 </option>
//                 <option value="Al Bustan Centre & Residence - Qusais - Dubai - UAE">
//                   Al Bustan Centre, Dubai
//                 </option>
//                 <option value="New API Building - Barsha Heights - Dubai - UAE">
//                   TECOM, Dubai
//                 </option>
//                 <option value="Dominos Pizza Building - Al Muraqqabat - Dubai - UAE">
//                   Al Muraqqabat, Dubai
//                 </option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* INVOICE BODY */}
//         <div id="invoice-content" className="p-6">
//           <div className="flex justify-between mb-6">
//             <div>
//               {isEditing ? (
//                 <input
//                   value={formData.title}
//                   onChange={(e) => handleFieldChange("title", e.target.value)}
//                   className="text-2xl font-bold text-indigo-700 border-b border-gray-300 focus:outline-none"
//                 />
//               ) : (
//                 <h2 className="text-2xl font-bold text-indigo-700">{formData.title}</h2>
//               )}
//               <p className="text-sm text-gray-500">Booking ID: {invoiceData.id}</p>
//             </div>
//             <div className="text-right">
//               {["businessName", "businessEmail", "businessPhone", "businessAddress"].map((field) => (
//                 <p key={field} className="text-sm text-gray-500">
//                   {isEditing ? (
//                     <input
//                       value={(formData as any)[field]}
//                       onChange={(e) => handleFieldChange(field as keyof InvoiceFormData, e.target.value)}
//                       className="border-b border-gray-300 focus:outline-none text-right w-full"
//                     />
//                   ) : (
//                     (formData as any)[field]
//                   )}
//                 </p>
//               ))}
//             </div>
//           </div>

//           {/* CUSTOMER INFO */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
//             {[
//               "customerName",
//               "customerEmail",
//               "customerPhone",
//               "branch",
//               "bookingDate",
//               "bookingTime",
//               "staff",
//               "paymentMethod",
//             ].map((field) => (
//               <div key={field}>
//                 <p>
//                   <strong>{field.replace(/([A-Z])/g, " $1")}: </strong>
//                   {isEditing ? (
//                     <input
//                       value={(formData as any)[field]}
//                       onChange={(e) => handleFieldChange(field as keyof InvoiceFormData, e.target.value)}
//                       className="border-b border-gray-300 focus:outline-none"
//                     />
//                   ) : (
//                     (formData as any)[field]
//                   )}
//                 </p>
//               </div>
//             ))}
//           </div>

//           {/* SERVICES TABLE */}
//           <div className="border rounded-lg mb-4 overflow-hidden">
//             <table className="w-full text-sm">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="p-3 text-left">Service</th>
//                   <th className="p-3 text-center">Qty</th>
//                   <th className="p-3 text-right">Price</th>
//                   <th className="p-3 text-right">Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {formData.services.map((s: any, i: number) => (
//                   <tr key={i} className="border-t">
//                     <td className="p-3">
//                       {isEditing ? (
//                         <input
//                           value={s.serviceName}
//                           onChange={(e) => {
//                             const newServices = [...formData.services];
//                             newServices[i].serviceName = e.target.value;
//                             handleFieldChange("services", newServices);
//                           }}
//                           className="border-b border-gray-300 focus:outline-none w-full"
//                         />
//                       ) : (
//                         s.serviceName
//                       )}
//                     </td>
//                     <td className="p-3 text-center">
//                       {isEditing ? (
//                         <input
//                           value={s.quantity}
//                           onChange={(e) => {
//                             const newServices = [...formData.services];
//                             newServices[i].quantity = e.target.value;
//                             handleFieldChange("services", newServices);
//                           }}
//                           className="border-b border-gray-300 focus:outline-none w-16 text-center"
//                         />
//                       ) : (
//                         s.quantity
//                       )}
//                     </td>
//                     <td className="p-3 text-right">
//                       {isEditing ? (
//                         <input
//                           value={s.price}
//                           onChange={(e) => {
//                             const newServices = [...formData.services];
//                             newServices[i].price = e.target.value;
//                             handleFieldChange("services", newServices);
//                           }}
//                           className="border-b border-gray-300 focus:outline-none w-20 text-right"
//                         />
//                       ) : (
//                         `AED ${Number(s.price).toFixed(2)}`
//                       )}
//                     </td>
//                     <td className="p-3 text-right">
//                       AED {(Number(s.price) * Number(s.quantity)).toFixed(2)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* TOTALS */}
//           <div className="flex flex-col items-end gap-2 text-sm">
//             {["totalPrice", "tip", "discount"].map((f) => (
//               <div key={f} className="flex justify-between w-64">
//                 <span>{f === "totalPrice" ? "Subtotal:" : f === "tip" ? "Tip:" : "Discount:"}</span>
//                 <span>
//                   {isEditing ? (
//                     <input
//                       value={(formData as any)[f]}
//                       onChange={(e) => handleFieldChange(f as keyof InvoiceFormData, e.target.value)}
//                       className="border-b border-gray-300 focus:outline-none text-right w-20"
//                     />
//                   ) : (
//                     `AED ${Number((formData as any)[f] || 0).toFixed(2)}`
//                   )}
//                 </span>
//               </div>
//             ))}
//             <div className="flex justify-between w-64 border-t pt-2 font-bold">
//               <span>Grand Total:</span>
//               <span>AED {grandTotal.toFixed(2)}</span>
//             </div>
//           </div>

//           {/* FOOTER */}
//           <div className="mt-6 text-center text-sm text-gray-500">
//             {isEditing ? (
//               <textarea
//                 value={formData.footerText}
//                 onChange={(e) => handleFieldChange("footerText", e.target.value)}
//                 className="border border-gray-300 rounded p-2 w-full focus:outline-none"
//               />
//             ) : (
//               formData.footerText
//             )}
//           </div>
//         </div>

//         {/* ACTION BUTTONS */}
//         <div className="p-4 border-t flex justify-end gap-3">
//           <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">
//             Close
//           </button>
//           <button
//             onClick={() => setIsEditing(!isEditing)}
//             className="px-4 py-2 bg-indigo-500 text-white rounded-md"
//           >
//             {isEditing ? "Save Changes" : "Edit Invoice"}
//           </button>
//           <button
//             onClick={downloadInvoicePDF}
//             className="px-4 py-2 bg-pink-600 text-white rounded-md"
//           >
//             Download PDF
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// new
import { useState, useEffect } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Booking } from "@/types/booking";
import { X } from "lucide-react";

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
    footerText: "Thank you for your booking! We look forward to serving you.",
  });
   const { isAdmin } = useAuth();


  const handleFieldChange = (field: keyof InvoiceFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
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
        footerText: "Thank you for your booking! We look forward to serving you.",
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
      console.log("✅ Invoice saved to Firebase");
    } catch (err) {
      console.error("❌ Error saving invoice:", err);
    }
  };

  const downloadInvoicePDF = async () => {
    const input = document.getElementById("invoice-content");
    if (!input) return;

    try {
      const imgData = await toPng(input, { cacheBust: true });
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (input.offsetHeight * imgWidth) / input.offsetWidth;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`invoice_${invoiceData?.id || Date.now()}.pdf`);

      if (invoiceData) await saveInvoiceToFirebase(invoiceData);
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      alert("Failed to generate PDF");
    }
  };

  if (!isOpen || !invoiceData) return null;

  const grandTotal =
    (formData.totalPrice || 0) + (formData.tip || 0) - (formData.discount || 0);
   

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* ===== HEADER ===== */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Invoice</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BRANCH SELECTION */}
        <div className="p-4 border-b border-gray-200 rounded mb-4">
          <h3 className="font-semibold text-lg mb-2">Select Branch Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Brand Email</label>
              <select
               
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-indigo-500"
                value={formData.businessEmail}
                onChange={(e) => handleFieldChange("businessEmail", e.target.value)}
              >
                <option value="">Select email</option>
                <option value="branch@mirrosalon.ae">branch@mirrosalon.ae</option>
                <option value="marina@mirrosalon.ae">marina@mirrosalon.ae</option>
                <option value="ibnbattuta@mirrosalon.ae">ibnbattuta@mirrosalon.ae</option>
                <option value="albustan@mirrosalon.ae">albustan@mirrosalon.ae</option>
                <option value="tecom@mirrosalon.ae">tecom@mirrosalon.ae</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Brand Phone</label>
              <select
                
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-indigo-500"
                value={formData.businessPhone}
                onChange={(e) => handleFieldChange("businessPhone", e.target.value)}
              >
                <option value="">Select number</option>
                <option value="+971 56 300 5629">Marina: +971 56 300 5629</option>
                <option value="+971 54 321 0758">IBN Battuta: +971 54 321 0758</option>
                <option value="+971 50 545 8263">Al Bustan: +971 50 545 8263</option>
                <option value="+971 4 568 6219">TECOM: +971 4 568 6219</option>
                <option value="+971 4 269 1449">Al Muraqqabat: +971 4 269 1449</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Brand Address</label>
              <select
                
                className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-indigo-500"
                value={formData.businessAddress}
                onChange={(e) => handleFieldChange("businessAddress", e.target.value)}
              >
                <option value="">Select address</option>
                <option value="Marina Jannah Hotel, Marina - Dubai Marina - Dubai - UAE">
                  Marina Jannah Hotel, Dubai Marina
                </option>
                <option value="IBN Battuta Mall - Sheikh Zayed Rd - Dubai - UAE">
                  IBN Battuta Mall, Dubai
                </option>
                <option value="Al Bustan Centre & Residence - Qusais - Dubai - UAE">
                  Al Bustan Centre, Dubai
                </option>
                <option value="New API Building - Barsha Heights - Dubai - UAE">
                  TECOM, Dubai
                </option>
                <option value="Dominos Pizza Building - Al Muraqqabat - Dubai - UAE">
                  Al Muraqqabat, Dubai
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* INVOICE BODY */}
        <div id="invoice-content" className="p-6">
          <div className="flex justify-between mb-6">
            <div>
              {isEditing ? (
                <input
                  value={formData.title}
                  onChange={(e) => handleFieldChange("title", e.target.value)}
                  className="text-2xl font-bold text-indigo-700 border-b border-gray-300 focus:outline-none"
                />
              ) : (
                <h2 className="text-2xl font-bold text-indigo-700">{formData.title}</h2>
              )}
              <p className="text-sm text-gray-500">Booking ID: {invoiceData.id}</p>
            </div>
            <div className="text-right">
              {["businessName", "businessEmail", "businessPhone", "businessAddress"].map((field) => (
                <p key={field} className="text-sm text-gray-500">
                  {isEditing ? (
                    <input
                      value={(formData as any)[field]}
                      onChange={(e) => handleFieldChange(field as keyof InvoiceFormData, e.target.value)}
                      className="border-b border-gray-300 focus:outline-none text-right w-full"
                    />
                  ) : (
                    (formData as any)[field]
                  )}
                </p>
              ))}
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
            {[
              "customerName",
              "customerEmail",
              "customerPhone",
              "branch",
              "bookingDate",
              "bookingTime",
              "staff",
              "paymentMethod",
            ].map((field) => (
              <div key={field}>
                <p>
                  <strong>{field.replace(/([A-Z])/g, " $1")}: </strong>
                  {isEditing ? (
                    <input
                      value={(formData as any)[field]}
                      onChange={(e) => handleFieldChange(field as keyof InvoiceFormData, e.target.value)}
                      className="border-b border-gray-300 focus:outline-none"
                    />
                  ) : (
                    (formData as any)[field]
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* SERVICES TABLE */}
          <div className="border rounded-lg mb-4 overflow-hidden">
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
                {formData.services.map((s: any, i: number) => (
                  <tr key={i} className="border-t">
                    <td className="p-3">
                      {isEditing ? (
                        <input
                          value={s.serviceName}
                          onChange={(e) => {
                            const newServices = [...formData.services];
                            newServices[i].serviceName = e.target.value;
                            handleFieldChange("services", newServices);
                          }}
                          className="border-b border-gray-300 focus:outline-none w-full"
                        />
                      ) : (
                        s.serviceName
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <input
                          value={s.quantity}
                          onChange={(e) => {
                            const newServices = [...formData.services];
                            newServices[i].quantity = e.target.value;
                            handleFieldChange("services", newServices);
                          }}
                          className="border-b border-gray-300 focus:outline-none w-16 text-center"
                        />
                      ) : (
                        s.quantity
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <input
                          value={s.price}
                          onChange={(e) => {
                            const newServices = [...formData.services];
                            newServices[i].price = e.target.value;
                            handleFieldChange("services", newServices);
                          }}
                          className="border-b border-gray-300 focus:outline-none w-20 text-right"
                        />
                      ) : (
                        `AED ${Number(s.price).toFixed(2)}`
                      )}
                    </td>
                    <td className="p-3 text-right">
                      AED {(Number(s.price) * Number(s.quantity)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALS */}
          <div className="flex flex-col items-end gap-2 text-sm">
            {["totalPrice", "tip", "discount"].map((f) => (
              <div key={f} className="flex justify-between w-64">
                <span>{f === "totalPrice" ? "Subtotal:" : f === "tip" ? "Tip:" : "Discount:"}</span>
                <span>
                  {isEditing ? (
                    <input
                      value={(formData as any)[f]}
                      onChange={(e) => handleFieldChange(f as keyof InvoiceFormData, e.target.value)}
                      className="border-b border-gray-300 focus:outline-none text-right w-20"
                    />
                  ) : (
                    `AED ${Number((formData as any)[f] || 0).toFixed(2)}`
                  )}
                </span>
              </div>
            ))}
            <div className="flex justify-between w-64 border-t pt-2 font-bold">
              <span>Grand Total:</span>
              <span>AED {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-6 text-center text-sm text-gray-500">
            {isEditing ? (
              <textarea
                value={formData.footerText}
                onChange={(e) => handleFieldChange("footerText", e.target.value)}
                className="border border-gray-300 rounded p-2 w-full focus:outline-none"
              />
            ) : (
              formData.footerText
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="p-4 border-t flex justify-end gap-3">
  <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">
    Close
  </button>

  {isAdmin && (
    <button
      onClick={() => setIsEditing(!isEditing)}
      className="px-4 py-2 bg-indigo-500 text-white rounded-md"
    >
      {isEditing ? "Save Changes" : "Edit Invoice"}
    </button>
  )}

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
