import React from "react";

export default function GroupsPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse mb-2"></div>
          <div className="h-5 w-64 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
        <div className="h-10 w-40 bg-indigo-200 rounded-md animate-pulse"></div>
      </div>

      {/* Groups grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="h-7 w-48 bg-gray-200 rounded-md animate-pulse mb-4"></div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse mr-2"></div>
                <div className="h-5 w-24 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
              <div className="flex items-center">
                <div className="h-5 w-5 bg-gray-200 rounded-md animate-pulse mr-2"></div>
                <div className="h-5 w-40 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <div className="h-5 w-28 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
