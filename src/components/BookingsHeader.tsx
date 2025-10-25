import { Calendar, Plus } from "lucide-react";
import { memo } from "react";

interface BookingsHeaderProps {
  onAddBooking: () => void;
}

export const BookingsHeader = memo(function BookingsHeader({ onAddBooking }: BookingsHeaderProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 animate-gradient-x">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative px-8 py-12">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 animate-float">
                <Calendar className="w-8 h-8 text-white animate-pulse-slow" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 animate-fade-in">
                  Bookings Management
                </h1>
                <div className="h-1 w-32 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-slide-up"></div>
              </div>
            </div>
            <p className="text-white/90 text-lg max-w-2xl leading-relaxed animate-fade-in-delay">
              Streamline your appointment scheduling with our comprehensive booking management system.
              Track, organize, and optimize all customer appointments effortlessly.
            </p>
            <div className="flex items-center gap-4 text-white/80 text-sm animate-slide-down">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Multi-branch Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Smart Scheduling</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 animate-float-delay">
            <button
              onClick={onAddBooking}
              className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-bounce-gentle"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span>Add Schedule</span>
              </div>
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full animate-float"></div>
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full animate-float-delay"></div>
      <div className="absolute top-1/2 right-1/4 w-12 h-12 bg-white/5 rounded-full animate-bounce-subtle"></div>
    </div>
  );
});