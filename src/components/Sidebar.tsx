"use client";

import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Calendar,
  UserCircle,
  Building2,
  MessageCircle,
  ChevronRight,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  FileText,
  CreditCard,
  BarChart3,
  Settings,
  ClipboardList,
  Receipt,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Pacifico } from 'next/font/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect, useRef } from 'react';

const pacifico = Pacifico({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-pacifico',
});

// Navigation items
const navItems: {
  icon: any;
  label: string;
  href: string;
  roles: string[];
  subItems?: { label: string; href: string; description?: string; icon?: any }[];
}[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "user"] },

  // ✅ Invoice Management Added
  {
    icon: Receipt,
    label: "Invoice Management",
    href: "/invoice-generator",
    roles: ["admin", "user"],
    subItems: [
      { label: "Create Invoice", href: "/invoice-generator" },
    ],
  },

  // Product Management
  {
    icon: FolderOpen,
    label: "Product Management",
    href: "/products",
    roles: ["admin", "user"],
    subItems: [
      { label: "Categories", href: "/catagories" },
      { label: "Services", href: "/services" },
      { label: "Offers & Promotions", href: "/offers" },
    ],
  },

  { icon: Calendar, label: "Appointment Management", href: "/bookings", roles: ["admin"], subItems: [] },
  { icon: ShoppingCart, label: "E-commerce", href: "/ecommerce", roles: ["admin", "user"], subItems: [] },
  { icon: TrendingUp, label: "Sales Analytics", href: "/sales", roles: ["admin", "user"], subItems: [] },
  { icon: MessageCircle, label: "Customer Support", href: "/chat", roles: ["admin"], subItems: [] },
  { icon: Building2, label: "Branch Management", href: "/branches", roles: ["admin", "user"], subItems: [] },
  { icon: CreditCard, label: "Membership Plans", href: "/membership", roles: ["admin", "user"], subItems: [] },
  { icon: FileText, label: "Membership & LoyaltyPoints Reports", href: "/membershipReport", roles: ["admin", "user"], subItems: [] },
  { icon: FileText, label: "Feedback Report", href: "/feedback", roles: ["admin", "user"], subItems: [] },

  // Staff Management
  { icon: UserCheck, label: "Staff Management", href: "/staff", roles: ["admin", "user"], subItems: [] },
  { icon: UserCheck, label: "Booking Approval Page", href: "/bookingstatus", roles: ["admin", "user"], subItems: [] },
  { icon: ClipboardList, label: "Daily Tasks", href: "/staffDailyTasks", roles: ["admin", "user"], subItems: [] },
  { icon: BarChart3, label: "Business Reports", href: "/reports", roles: ["admin", "user"], subItems: [] },
  
  // Customer Management
  { icon: UserCircle, label: "Customer Management", href: "/customers", roles: ["admin", "user"], subItems: [] },

  { icon: Users, label: "User Administration", href: "/users", roles: ["admin"], subItems: [] },
  { icon: Settings, label: "Profile Settings", href: "/profile", roles: ["admin", "user"], subItems: [] },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // ✅ Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ Sync theme from localStorage
  useEffect(() => {
    const isDark = localStorage.getItem("theme") === "dark";
    setDarkMode(isDark);

    const observer = new MutationObserver(() => {
      setDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // ✅ Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && 
          mobileOpen && 
          sidebarRef.current && 
          !sidebarRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, mobileOpen]);

  // ✅ Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile]);

  // ✅ Ab hooks ke baad conditional return
  if (pathname === "/signin") {
    return null;
  }

  const isMenuItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (href: string) => {
    setOpenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleToggle = () => {
    onToggle();
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    }
  };

  // Mobile overlay and sidebar
  if (isMobile) {
    return (
      <>
        {/* Mobile Toggle Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "fixed top-4 left-4 z-50 p-2 rounded-xl",
            "bg-gradient-to-br from-pink-500 to-pink-600",
            "text-white shadow-lg shadow-pink-500/25",
            "transition-all duration-300 hover:scale-110",
            "md:hidden"
          )}
        >
          <motion.div
            animate={{ rotate: mobileOpen ? 90 : 0 }}
            transition={{ duration: 0.3 }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.div>
        </button>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              ref={sidebarRef}
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                'fixed left-0 top-0 h-full z-50 flex flex-col w-80',
                'bg-gradient-to-b from-white via-white to-pink-50/30',
                'dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50',
                'border-r border-pink-100/50 dark:border-slate-700/50',
                'shadow-2xl shadow-pink-100/30 dark:shadow-slate-900/50',
                'md:hidden'
              )}
            >
              <MobileSidebarContent 
                pathname={pathname}
                darkMode={darkMode}
                openMenus={openMenus}
                toggleSubmenu={toggleSubmenu}
                handleNavigation={handleNavigation}
                isMenuItemActive={isMenuItemActive}
                onClose={() => setMobileOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <>
      {/* Desktop Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed top-6 z-40 p-2 rounded-xl transition-all duration-300 hover:scale-110",
          "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg",
          "border border-pink-400/20 backdrop-blur-sm",
          collapsed ? "left-4" : "left-64",
          "hidden md:flex items-center justify-center"
        )}
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Desktop Sidebar */}
      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{
          width: collapsed ? '80px' : '280px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 h-full z-30 flex flex-col',
          'bg-gradient-to-b from-white via-white to-pink-50/30',
          'dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/50',
          'border-r border-pink-100/50 dark:border-slate-700/50',
          'shadow-xl shadow-pink-100/20 dark:shadow-slate-900/50',
          'hidden md:flex'
        )}
      >
        <DesktopSidebarContent 
          collapsed={collapsed}
          pathname={pathname}
          darkMode={darkMode}
          openMenus={openMenus}
          toggleSubmenu={toggleSubmenu}
          handleNavigation={handleNavigation}
          isMenuItemActive={isMenuItemActive}
        />
      </motion.div>
    </>
  );
}

// Mobile Sidebar Content Component
function MobileSidebarContent({
  pathname,
  darkMode,
  openMenus,
  toggleSubmenu,
  handleNavigation,
  isMenuItemActive,
  onClose
}: any) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-pink-100/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg relative">
            <span className={cn('text-white font-bold text-lg')}>
              <img src="https://mirrorsbeautylounge.ae/uploadfiles/Qp9iKFntNXTpnPoWG4v0YZVEmk7j8nqJsNIhmhBc.png?v=1.0.2" />
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-pink-600 dark:text-pink-400">
              Mirrors Beauty Lounge
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Premium Salon Experience
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-pink-100/50 dark:hover:bg-slate-700/50 transition-colors"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map(({ icon: Icon, label, href, subItems = [] }) => {
          const isActive = isMenuItemActive(href);
          const hasSubItems = subItems.length > 0;
          const isOpen = openMenus.includes(href);

          return (
            <div key={href}>
              <motion.div
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                  if (hasSubItems) {
                    toggleSubmenu(href);
                  } else {
                    handleNavigation(href);
                  }
                }}
                className={cn(
                  'flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative',
                  isActive
                    ? darkMode
                      ? 'bg-gradient-to-r from-[#E60076]/20 to-[#E60076]/10 text-[#E60076] shadow-lg shadow-[#E60076]/10'
                      : 'bg-gradient-to-r from-[#E60076]/15 to-[#E60076]/5 text-[#E60076] shadow-lg shadow-[#E60076]/10'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-[#E60076]/10 hover:to-[#E60076]/5'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-[#E60076]/8 hover:to-[#E60076]/3'
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-6 h-6 flex-shrink-0', isActive && 'drop-shadow-sm')} />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-[#E60076]/20 rounded-lg"
                      transition={{ type: "spring", duration: 0.6 }}
                    />
                  )}
                </div>
                
                <span className="font-semibold text-base flex-1">
                  {label}
                </span>

                {hasSubItems && (
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.div>
                )}
              </motion.div>

              {/* Submenu */}
              <AnimatePresence>
                {hasSubItems && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-8 mt-2 space-y-2 overflow-hidden"
                    >
                      {subItems.map((sub, i) => (
                        <motion.li
                          key={i}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => handleNavigation(sub.href)}
                          className={cn(
                            'px-4 py-3 text-sm rounded-xl cursor-pointer transition-all duration-200 border-2 flex items-center gap-3',
                            pathname === sub.href
                              ? darkMode
                                ? 'bg-[#E60076]/20 text-[#E60076] border-[#E60076]/30'
                                : 'bg-[#E60076]/10 text-[#E60076] border-[#E60076]/30'
                              : darkMode
                                ? 'text-slate-400 hover:text-white hover:bg-[#E60076]/10 border-transparent hover:border-[#E60076]/20'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-[#E60076]/5 border-transparent hover:border-[#E60076]/20'
                          )}
                        >
                          <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                          <span className="font-medium">{sub.label}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Desktop Sidebar Content Component
function DesktopSidebarContent({
  collapsed,
  pathname,
  darkMode,
  openMenus,
  toggleSubmenu,
  handleNavigation,
  isMenuItemActive
}: any) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-center h-20 px-4 border-b border-pink-100/50 dark:border-slate-700/50">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1, scale: collapsed ? 0.8 : 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center gap-3',
            collapsed && 'pointer-events-none'
          )}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg relative">
            <span className={cn('text-white font-bold text-lg', pacifico.className)}>
              M
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-pink-600 dark:text-pink-400 leading-tight">
              Mirrors Beauty
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lounge & Salon
            </p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {navItems.map(({ icon: Icon, label, href, subItems = [] }) => {
          const isActive = isMenuItemActive(href);
          const hasSubItems = subItems.length > 0;
          const isOpen = openMenus.includes(href);

          return (
            <div key={href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      if (hasSubItems) {
                        toggleSubmenu(href);
                      } else {
                        handleNavigation(href);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-200 group relative',
                      isActive
                        ? darkMode
                          ? 'bg-gradient-to-r from-[#E60076]/20 to-[#E60076]/10 text-[#E60076] shadow-lg shadow-[#E60076]/10'
                          : 'bg-gradient-to-r from-[#E60076]/15 to-[#E60076]/5 text-[#E60076] shadow-lg shadow-[#E60076]/10'
                        : darkMode
                          ? 'text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-[#E60076]/10 hover:to-[#E60076]/5'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-gradient-to-r hover:from-[#E60076]/8 hover:to-[#E60076]/3'
                    )}
                  >
                    <div className="relative">
                      <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'drop-shadow-sm')} />
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 bg-[#E60076]/20 rounded-lg"
                          transition={{ type: "spring", duration: 0.6 }}
                        />
                      )}
                    </div>
                    
                    <motion.span
                      animate={{ opacity: collapsed ? 0 : 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        'font-semibold text-sm flex-1',
                        collapsed && 'pointer-events-none'
                      )}
                    >
                      {label}
                    </motion.span>

                    {hasSubItems && !collapsed && (
                      <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className={cn(
                    'bg-slate-900 text-white border-0 px-3 py-2 text-sm',
                    collapsed ? '' : 'hidden'
                  )}
                >
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>

              {/* Submenu */}
              <AnimatePresence>
                {hasSubItems && isOpen && !collapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-8 mt-2 space-y-1 overflow-hidden"
                    >
                      {subItems.map((sub, i) => (
                        <motion.li
                          key={i}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.15 }}
                          onClick={() => handleNavigation(sub.href)}
                          className={cn(
                            'px-3 py-2 text-xs rounded-xl cursor-pointer transition-all duration-200 border flex items-center gap-2',
                            pathname === sub.href
                              ? darkMode
                                ? 'bg-[#E60076]/20 text-[#E60076] border-[#E60076]/30'
                                : 'bg-[#E60076]/10 text-[#E60076] border-[#E60076]/30'
                              : darkMode
                                ? 'text-slate-400 hover:text-white hover:bg-[#E60076]/10 border-transparent hover:border-[#E60076]/20'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-[#E60076]/5 border-transparent hover:border-[#E60076]/20'
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                          <span className="font-medium">{sub.label}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
}