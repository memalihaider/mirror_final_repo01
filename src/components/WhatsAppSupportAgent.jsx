'use client';

import { useState, useRef, useEffect } from 'react';

const FAQ_QUESTIONS = [
  {
    question: "How to add a new service?",
    answer: "Go to Services page → Click 'Add Service' → Fill in service details → Save. You can set price, duration, and assign to categories."
  },
  {
    question: "How to manage bookings?",
    answer: "Use the Bookings page to view, edit, and manage appointments. You can filter by date, staff, or status."
  },
  {
    question: "How to create special offers?",
    answer: "Navigate to Offers page → Create New Offer → Set discount, validity period → Apply to specific services or categories."
  },
  {
    question: "How to add staff members?",
    answer: "Go to Staff section → Add New Staff → Enter details and assign roles → Set working hours and branches."
  },
  {
    question: "How to view business reports?",
    answer: "Check Analytics section for revenue reports, popular services, and customer insights. Reports update in real-time."
  },
  {
    question: "How to manage branches?",
    answer: "In Branches section, you can add new locations, set operating hours, and manage branch-specific services."
  }
];

export default function FAQAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [isPulsing, setIsPulsing] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Stop pulsing when opened
  useEffect(() => {
    if (isOpen) {
      setIsPulsing(false);
    }
  }, [isOpen]);

  const handleQuestionClick = (faq, index) => {
    setSelectedQuestion(index);
    
    // Add user question to chat
    setChatMessages(prev => [...prev, { type: 'user', text: faq.question }]);
    
    // Add bot response after delay
    setTimeout(() => {
      setChatMessages(prev => [...prev, { type: 'bot', text: faq.answer }]);
    }, 1000);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const startNewChat = () => {
    setChatMessages([]);
    setSelectedQuestion(null);
  };

  return (
    <>
      {/* Floating Support Buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {/* FAQ Agent Panel */}
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 sm:w-96 h-96 mb-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">FAQ Assistant</h3>
                    <p className="text-xs opacity-90">Instant Help & Guidance</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Chat Container */}
            <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto h-48 bg-gray-50">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm py-8">
                  <div className="text-2xl mb-2">🤖</div>
                  <p>Hello! How can I help you today?</p>
                  <p className="text-xs mt-1">Choose a question below to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAQ Questions */}
            <div className="border-t border-gray-200 p-4 bg-white max-h-32 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-600 mb-2">FREQUENTLY ASKED QUESTIONS:</p>
              <div className="space-y-2">
                {FAQ_QUESTIONS.map((faq, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(faq, index)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      selectedQuestion === index
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-between">
              <button
                onClick={startNewChat}
                className="text-xs text-gray-600 hover:text-gray-800 px-3 py-1 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors"
              >
                New Chat
              </button>
              <div className="text-xs text-gray-500 font-medium flex items-center">
                FAQ Assistant
              </div>
            </div>
          </div>
        )}

        {/* FAQ Agent Button (Main Button) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-3xl flex items-center justify-center group"
        >
          {/* Pulsing effect */}
          {isPulsing && (
            <div className="absolute inset-0 rounded-2xl bg-blue-400 animate-ping opacity-20"></div>
          )}
          
          {/* Main icon container */}
          <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
            {/* FAQ Agent Icon */}
            <div className="relative">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              {/* Notification dot */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
            <div className="bg-gray-900 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
              FAQ Assistant
              <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </button>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white p-3 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-3xl flex items-center justify-center group"
          >
            <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
              <div className="bg-gray-900 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap">
                Back to Top
                <div className="absolute top-full right-2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </button>
        )}
      </div>
    </>
  );
}