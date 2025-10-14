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
} from 'lucide-react';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useState, useEffect, useRef, useCallback } from 'react';

// Navigation items
const navItems: {
  icon: any;
  label: string;
  href: string;
  roles: string[];
  subItems?: { label: string; href: string; description?: string; icon?: any }[];
}[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "user"] },

  // ✅ Invoice Management
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
    label: "Products",
    href: "/products",
    roles: ["admin", "user"],
    subItems: [
      { label: "Categories", href: "/catagories" },
      { label: "Services", href: "/services" },
      { label: "Offers & Promotions", href: "/offers" },
    ],
  },

  { icon: Calendar, label: "Appointments", href: "/bookings", roles: ["admin"], subItems: [] },
  { icon: ShoppingCart, label: "E-commerce", href: "/ecommerce", roles: ["admin", "user"], subItems: [] },
  { icon: TrendingUp, label: "Analytics", href: "/sales", roles: ["admin", "user"], subItems: [] },
  { icon: MessageCircle, label: "Support", href: "/chat", roles: ["admin"], subItems: [] },
  { icon: Building2, label: "Branches", href: "/branches", roles: ["admin", "user"], subItems: [] },
  { icon: CreditCard, label: "Membership", href: "/membership", roles: ["admin", "user"], subItems: [] },
  { icon: FileText, label: "Reports", href: "/membershipReport", roles: ["admin", "user"], subItems: [] },
  { icon: FileText, label: "Feedback", href: "/feedback", roles: ["admin", "user"], subItems: [] },
  { icon: UserCheck, label: "Staff", href: "/staff", roles: ["admin", "user"], subItems: [] },
  { icon: UserCheck, label: "Booking Approval", href: "/bookingstatus", roles: ["admin", "user"], subItems: [] },
  { icon: ClipboardList, label: "Tasks", href: "/staffDailyTasks", roles: ["admin", "user"], subItems: [] },
  { icon: BarChart3, label: "Business", href: "/reports", roles: ["admin", "user"], subItems: [] },
  { icon: UserCircle, label: "Customers", href: "/customers", roles: ["admin", "user"], subItems: [] },
  { icon: Users, label: "Users", href: "/users", roles: ["admin"], subItems: [] },
  { icon: Settings, label: "Settings", href: "/profile", roles: ["admin", "user"], subItems: [] },
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

  // ✅ Optimized mobile detection with debounce
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 768);
      }, 100);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timeoutId);
    };
  }, []);

  // ✅ Optimized theme detection
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

  // ✅ Optimized click outside handler
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

  // ✅ Memoized navigation handlers
  const isMenuItemActive = useCallback((href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  }, [pathname]);

  const toggleSubmenu = useCallback((href: string) => {
    setOpenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  }, []);

  const handleNavigation = useCallback((href: string) => {
    router.push(href);
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [router, isMobile]);

  const handleToggle = useCallback(() => {
    onToggle();
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    }
  }, [onToggle, isMobile, mobileOpen]);

  // ✅ Skip rendering on signin page
  if (pathname === "/signin") {
    return null;
  }

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
            "transition-all duration-200 hover:scale-105 active:scale-95",
            "md:hidden"
          )}
          aria-label="Toggle menu"
        >
          <motion.div
            animate={{ rotate: mobileOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
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
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                'fixed left-0 top-0 h-full z-50 flex flex-col w-64',
                'bg-white/95 backdrop-blur-lg dark:bg-slate-900/95',
                'border-r border-gray-200/50 dark:border-slate-700/50',
                'shadow-xl shadow-gray-200/20 dark:shadow-slate-900/50',
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
          "fixed top-4 z-40 p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95",
          "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg",
          "border border-pink-400/20 backdrop-blur-sm",
          collapsed ? "left-4" : "left-64",
          "hidden md:flex items-center justify-center"
        )}
        aria-label="Toggle sidebar"
      >
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
      </button>

      {/* Desktop Sidebar */}
      <motion.div
        ref={sidebarRef}
        initial={false}
        animate={{
          width: collapsed ? '72px' : '240px',
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'fixed left-0 top-0 h-full z-30 flex flex-col',
          'bg-white/95 backdrop-blur-lg dark:bg-slate-900/95',
          'border-r border-gray-200/50 dark:border-slate-700/50',
          'shadow-xl shadow-gray-200/20 dark:shadow-slate-900/50',
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
const MobileSidebarContent = React.memo(({
  pathname,
  darkMode,
  openMenus,
  toggleSubmenu,
  handleNavigation,
  isMenuItemActive,
  onClose
}: any) => {
  return (
    <>
      {/* Compact Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mirrors
          </h1>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ icon: Icon, label, href, subItems = [] }) => {
          const isActive = isMenuItemActive(href);
          const hasSubItems = subItems.length > 0;
          const isOpen = openMenus.includes(href);

          return (
            <div key={href}>
              <motion.div
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.1 }}
                onClick={() => {
                  if (hasSubItems) {
                    toggleSubmenu(href);
                  } else {
                    handleNavigation(href);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group',
                  isActive
                    ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-white')} />
                
                <span className="font-medium text-sm flex-1">
                  {label}
                </span>

                {hasSubItems && (
                  <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronRight className="w-4 h-4" />
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
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-slate-700 pl-3">
                      {subItems.map((sub, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.1, delay: i * 0.05 }}
                          onClick={() => handleNavigation(sub.href)}
                          className={cn(
                            'px-3 py-2 text-sm rounded-lg cursor-pointer transition-all duration-150 flex items-center gap-2',
                            pathname === sub.href
                              ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                          <span className="font-medium">{sub.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
});

// Desktop Sidebar Content Component
const DesktopSidebarContent = React.memo(({
  collapsed,
  pathname,
  darkMode,
  openMenus,
  toggleSubmenu,
  handleNavigation,
  isMenuItemActive
}: any) => {
  return (
    <>
      {/* Compact Header */}
      <div className="flex items-center justify-center h-16 px-3 border-b border-gray-200/50 dark:border-slate-700/50">
        <motion.div
          animate={{ opacity: collapsed ? 0 : 1, scale: collapsed ? 0.8 : 1 }}
          transition={{ duration: 0.15 }}
          className={cn(
            'flex items-center gap-2',
            collapsed && 'pointer-events-none'
          )}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          {!collapsed && (
            <h1 className="text-base font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              Mirrors Beauty
            </h1>
          )}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ icon: Icon, label, href, subItems = [] }) => {
          const isActive = isMenuItemActive(href);
          const hasSubItems = subItems.length > 0;
          const isOpen = openMenus.includes(href);

          return (
            <div key={href}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.1 }}
                    onClick={() => {
                      if (hasSubItems) {
                        toggleSubmenu(href);
                      } else {
                        handleNavigation(href);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2.5 rounded-xl cursor-pointer transition-all duration-150 group',
                      isActive
                        ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', isActive && 'text-white')} />
                    
                    <motion.span
                      animate={{ opacity: collapsed ? 0 : 1 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'font-medium text-sm flex-1 whitespace-nowrap',
                        collapsed && 'pointer-events-none'
                      )}
                    >
                      {label}
                    </motion.span>

                    {hasSubItems && !collapsed && (
                      <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </motion.div>
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className={cn(
                    'bg-gray-900 text-white border-0 px-2 py-1 text-xs',
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
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-6 mt-1 space-y-1 border-l border-gray-200 dark:border-slate-700 pl-3">
                      {subItems.map((sub, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.1, delay: i * 0.03 }}
                          onClick={() => handleNavigation(sub.href)}
                          className={cn(
                            'px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-all duration-150 flex items-center gap-2',
                            pathname === sub.href
                              ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                          )}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                          <span className="font-medium whitespace-nowrap">{sub.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </>
  );
});

// Add React.memo import at the top
import React from 'react';