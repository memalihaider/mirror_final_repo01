import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import WhatsAppSupportAgent from '@/components/WhatsAppSupportAgent';
import AppFooter from '@/components/AppFooter';

// Optimized font loading
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevents FOIT (Flash of Invisible Text)
  preload: true, // Preloads font for faster loading
  adjustFontFallback: false, // Better performance
  fallback: ['system-ui', 'arial'] // Better fallback
});

// Preload critical resources
export const preload = true;

export const metadata: Metadata = {
  title: 'Mirror Beauty Lounge - Admin Dashboard',
  description: 'Admin dashboard for Mirror Beauty Lounge management system',
  // Additional optimizations
  metadataBase: new URL('https://yourdomain.com'), // Replace with your domain
  keywords: ['beauty salon', 'management', 'dashboard', 'appointments'],
  authors: [{ name: 'Mirror Beauty Lounge' }],
  robots: {
    index: false,
    follow: false, // Admin dashboard shouldn't be indexed
  },
  // Open Graph optimizations
  openGraph: {
    type: 'website',
    siteName: 'Mirror Beauty Lounge',
  },
};

// Generate static params for better caching
export function generateStaticParams() {
  return [];
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        
        {/* Preload essential domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Optimize viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes"
        />
        
        {/* Prevent translation for better performance */}
        <meta name="google" content="notranslate" />
        
        {/* Disable phone number detection */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body 
        className={`${inter.className} antialiased h-full bg-white`}
        suppressHydrationWarning
      >
        {/* ClientLayout wraps everything except footer */}
        <ClientLayout>
          {children}
          {/* <WhatsAppSupportAgent /> */}
        </ClientLayout>
        
        {/* Footer outside ClientLayout as per original structure */}
        <AppFooter />
        
        {/* Performance optimization script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              if (typeof window !== 'undefined') {
                // Track largest contentful paint
                const observer = new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  const lastEntry = entries[entries.length - 1];
                  console.log('LCP:', lastEntry.startTime, 'ms');
                });
                observer.observe({entryTypes: ['largest-contentful-paint']});
                
                // Track layout shifts
                const layoutShiftObserver = new PerformanceObserver((list) => {
                  console.log('CLS:', list.getEntries());
                });
                layoutShiftObserver.observe({entryTypes: ['layout-shift']});
                
                // Prefetch likely navigation targets
                setTimeout(() => {
                  const paths = ['/services', '/bookings', '/staff', '/analytics'];
                  paths.forEach(path => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = path;
                    link.as = 'document';
                    document.head.appendChild(link);
                  });
                }, 3000);
                
                // Optimize scrolling performance
                if ('scrollBehavior' in document.documentElement.style) {
                  // Native smooth scrolling supported
                } else {
                  // Load polyfill only if needed
                  import('smoothscroll-polyfill').then(module => {
                    module.polyfill();
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}