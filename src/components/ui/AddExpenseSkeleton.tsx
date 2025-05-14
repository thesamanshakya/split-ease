import React from "react";

export default function AddExpenseSkeleton() {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse"></div>
      </div>

      {/* Form skeleton */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
        <div className="space-y-6">
          {/* Description field */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse mb-2"></div>
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Amount field */}
          <div>
            <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse mb-2"></div>
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Date field */}
          <div>
            <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse mb-2"></div>
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Paid by field */}
          <div>
            <div className="h-5 w-20 bg-gray-200 rounded-md animate-pulse mb-2"></div>
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Split type field */}
          <div>
            <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse mb-2"></div>
            <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Split details */}
          <div className="border-t border-gray-200 pt-4">
            <div className="h-6 w-40 bg-gray-200 rounded-md animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse mb-4"></div>

            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                    <div className="h-5 w-32 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse"></div>
                    <div className="h-7 w-7 bg-gray-200 rounded-md animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto flex gap-3">
          <div className="w-1/3 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="w-2/3 h-12 bg-indigo-200 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
