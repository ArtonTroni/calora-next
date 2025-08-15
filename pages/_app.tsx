import type { AppProps } from 'next/app';
import Link from 'next/link';

import '../public/styles.css';

function Navigation() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold hover:text-blue-200 transition">
              Calora App
            </Link>
          </div>

          {/* Navigation Links - ohne isActive (hydration fehler) */}
          <div className="flex items-baseline space-x-4">
            <Link
              href="/maintain"
              className="text-blue-100 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              ⚙️ Maintain
            </Link>
            
            <Link
              href="/impressum"
              className="text-blue-100 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              📄 Impressum
            </Link>
            
            <Link
              href="/privacy"
              className="text-blue-100 hover:bg-blue-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition"
            >
              🔒 Privacy
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main>
        <Component {...pageProps} />
      </main>
    </div>
  );
}