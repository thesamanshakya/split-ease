import React from "react";

export default function GroupSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Group header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-y-6 md:gap-6 mb-6">
        {/* Recent Expenses skeleton */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-3">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse mb-1"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balances skeleton */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 col-span-2">
          <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="py-3 px-4 rounded-xl bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                    <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                  <div className="text-right ml-2">
                    <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
                    <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <div className="h-12 w-full bg-green-200 rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Group Members skeleton */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-9 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                <div>
                  <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse mb-1"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
              <div className="flex space-x-2">
                <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
