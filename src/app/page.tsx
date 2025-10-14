'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { 
  Category,
  Service,
  Branch,
  Offer,
  subscribeToCategoriesChanges,
  subscribeToServicesChanges,
  subscribeToBranchesChanges,
  subscribeToOffersChanges
} from '@/lib/firebaseServicesNoStorage';

export default function Dashboard() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time updates
  useEffect(() => {
    let loadedCount = 0;
    const totalCollections = 4;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalCollections) setLoading(false);
    };

    const unsubscribeCategories = subscribeToCategoriesChanges(
      (updatedCategories) => { setCategories(updatedCategories); checkAllLoaded(); }
    );

    const unsubscribeServices = subscribeToServicesChanges(
      (updatedServices) => { setServices(updatedServices); checkAllLoaded(); }
    );

    const unsubscribeBranches = subscribeToBranchesChanges(
      (updatedBranches) => { setBranches(updatedBranches); checkAllLoaded(); }
    );

    const unsubscribeOffers = subscribeToOffersChanges(
      (updatedOffers) => { setOffers(updatedOffers); checkAllLoaded(); }
    );

    return () => {
      unsubscribeCategories();
      unsubscribeServices();
      unsubscribeBranches();
      unsubscribeOffers();
    };
  }, []);

  // Stats calculations (real-time)
  const menServices = services.filter(service => service.category.toLowerCase().includes('men'));
  const womenServices = services.filter(service => service.category.toLowerCase().includes('women'));
  const activeServices = services.filter(service => service.isActive);
  const activeOffers = offers.filter(offer => offer.isActive && new Date(offer.validTo) >= new Date());
  const totalRevenue = services.reduce((sum, service) => sum + (service.price || 0), 0);

  const stats = [
    { 
      name: 'Total Services', 
      value: services.length.toString(), 
      change: `${activeServices.length} active`, 
      color: 'from-pink-500 to-rose-500',
      icon: '✂️',
      bgIcon: '🎯'
    },
    { 
      name: 'Categories', 
      value: categories.length.toString(), 
      change: `${categories.filter(cat => cat.serviceCount > 0).length} with services`, 
      color: 'from-blue-500 to-cyan-500',
      icon: '📂',
      bgIcon: '📊'
    },
    { 
      name: 'Active Offers', 
      value: offers.length.toString(), 
      change: `AED ${totalRevenue.toFixed(0)} total value`, 
      color: 'from-purple-500 to-indigo-500',
      icon: '🏷️',
      bgIcon: '💎'
    },
    { 
      name: 'Branches', 
      value: branches.length.toString(), 
      change: `${branches.filter(b => b.isActive).length} active locations`, 
      color: 'from-green-500 to-emerald-500',
      icon: '🏢',
      bgIcon: '🌟'
    }
  ];

  // Recent activity
  const recentActivity = [
    ...services.slice(0, 2).map(service => ({ 
      action: 'Service added', 
      item: service.name, 
      time: service.createdAt ? getTimeAgo(service.createdAt.toDate()) : 'Recently', 
      type: 'service',
      icon: '✂️',
      color: 'text-pink-600 bg-pink-50'
    })),
    ...categories.slice(0, 2).map(category => ({ 
      action: 'Category added', 
      item: category.name, 
      time: category.createdAt ? getTimeAgo(category.createdAt.toDate()) : 'Recently', 
      type: 'category',
      icon: '📂',
      color: 'text-blue-600 bg-blue-50'
    })),
    ...branches.slice(0, 1).map(branch => ({ 
      action: 'Branch added', 
      item: branch.name, 
      time: branch.createdAt ? getTimeAgo(branch.createdAt.toDate()) : 'Recently', 
      type: 'branch',
      icon: '🏢',
      color: 'text-green-600 bg-green-50'
    }))
  ].slice(0, 5);

  const quickActions = [
    { 
      name: 'Add Service', 
      href: '/services', 
      icon: '✂️', 
      color: 'from-pink-500 to-rose-500',
      description: 'Create new beauty service'
    },
    { 
      name: 'Add Category', 
      href: '/catagories', 
      icon: '📂', 
      color: 'from-blue-500 to-cyan-500',
      description: 'Organize your services'
    },
    { 
      name: 'Create Offer', 
      href: '/offers', 
      icon: '🏷️', 
      color: 'from-purple-500 to-indigo-500',
      description: 'Special promotions'
    },
  ];

  function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  }

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Header - Removed gradient overlay issues */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                {getCurrentGreeting()}! 👋
              </h1>
              <p className="text-base sm:text-lg text-white/90 font-medium">
                Welcome to Mirror Beauty Lounge Dashboard
              </p>
              <p className="text-xs sm:text-sm text-white/70 mt-1">
                Manage your beauty services, track performance, and grow your business
              </p>
            </div>
            <div className="hidden md:block">
              <div className="text-4xl lg:text-6xl opacity-20">💄</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(loading ? Array.from({ length: 4 }) : stats).map((stat, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              {loading ? (
                <div className="p-4 sm:p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 text-4xl opacity-5">
                    {stat.bgIcon}
                  </div>
                  
                  <div className="relative p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center text-white text-lg sm:text-xl shadow-sm`}>
                        {stat.icon}
                      </div>
                      <div className={`px-2 py-1 rounded-full bg-gradient-to-r ${stat.color} text-white text-xs font-semibold opacity-90`}>
                        Live
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        {stat.name}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                        {stat.value}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        {stat.change}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm sm:text-base mr-2 sm:mr-3">
              ⚡
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Quick Actions</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group relative overflow-hidden rounded-lg sm:rounded-xl p-4 sm:p-6 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative">
                  <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center text-white text-base sm:text-xl mb-3 sm:mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    {action.icon}
                  </div>
                  
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-1 sm:mb-2">
                    {action.name}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-gray-600">
                    {action.description}
                  </p>
                  
                  <div className="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm font-semibold text-gray-400 group-hover:text-gray-600">
                    Get started
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm sm:text-base mr-2 sm:mr-3">
                📈
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Activity</h2>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 font-medium">
              Last 24 hours
            </div>
          </div>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="animate-pulse rounded-lg p-3 sm:p-4 bg-gray-50"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : recentActivity.length > 0 ? (
              recentActivity.map((activity, idx) => (
                <div
                  key={idx}
                  className="group rounded-lg sm:rounded-xl p-3 sm:p-4 bg-gray-50 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${activity.color} flex items-center justify-center text-base sm:text-lg font-semibold`}>
                        {activity.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">
                          {activity.action}: <span className="text-gray-700">{activity.item}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 opacity-20">📊</div>
                <p className="text-gray-500 font-medium text-sm sm:text-base">No recent activity</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">Activity will appear here as you use the system</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}