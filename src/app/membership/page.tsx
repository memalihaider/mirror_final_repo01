// "use client";

// import React, { useEffect, useState } from "react";
// import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from "@/contexts/AuthContext";
// import { useRouter } from "next/navigation";

// import {
//   collection,
//   query,
//   orderBy,
//   onSnapshot,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   doc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import AccessWrapper from "@/components/AccessWrapper";

// // -------- Types --------
// type Membership = { id?: string; name: string; description: string; spending: number; createdAt?: any };
// type LoyaltyPoint = { id?: string; name: string; description: string; points: number; createdAt?: any };
// type BookingRestriction = { id?: string; number: number; description: string; createdAt?: any };
// type SmsContent = { id?: string; name: string; description: string; createdAt?: any };
// type PaymentMethod = { id?: string; name: string; createdAt?: any };
// type CashbackProgram = { id?: string; spending: number; discount: number; createdAt?: any };

// export default function MembershipsPage() {
//   const { user } = useAuth();
//   const router = useRouter();

//   const [memberships, setMemberships] = useState<Membership[]>([]);
//   const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
//   const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction[]>([]);
//   const [smsContents, setSmsContents] = useState<SmsContent[]>([]);
//   const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
//   const [cashbackPrograms, setCashbackPrograms] = useState<CashbackProgram[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [modalType, setModalType] = useState<
//     "membership" | "loyalty" | "restriction" | "sms" | "payment" | "cashback"
//   >("membership");
//   const [form, setForm] = useState<{
//     name: string;
//     description: string;
//     spending?: string;
//     points?: string;
//     number?: string;
//     discount?: string;
//   }>({
//     name: "",
//     description: "",
//     spending: "",
//     points: "",
//     number: "",
//     discount: "",
//   });
//   const [saving, setSaving] = useState(false);

//   // -------- Fetch Data --------
//   useEffect(() => {
//     if (!db) return;

//     setLoading(true);
//     try {
//       const membershipsRef = collection(db, "memberships");
//       const loyaltyPointsRef = collection(db, "loyaltyPoints");
//       const bookingRestrictionsRef = collection(db, "bookingRestrictions");
//       const smsContentsRef = collection(db, "smsContents");
//       const paymentMethodsRef = collection(db, "paymentMethods");
//       const cashbackProgramsRef = collection(db, "cashbackPrograms");

//       const unsub1 = onSnapshot(query(membershipsRef, orderBy("createdAt", "asc")), (snap) =>
//         setMemberships(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub2 = onSnapshot(query(loyaltyPointsRef, orderBy("createdAt", "asc")), (snap) =>
//         setLoyaltyPoints(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub3 = onSnapshot(query(bookingRestrictionsRef, orderBy("createdAt", "asc")), (snap) =>
//         setBookingRestrictions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub4 = onSnapshot(query(smsContentsRef, orderBy("createdAt", "asc")), (snap) =>
//         setSmsContents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub5 = onSnapshot(query(paymentMethodsRef, orderBy("createdAt", "asc")), (snap) =>
//         setPaymentMethods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );
//       const unsub6 = onSnapshot(query(cashbackProgramsRef, orderBy("createdAt", "asc")), (snap) =>
//         setCashbackPrograms(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
//       );

//       setLoading(false);
//       return () => {
//         unsub1();
//         unsub2();
//         unsub3();
//         unsub4();
//         unsub5();
//         unsub6();
//       };
//     } catch (err) {
//       console.error("subscribe error:", err);
//       setLoading(false);
//     }
//   }, []);

//   // -------- Modal Helpers --------
//   const openAddModal = (type: typeof modalType) => {
//     setForm({ name: "", description: "", spending: "", points: "", number: "", discount: "" });
//     setEditingId(null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const openEditModal = (item: any, type: typeof modalType) => {
//     setForm({
//       name: item.name || "",
//       description: item.description || "",
//       spending:
//         type === "membership" || type === "cashback" ? item.spending?.toString() || "" : "",
//       points: type === "loyalty" ? item.points?.toString() || "" : "",
//       number: type === "restriction" ? item.number?.toString() || "" : "",
//       discount: type === "cashback" ? item.discount?.toString() || "" : "",
//     });
//     setEditingId(item.id || null);
//     setModalType(type);
//     setIsModalOpen(true);
//   };

//   const closeModal = () => {
//     setIsModalOpen(false);
//     setEditingId(null);
//     setForm({ name: "", description: "", spending: "", points: "", number: "", discount: "" });
//     setSaving(false);
//   };

