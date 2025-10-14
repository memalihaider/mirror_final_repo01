import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useResources() {
  const [staff, setStaff] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const [
          staffSnap,
          branchesSnap,
          servicesSnap,
          paymentMethodsSnap
        ] = await Promise.all([
          getDocs(collection(db, "staff")),
          getDocs(collection(db, "branches")),
          getDocs(collection(db, "services")),
          getDocs(collection(db, "paymentMethods"))
        ]);

        // Remove duplicate staff names
        const uniqueStaff = Array.from(
          new Set(
            staffSnap.docs
              .map(d => String(d.data().name || d.data().staffName || ""))
              .filter(name => name.trim() !== "")
          )
        );

        const uniqueBranches = Array.from(
          new Set(
            branchesSnap.docs
              .map(d => String(d.data().name || ""))
              .filter(name => name.trim() !== "")
          )
        );

        setStaff(uniqueStaff);
        setBranches(uniqueBranches);
        setServices(servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setPaymentMethods(paymentMethodsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        console.log('Loaded resources:', {
          staff: uniqueStaff,
          branches: uniqueBranches,
          services: servicesSnap.docs.length,
          paymentMethods: paymentMethodsSnap.docs.length
        });
        
      } catch (error) {
        console.error("Error loading resources:", error);
        // Set fallbacks with unique values
        const fallbackStaff = ["Komal", "Shameem", "Do Thi Kim", "Alishba"];
        setStaff(fallbackStaff);
        setBranches(["AI Bustaan", "Marina", "TECOM", "AL Muraqabat", "IBN Batutta Mall"]);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  return {
    staff,
    branches,
    services,
    paymentMethods,
    loading
  };
}