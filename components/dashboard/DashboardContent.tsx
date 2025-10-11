"use client";

import { useAuth } from "@/lib/auth/hooks";
import { signOut } from "@/lib/auth/utils";
import { useRouter } from "next/navigation";

export default function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Splitsy Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.user_metadata?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎉 Welcome to Splitsy!
              </h2>
              <p className="text-gray-600 mb-6">
                Your authentication is working perfectly. You&apos;re now logged in and ready to start using Splitsy.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h3 className="text-lg font-medium text-blue-900 mb-2">What&apos;s Next?</h3>
                <ul className="text-blue-800 text-left space-y-1">
                  <li>✅ Authentication system complete</li>
                  <li>⏳ Group management (coming next)</li>
                  <li>⏳ Pool creation and management</li>
                  <li>⏳ Virtual card creation</li>
                  <li>⏳ Payment processing</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Groups</h3>
                  <p className="text-gray-600 text-sm">Create and manage payment groups with your friends.</p>
                  <div className="mt-4">
                    <span className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">
                      Coming Soon
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pools</h3>
                  <p className="text-gray-600 text-sm">Pool money together for shared expenses and goals.</p>
                  <div className="mt-4">
                    <span className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">
                      Coming Soon
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cards</h3>
                  <p className="text-gray-600 text-sm">Create shared virtual cards with Apple Pay support.</p>
                  <div className="mt-4">
                    <span className="inline-block bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-xs">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
