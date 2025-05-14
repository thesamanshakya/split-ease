import React from "react";

export default function SettleSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Current Balances section */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
        <div className="h-6 w-64 bg-gray-200 rounded-md animate-pulse mb-4"></div>

        <div className="space-y-2 mb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="py-3 px-4 rounded-xl bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                  <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
                <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Payments section */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
        <div className="h-6 w-72 bg-gray-200 rounded-md animate-pulse mb-4"></div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="flex flex-col">
                    <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="h-6 w-20 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