//   // -------- Save --------
//   const handleSave = async (e?: React.FormEvent) => {
//     e?.preventDefault();
//     if (!db) return;

//     setSaving(true);
//     try {
//       const colMap = {
//         membership: "memberships",
//         loyalty: "loyaltyPoints",
//         restriction: "bookingRestrictions",
//         sms: "smsContents",
//         payment: "paymentMethods",
//         cashback: "cashbackPrograms",
//       };

//       const data: any = {
//         name: form.name.trim(),
//         description: form.description.trim(),
//         createdAt: serverTimestamp(),
//       };

//       if (modalType === "membership") data.spending = Number(form.spending);
//       if (modalType === "loyalty") data.points = Number(form.points);
//       if (modalType === "restriction") {
//         delete data.name;
//         data.number = Number(form.number);
//       }
//       if (modalType === "cashback") {
//         delete data.name;
//         delete data.description;
//         data.spending = Number(form.spending);
//         data.discount = Number(form.discount);
//       }

//       const col = colMap[modalType];
//       if (editingId)
//         await updateDoc(doc(db, col, editingId), { ...data, updatedAt: serverTimestamp() });
//       else await addDoc(collection(db, col), data);
//       closeModal();
//     } catch (err) {
//       console.error("save error:", err);
//       alert("Error saving item. See console.");
//       setSaving(false);
//     }
//   };

//   // -------- Delete --------
//   const handleDelete = async (id?: string, type: typeof modalType = "membership") => {
//     if (!id) return;
//     if (!confirm("Are you sure you want to delete this item?")) return;
//     try {
//       const colMap = {
//         membership: "memberships",
//         loyalty: "loyaltyPoints",
//         restriction: "bookingRestrictions",
//         sms: "smsContents",
//         payment: "paymentMethods",
//         cashback: "cashbackPrograms",
//       };
//       await deleteDoc(doc(db, colMap[type], id));
//     } catch (err) {
//       console.error("delete error:", err);
//       alert("Error deleting. See console.");
//     }
//   };

//   // -------- Render Section --------
//   const renderSection = (
//     title: string,
//     color: string,
//     type: typeof modalType,
//     items: any[],
//     valueLabel?: string
//   ) => (
//     <div>
//       <div className="flex items-center justify-between mb-6">
//         <h2 className={`text-2xl font-semibold ${color}`}>{title}</h2>
//         <button
//           onClick={() => openAddModal(type)}
//           className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-lg ${color.replace(
//             "text-",
//             "bg-"
//           )} hover:scale-[1.01] transition`}
//         >
//           <Plus className="w-4 h-4 text-black" />
//           <p className="text-black">Add</p>
//         </button>
//       </div>

//       {loading ? (
//         <div className="p-6 rounded-lg bg-white/80">Loading...</div>
//       ) : items.length === 0 ? (
//         <div className="p-6 rounded-lg bg-white/80 text-center">
//           No items yet. Click “Add” to create one.
//         </div>
//       ) : (
//         <div className="grid gap-4 md:grid-cols-3">
//           {items.map((item) => (
//             <div
//               key={item.id}
//               className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border shadow"
//             >
//               <div className="flex items-start justify-between">
//                 <div>
//                   {item.name && (
//                     <h3 className={`text-lg font-semibold ${color}`}>{item.name}</h3>
//                   )}
//                   {item.number && (
//                     <h3 className={`text-lg font-semibold ${color}`}>
//                       Limit: {item.number}
//                     </h3>
//                   )}
//                   {item.spending && (
//                     <h3 className={`text-lg font-semibold ${color}`}>
//                       Spend: {item.spending}
//                     </h3>
//                   )}
//                   {item.discount && (
//                     <p className="text-sm text-gray-700 mt-1">
//                       Discount: {item.discount}%
//                     </p>
//                   )}
//                   {item.description && (
//                     <p className="text-sm text-gray-600 mt-1">{item.description}</p>
//                   )}
//                   {valueLabel && item[valueLabel] !== undefined && (
//                     <p className={`text-sm font-medium ${color} mt-2`}>
//                       {valueLabel.charAt(0).toUpperCase() + valueLabel.slice(1)}:{" "}
//                       {item[valueLabel]}
//                     </p>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <button
//                     onClick={() => openEditModal(item, type)}
//                     className="p-1 hover:bg-gray-100 rounded-md"
//                   >
//                     <Edit2 className="w-4 h-4" />
//                   </button>
//                   <button
//                     onClick={() => handleDelete(item.id, type)}
//                     className="p-1 hover:bg-red-50 rounded-md"
//                   >
//                     <Trash2 className="w-4 h-4 text-red-600" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <AccessWrapper>
//       <div className="p-6 max-w-5xl mx-auto space-y-10">
//         {renderSection("Memberships", "text-indigo-600", "membership", memberships, "spending")}
//         {renderSection("Loyalty Points", "text-emerald-600", "loyalty", loyaltyPoints, "points")}
//         {renderSection(
//           "Booking Restrictions",
//           "text-rose-600",
//           "restriction",
//           bookingRestrictions,
//           "number"
//         )}
//         {renderSection("SMS Content (COMING SOON)", "text-cyan-600", "sms", smsContents)}
//         {renderSection("Payment Methods", "text-amber-600", "payment", paymentMethods)}
//         {renderSection("Cashback Programs (COMING SOON)", "text-pink-600", "cashback", cashbackPrograms)}
//       </div>

