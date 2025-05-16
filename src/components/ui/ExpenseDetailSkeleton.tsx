import React from "react";

export default function ExpenseDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Main content skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-6">
        <div className="mb-6">
          <div className="h-7 w-64 bg-gray-200 rounded-md animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse mr-2"></div>
                <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Split details skeleton */}
        <div className="border-t border-gray-100 pt-6">
          <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-gray-50 flex justify-between items-center"
              >
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                  <div>
                    <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse mb-1"></div>
                    {i === 1 && (
                      <div className="h-3 w-36 bg-gray-200 rounded-md animate-pulse"></div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse mb-1"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
