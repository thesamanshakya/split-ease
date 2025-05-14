import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome section skeleton */}
      <div className="mb-8">
        <div className="h-10 w-64 bg-gray-200 rounded-md animate-pulse mb-2"></div>
        <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Groups and Activity section skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* My Groups skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse mr-2"></div>
            <div className="h-6 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="block bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="flex items-center">
                    <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse mr-2"></div>
                    <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="inline-flex items-center">
              <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse mr-1"></div>
              <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Recent Activity skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse mr-2"></div>
            <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="block p-4 rounded-xl bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="h-5 w-40 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                    <div className="flex items-center mt-1">
                      <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                      <span className="mx-1.5 text-gray-400">•</span>
                      <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                    <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse mt-1"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
                    <div className="h-3 w-12 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Analytics skeleton */}
      <section className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="md:flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse mr-2"></div>
            <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-80 bg-gray-100 rounded-lg animate-pulse"></div>
      </section>

      {/* Payment Summary skeleton */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center mb-4">
          <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse mr-2"></div>
          <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                <div className="h-6 w-36 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            </div>
          </div>
        </div>

        <div>
          <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                  <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions skeleton */}
      <div className="bg-indigo-50 p-6 rounded-lg">
        <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-2"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow-sm flex items-center">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse mr-4"></div>
            <div>
              <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-4 w-48 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