//       {/* Modal */}
//       <AnimatePresence>
//         {isModalOpen && (
//           <motion.div
//             key="modal-overlay"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center"
//           >
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
//               onClick={closeModal}
//             />

//             <motion.form
//               key="modal-panel"
//               initial={{ y: -20, opacity: 0, scale: 0.98 }}
//               animate={{ y: 0, opacity: 1, scale: 1 }}
//               exit={{ y: 10, opacity: 0, scale: 0.98 }}
//               transition={{ type: "spring", stiffness: 400, damping: 28 }}
//               onSubmit={handleSave}
//               className="relative z-50 w-full max-w-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl p-6 shadow-xl border"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <h4 className="text-sm font-medium">
//                   {editingId ? `Edit ${modalType}` : `New ${modalType}`}
//                 </h4>
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="p-1 rounded-md hover:bg-gray-100"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>

//               <div className="space-y-3">
//                 {modalType === "cashback" ? (
//                   <>
//                     <label className="block text-xs text-gray-600 mb-1">Spending</label>
//                     <input
//                       type="number"
//                       value={form.spending}
//                       onChange={(e) =>
//                         setForm((s) => ({ ...s, spending: e.target.value }))
//                       }
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter spending amount"
//                       required
//                     />
//                     <label className="block text-xs text-gray-600 mb-1 mt-2">
//                       Discount (%)
//                     </label>
//                     <input
//                       type="number"
//                       value={form.discount}
//                       onChange={(e) =>
//                         setForm((s) => ({ ...s, discount: e.target.value }))
//                       }
//                       className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       placeholder="Enter discount percentage"
//                       required
//                     />
//                   </>
//                 ) : (
//                   <>
//                     {modalType !== "restriction" && modalType !== "payment" && (
//                       <>
//                         <label className="block text-xs text-gray-600 mb-1">Name</label>
//                         <input
//                           value={form.name}
//                           onChange={(e) =>
//                             setForm((s) => ({ ...s, name: e.target.value }))
//                           }
//                           className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                           placeholder="Enter name"
//                           required
//                         />
//                       </>
//                     )}
//                     {modalType === "payment" && (
//                       <>
//                         <label className="block text-xs text-gray-600 mb-1">
//                           Method Name
//                         </label>
//                         <input
//                           value={form.name}
//                           onChange={(e) =>
//                             setForm((s) => ({ ...s, name: e.target.value }))
//                           }
//                           className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                           placeholder="Enter payment method"
//                           required
//                         />
//                       </>
//                     )}
//                     {modalType !== "payment" && (
//                       <div>
//                         <label className="block text-xs text-gray-600 mb-1">
//                           Description
//                         </label>
//                         <textarea
//                           value={form.description}
//                           onChange={(e) =>
//                             setForm((s) => ({ ...s, description: e.target.value }))
//                           }
//                           className="w-full px-3 py-2 rounded-lg border bg-white text-sm min-h-[80px]"
//                           placeholder="Short description"
//                         />
//                       </div>
//                     )}
//                     {modalType === "membership" && (
//                       <input
//                         type="number"
//                         placeholder="Spending"
//                         value={form.spending}
//                         onChange={(e) =>
//                           setForm((s) => ({ ...s, spending: e.target.value }))
//                         }
//                         className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       />
//                     )}
//                     {modalType === "loyalty" && (
//                       <input
//                         type="number"
//                         placeholder="Points"
//                         value={form.points}
//                         onChange={(e) =>
//                           setForm((s) => ({ ...s, points: e.target.value }))
//                         }
//                         className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       />
//                     )}
//                     {modalType === "restriction" && (
//                       <input
//                         type="number"
//                         placeholder="Restriction Limit"
//                         value={form.number}
//                         onChange={(e) =>
//                           setForm((s) => ({ ...s, number: e.target.value }))
//                         }
//                         className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
//                       />
//                     )}
//                   </>
//                 )}
//               </div>

