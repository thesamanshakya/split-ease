import React from "react";

export default function ExpensesPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-2"></div>
          <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Main content skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
            <div className="w-full sm:w-auto">
              <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Expense list skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                  <div className="flex items-center mt-1">
                    <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse mr-3"></div>
                    <div className="flex items-center">
                      <div className="h-5 w-5 rounded-full bg-gray-200 animate-pulse mr-1"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse mb-2"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded-md animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom action button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="h-12 w-full bg-indigo-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
