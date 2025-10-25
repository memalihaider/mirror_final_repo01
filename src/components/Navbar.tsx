"use client";

import React, { useState, useEffect, useRef } from "react";
import { Menu, Moon, Sun, User, LogIn, LogOut, Bell, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Pacifico } from "next/font/google";
import SearchBar from "./SearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { signOutUser } from "@/lib/auth";
import { useRouter, usePathname } from "next/navigation";

// Firebase imports
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
});

type HeaderProps = {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  isMobile?: boolean;
};

type Notification = {
  id: string;
  type: "booking" | "chat" | "booking-update";
  message: string;
  createdAt?: any;
};

// Future Modules data
const futureModules = [
  {
    title: "Payroll & Commission Management",
    description: "Manage staff payroll and commission calculations",
    status: "Soon"
  },
  {
    title: "AI Product Performance Analytics",
    description: "AI-powered analytics for product performance",
    status: "Soon"
  },
  {
    title: "AI Expense Tracking",
    description: "Intelligent expense tracking and categorization",
    status: "Soon"
  },
  {
    title: "Audit Trail & Activity Logs",
    description: "Comprehensive audit trails and activity monitoring",
    status: "Soon"
  }
];

export default function Header({ onToggleSidebar, sidebarOpen, isMobile }: HeaderProps) {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const pathname = usePathname();

  if (pathname === "/signin") return null;

  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showFutureModules, setShowFutureModules] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState<Notification[]>([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const futureModulesRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const initialLoadRef = useRef(true);
  const processedBookingsRef = useRef<Set<string>>(new Set());

  // 🔔 Listen for new bookings and booking updates
  useEffect(() => {
    if (!db) return;
    
    const bookingsRef = collection(db, "bookings");
    const bookingsQuery = query(bookingsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      // Skip initial load to avoid notifications for existing data
      if (initialLoadRef.current) {
        initialLoadRef.current = false;
        // Store existing booking IDs to avoid notifying on them later
        snapshot.docs.forEach(doc => {
          processedBookingsRef.current.add(doc.id);
        });
        console.log("📚 Initial bookings loaded, notifications enabled for new changes");
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const docId = change.doc.id;
        const data = change.doc.data();
        
        if (change.type === "added") {
          // Only notify if this is truly a new booking (not from initial load)
          if (!processedBookingsRef.current.has(docId)) {
            console.log("📌 NEW BOOKING FROM FIREBASE/MOBILE:", data);

            const serviceName = data.services && Array.isArray(data.services) && data.services.length > 0 
              ? data.services[0].serviceName 
              : data.serviceName || data.service || "a service";

            const bookingNotification: Notification = {
              id: docId,
              type: "booking",
              message: `${data.customerName || data.name || "Customer"} booked ${serviceName}`,
              createdAt: data.createdAt,
            };

            // ✅ Add to unread
            setUnread((prev) => [bookingNotification, ...prev]);

            // ✅ Play sound
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.volume = 0.5;
              audioRef.current
                .play()
                .catch((err) => console.log("Sound error (booking):", err));
            }

            // Mark as processed
            processedBookingsRef.current.add(docId);
          }
        } else if (change.type === "modified") {
          console.log("📌 BOOKING UPDATED FROM FIREBASE/MOBILE:", data);

          const serviceName = data.services && Array.isArray(data.services) && data.services.length > 0 
            ? data.services[0].serviceName 
            : data.serviceName || data.service || "service";

          const updateNotification: Notification = {
            id: `${docId}-update-${Date.now()}`,
            type: "booking-update",
            message: `${data.customerName || data.name || "Customer"}'s booking (${serviceName}) was updated`,
            createdAt: data.updatedAt || data.createdAt,
          };

          // ✅ Add to unread
          setUnread((prev) => [updateNotification, ...prev]);

          // ✅ Play sound (different tone for updates)
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.7; // Slightly louder for updates
            audioRef.current
              .play()
              .catch((err) => console.log("Sound error (booking update):", err));
          }
        }
      });
    }, (error) => {
      console.error("❌ Booking notification listener error:", error);
    });

    return () => unsubscribe();
  }, []);

  // 🔔 Listen for new services (direct service collection monitoring)
  useEffect(() => {
    if (!db) return;
    
    const servicesRef = collection(db, "services");
    const servicesQuery = query(servicesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(servicesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          console.log("📌 NEW SERVICE ADDED:", data);

          const serviceNotification: Notification = {
            id: `service-${change.doc.id}`,
            type: "booking",
            message: `New service "${data.name || data.serviceName || "Unknown Service"}" was added`,
            createdAt: data.createdAt,
          };

          // ✅ Add to unread
          setUnread((prev) => [serviceNotification, ...prev]);

          // ✅ Play sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.4;
            audioRef.current
              .play()
              .catch((err) => console.log("Sound error (service):", err));
          }
        } else if (change.type === "modified") {
          const data = change.doc.data();
          console.log("📌 SERVICE UPDATED:", data);

          const serviceUpdateNotification: Notification = {
            id: `service-update-${change.doc.id}-${Date.now()}`,
            type: "booking-update",
            message: `Service "${data.name || data.serviceName || "Unknown Service"}" was updated`,
            createdAt: data.updatedAt || data.createdAt,
          };

          // ✅ Add to unread
          setUnread((prev) => [serviceUpdateNotification, ...prev]);

          // ✅ Play sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.4;
            audioRef.current
              .play()
              .catch((err) => console.log("Sound error (service update):", err));
          }
        }
      });
    }, (error) => {
      console.error("❌ Service notification listener error:", error);
    });

    return () => unsubscribe();
  }, []);

  // 🔔 Listen for new chats
  useEffect(() => {
    if (!db) return;
    
    const chatsRef = collection(db, "chats");
    const chatsQuery = query(chatsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(chatsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          console.log("📌 NEW CHAT:", data);

          const senderName =
            data.senderRole === "admin"
              ? "Admin"
              : data.senderName || data.sender || "User";

          const chatNotification: Notification = {
            id: change.doc.id,
            type: "chat",
            message: `Message from ${senderName}: ${
              data.message || data.text || data.content || "New message"
            }`,
            createdAt: data.createdAt,
          };

          // ✅ Add to unread
          setUnread((prev) => [chatNotification, ...prev]);

          // ✅ Play sound
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current
              .play()
              .catch((err) => console.log("Sound error (chat):", err));
          }
        }
      });
    });

    return () => unsubscribe();
  }, []);

  // Mark notifications as read when menu opens
  useEffect(() => {
    if (showNotificationMenu && unread.length > 0) {
      setNotifications(unread); // move all unread to main list
      setUnread([]); // clear unread
    }
  }, [showNotificationMenu, unread]);

  // Theme setup
  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    const isDark = saved === "dark";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setDarkMode(!darkMode);
  };

  // Handle scroll shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showUserMenu &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        showNotificationMenu &&
        notifyRef.current &&
        !notifyRef.current.contains(event.target as Node)
      ) {
        setShowNotificationMenu(false);
      }
      if (
        showFutureModules &&
        futureModulesRef.current &&
        !futureModulesRef.current.contains(event.target as Node)
      ) {
        setShowFutureModules(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu, showNotificationMenu, showFutureModules]);

  // Handle sign out
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const { error } = await signOutUser();
      if (error) {
        alert("Error signing out: " + error);
        setShowUserMenu(false);
      } else {
        setShowUserMenu(false);
        router.push("/signin");
      }
    } catch (error) {
      alert("Error signing out: " + error);
      setShowUserMenu(false);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.23, 0.86, 0.39, 0.96] }}
      className={cn(
        "relative z-40 flex items-center justify-between mx-2 mt-3 mr-2 px-3 py-2 rounded-xl shadow-md transition-all duration-300",
        scrolled ? "shadow-lg" : "",
        // Responsive margin based on sidebar state
        isMobile 
          ? "ml-2" 
          : sidebarOpen 
            ? "ml-72" // expanded sidebar (280px)
            : "ml-16" // collapsed sidebar (56px + margin)
      )}
    >
      {/* 🔊 Hidden audio */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto"></audio>

      {/* Left Section */}
      <div className="relative z-10 flex items-center space-x-4 ">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg bg-pink-100/40 dark:bg-pink-900/20"
            title="Toggle Sidebar"
            type="button"
          >
            <Menu className="w-4 h-4 text-pink-600 dark:text-pink-300" />
          </button>
        )}
        <div className="flex flex-col">
          <h1 className="text-sm font-semibold text-pink-600 dark:text-gray-200">
            Mirrors Beauty Lounge
          </h1>
          <div className="text-[10px] text-gray-600 dark:text-gray-400">
            Welcome to{" "}
            <span
              className={cn(
                "relative bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500 text-transparent bg-clip-text",
                pacifico.className
              )}
            >
              Your Salon
            </span>
          </div>
        </div>
      </div>

      {/* Center Section - Search Bar and Future Modules */}
      <div className="relative flex-1 flex items-center justify-center space-x-2 sm:space-x-4 max-w-2xl mx-2 sm:mx-4">
        {/* Search Bar */}
        <div className="flex-1 max-w-xs sm:max-w-md">
          <SearchBar className="w-full" />
        </div>
        
        {/* Future Modules Dropdown */}
        <div className="relative" ref={futureModulesRef}>
          <button
            onClick={() => setShowFutureModules(!showFutureModules)}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 
                       hover:from-pink-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl 
                       transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium hidden xs:inline">Future Modules</span>
            <span className="text-xs sm:text-sm font-medium xs:hidden">Future</span>
            <motion.div
              animate={{ rotate: showFutureModules ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showFutureModules && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 w-72 sm:w-80 bg-white dark:bg-gray-900 border border-pink-200 
                           dark:border-pink-700 rounded-xl shadow-xl z-50 overflow-hidden right-0"
              >
                <div className="p-3 sm:p-4 border-b border-pink-100 dark:border-pink-700/40 bg-gradient-to-r 
                                from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
                  <h3 className="text-sm font-semibold text-pink-700 dark:text-pink-300">
                    Advanced Future Modules
                  </h3>
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                    Coming soon - Advanced features for your salon
                  </p>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {futureModules.map((module, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700/40 last:border-b-0 
                                 hover:bg-pink-50/50 dark:hover:bg-pink-900/10 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {module.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {module.description}
                          </p>
                        </div>
                        <span className="ml-3 px-2 py-1 text-xs font-medium bg-pink-100 dark:bg-pink-900/30 
                                       text-pink-700 dark:text-pink-300 rounded-full">
                          {module.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    These features are currently in development
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Section */}
      <div className="relative z-10 flex items-center space-x-3">
        {/* 🔔 Notifications */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="relative p-2 rounded-lg bg-pink-100/40 dark:bg-pink-900/20"
          >
            <Bell className="w-5 h-5 text-pink-600 dark:text-pink-300" />
            {(unread.length > 0 || notifications.length > 0) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            )}
          </button>

          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-pink-200 dark:border-pink-700 rounded-lg shadow-lg z-50">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div className="p-3 text-xs text-gray-500 dark:text-gray-400">
                  No new notifications
                </div>
              ) : (
                <ul className="max-h-60 overflow-y-auto">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`px-3 py-2 text-xs ${
                        n.type === "booking"
                          ? "text-pink-700 dark:text-pink-300"
                          : "text-blue-700 dark:text-blue-300"
                      } hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer`}
                    >
                      {n.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {/* <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg border bg-pink-100/40 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button> */}

        {/* Profile Section */}
        <div className="relative flex items-center" ref={menuRef}>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-2 sm:px-3 py-1.5 rounded-lg border border-pink-200/40 
                           bg-pink-100/40 dark:bg-pink-900/20 hover:bg-pink-200/50 dark:hover:bg-pink-800/30 
                           shadow-sm transition"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-pink-100/60 to-pink-200/50 
                                flex items-center justify-center border border-pink-200/50">
                  <User className="h-3.5 w-3.5 text-pink-600" />
                </div>
                <span className="hidden sm:inline text-xs font-medium text-gray-900 dark:text-gray-200">
                  {user.displayName || user.email}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl 
                                   border border-pink-200/30 dark:border-pink-700/40 rounded-xl shadow-lg z-50">
                  <div className="p-3 border-b border-pink-100 dark:border-pink-700/40">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">
                      {user.displayName || user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-pink-600 capitalize">
                      {userRole?.role || "User"}
                    </p>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/profile");
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium 
                                 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/40 
                                 rounded-lg transition"
                    >
                      <User className="h-3.5 w-3.5" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium 
                                 text-red-600 hover:bg-red-50 dark:hover:bg-red-800/40 
                                 rounded-lg transition"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push("/signin")}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium 
                         text-pink-700 bg-pink-100/60 hover:bg-pink-200/70 
                         rounded-lg shadow-sm border border-pink-200/50 transition"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}



