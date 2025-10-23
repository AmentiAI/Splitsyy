import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4 z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
              Splitsy
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 font-light drop-shadow-md">
              The modern way to share expenses
            </p>
          </div>

          {/* Value Proposition */}
          <p className="text-xl text-white/95 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
            Stop chasing friends for money. Pool funds together, create shared
            virtual cards, and let everyone contribute upfront. Perfect for
            trips, roommates, and group events.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up">
            <Link href="/auth/register">
              <button 
                className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white text-gray-900 hover:bg-gray-100 border-2 border-white shadow-lg hover:shadow-xl px-8 py-4 text-lg w-full sm:w-auto transform hover:scale-105 min-h-[48px]"
              >
                Get Started Free
              </button>
            </Link>
            <Link href="/auth/login">
              <button 
                className="inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 shadow-lg hover:shadow-xl px-8 py-4 text-lg w-full sm:w-auto transform hover:scale-105 min-h-[48px]"
              >
                Sign In
              </button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Pool Upfront</h3>
              <p className="text-white/90">
                Everyone contributes before spending. No more IOUs or awkward
                collections.
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold mb-2">Shared Cards</h3>
              <p className="text-white/90">
                Create virtual cards from pooled funds. Anyone in the group can
                use them.
              </p>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 text-white border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-2">Full Transparency</h3>
              <p className="text-white/90">
                Real-time transaction tracking. Everyone sees exactly what was
                purchased.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-white/80 text-sm">
            <p>Built with ❤️ by Amenti AI • Secure • PCI Compliant • Bank-Level Encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}