//               <div className="mt-6 flex items-center justify-end gap-2">
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="px-4 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={saving}
//                   className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
//                 >
//                   {saving ? "Saving..." : editingId ? "Update" : "Save"}
//                 </button>
//               </div>
//             </motion.form>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </AccessWrapper>
//   );
// }

// term and conditions







"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AccessWrapper from "@/components/AccessWrapper";

type Membership = { id?: string; name: string; description: string; spending: number; createdAt?: any };
type LoyaltyPoint = { id?: string; name: string; description: string; points: number; createdAt?: any };
type BookingRestriction = { id?: string; number: number; description: string; createdAt?: any };
type SmsContent = { id?: string; name: string; description: string; createdAt?: any };
type PaymentMethod = { id?: string; name: string; createdAt?: any };
type CashbackProgram = { id?: string; spending: number; discount: number; createdAt?: any };
type TermsCondition = { id?: string; name: string; description: string; createdAt?: any };

export default function MembershipsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = useState<LoyaltyPoint[]>([]);
  const [bookingRestrictions, setBookingRestrictions] = useState<BookingRestriction[]>([]);
  const [smsContents, setSmsContents] = useState<SmsContent[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [cashbackPrograms, setCashbackPrograms] = useState<CashbackProgram[]>([]);
  const [termsConditions, setTermsConditions] = useState<TermsCondition[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalType, setModalType] = useState<
    "membership" | "loyalty" | "restriction" | "sms" | "payment" | "cashback" | "terms"
  >("membership");

  const [form, setForm] = useState<{
    name: string;
    description: string;
    spending?: string;
    points?: string;
    number?: string;
    discount?: string;
  }>({
    name: "",
    description: "",
    spending: "",
    points: "",
    number: "",
    discount: "",
  });

  const [saving, setSaving] = useState(false);

  // -------- Fetch Data --------
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    try {
      const collectionsMap = {
        memberships: "memberships",
        loyaltyPoints: "loyaltyPoints",
        bookingRestrictions: "bookingRestrictions",
        smsContents: "smsContents",
        paymentMethods: "paymentMethods",
        cashbackPrograms: "cashbackPrograms",
        termsConditions: "termsAndConditions",
      };

      const unsubs = Object.entries(collectionsMap).map(([stateKey, colName]) => {
        const ref = collection(db, colName);
        return onSnapshot(query(ref, orderBy("createdAt", "asc")), (snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
          switch (stateKey) {
            case "memberships":
              setMemberships(data);
              break;
            case "loyaltyPoints":
              setLoyaltyPoints(data);
              break;
            case "bookingRestrictions":
              setBookingRestrictions(data);
              break;
            case "smsContents":
              setSmsContents(data);
              break;
            case "paymentMethods":
              setPaymentMethods(data);
              break;
            case "cashbackPrograms":
              setCashbackPrograms(data);
              break;
            case "termsConditions":
              setTermsConditions(data);
              break;
          }
        });
      });

      setLoading(false);
      return () => unsubs.forEach((u) => u());
    } catch (err) {
      console.error("subscribe error:", err);
      setLoading(false);
    }
  }, []);

  // -------- Modal Helpers --------
  const openAddModal = (type: typeof modalType) => {
    setForm({ name: "", description: "", spending: "", points: "", number: "", discount: "" });
    setEditingId(null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const openEditModal = (item: any, type: typeof modalType) => {
    setForm({
      name: item.name || "",
      description: item.description || "",
      spending:
        type === "membership" || type === "cashback" ? item.spending?.toString() || "" : "",
      points: type === "loyalty" ? item.points?.toString() || "" : "",
      number: type === "restriction" ? item.number?.toString() || "" : "",
      discount: type === "cashback" ? item.discount?.toString() || "" : "",
    });
    setEditingId(item.id || null);
    setModalType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm({ name: "", description: "", spending: "", points: "", number: "", discount: "" });
    setSaving(false);
  };

  // -------- Save --------
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!db) return;
    setSaving(true);
    try {
      const colMap = {
        membership: "memberships",
        loyalty: "loyaltyPoints",
        restriction: "bookingRestrictions",
        sms: "smsContents",
        payment: "paymentMethods",
        cashback: "cashbackPrograms",
        terms: "termsAndConditions",
      };

      const data: any = {
        name: form.name.trim(),
        description: form.description.trim(),
        createdAt: serverTimestamp(),
      };

      if (modalType === "membership") data.spending = Number(form.spending);
      if (modalType === "loyalty") data.points = Number(form.points);
      if (modalType === "restriction") {
        delete data.name;
        data.number = Number(form.number);
      }
      if (modalType === "cashback") {
        delete data.name;
        delete data.description;
        data.spending = Number(form.spending);
        data.discount = Number(form.discount);
      }

      const col = colMap[modalType];
      if (editingId)
        await updateDoc(doc(db, col, editingId), { ...data, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, col), data);
      closeModal();
    } catch (err) {
      console.error("save error:", err);
      alert("Error saving item. See console.");
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string, type: typeof modalType = "membership") => {
    if (!id) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const colMap = {
        membership: "memberships",
        loyalty: "loyaltyPoints",
        restriction: "bookingRestrictions",
        sms: "smsContents",
        payment: "paymentMethods",
        cashback: "cashbackPrograms",
        terms: "termsAndConditions",
      };
      await deleteDoc(doc(db, colMap[type], id));
    } catch (err) {
      console.error("delete error:", err);
      alert("Error deleting. See console.");
    }
  };

  const renderSection = (
    title: string,
    color: string,
    type: typeof modalType,
    items: any[]
  ) => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-2xl font-semibold ${color}`}>{title}</h2>
        <button
          onClick={() => openAddModal(type)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white shadow-lg ${color.replace(
            "text-",
            "bg-"
          )} hover:scale-[1.01] transition`}
        >
          <Plus className="w-4 h-4 text-black" />
          <p className="text-black">Add</p>
        </button>
      </div>

      {loading ? (
        <div className="p-6 rounded-lg bg-white/80">Loading...</div>
      ) : items.length === 0 ? (
        <div className="p-6 rounded-lg bg-white/80 text-center">
          No items yet. Click “Add” to create one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white/90 dark:bg-gray-900 p-4 rounded-2xl border shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  {item.name && (
                    <h3 className={`text-lg font-semibold ${color}`}>{item.name}</h3>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                  {item.spending && (
                    <p className="text-xs text-gray-500 mt-1">
                      Spending: {item.spending}
                      {item.discount ? ` | Discount: ${item.discount}%` : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(item, type)}
                    className="p-1 hover:bg-gray-100 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, type)}
                    className="p-1 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <AccessWrapper>
      <div className="p-6 max-w-5xl mx-auto space-y-10">
        {renderSection("Memberships", "text-indigo-600", "membership", memberships)}
        {renderSection("Loyalty Points", "text-emerald-600", "loyalty", loyaltyPoints)}
        {renderSection("Booking Restrictions", "text-rose-600", "restriction", bookingRestrictions)}
        {renderSection("SMS Content (COMING SOON)", "text-cyan-600", "sms", smsContents)}
        {renderSection("Payment Methods", "text-amber-600", "payment", paymentMethods)}
        {renderSection("Cashback Programs", "text-pink-600", "cashback", cashbackPrograms)}
        {renderSection("Terms & Conditions", "text-blue-600", "terms", termsConditions)}
      </div>

      {/* ---------- Modal ---------- */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />

            <motion.form
              key="modal-panel"
              initial={{ y: -20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              onSubmit={handleSave}
              className="relative z-50 w-full max-w-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl p-6 shadow-xl border"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium capitalize">
                  {editingId ? `Edit ${modalType}` : `New ${modalType}`}
                </h4>
                <button type="button" onClick={closeModal} className="p-1 rounded-md hover:bg-gray-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-4">
                {modalType === "cashback" ? (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Spending</label>
                      <input
                        value={form.spending}
                        onChange={(e) => setForm((s) => ({ ...s, spending: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                        placeholder="Enter spending amount"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Discount (%)</label>
                      <input
                        value={form.discount}
                        onChange={(e) => setForm((s) => ({ ...s, discount: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                        placeholder="Enter discount percentage"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Name</label>
                      <input
                        value={form.name}
                        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                        placeholder="Enter name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border bg-white text-sm min-h-[80px]"
                        placeholder="Short description"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm rounded-lg border bg-gray-50 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Save"}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </AccessWrapper>
  );
}
