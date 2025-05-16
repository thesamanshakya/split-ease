import React from "react";

export default function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header skeleton */}
      <div className="h-9 w-48 bg-gray-200 rounded-md animate-pulse mb-8"></div>

      {/* Profile info skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Avatar skeleton */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="h-32 w-32 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-gray-300 animate-pulse"></div>
            </div>
          </div>

          {/* Form skeleton */}
          <div className="flex-1">
            <div className="mb-4">
              <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            <div className="mb-6">
              <div className="h-5 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
              <div className="h-10 w-full bg-gray-200 rounded-md animate-pulse"></div>
            </div>

            <div className="h-10 w-36 bg-indigo-200 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* QR Code section skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="h-7 w-40 bg-gray-200 rounded-md animate-pulse mb-4"></div>
        <div className="flex flex-col items-center mb-4">
          <div className="relative mb-4">
            <div className="h-48 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-gray-300 animate-pulse"></div>
          </div>
          <div className="h-4 w-64 bg-gray-200 rounded-md animate-pulse mt-4"></div>
          <div className="h-4 w-80 bg-gray-200 rounded-md animate-pulse mt-2"></div>
        </div>
      </div>

      {/* Account info section skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-7 w-48 bg-gray-200 rounded-md animate-pulse mb-4"></div>
        <div className="space-y-4">
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
            <div className="h-5 w-64 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded-md animate-pulse mb-1"></div>
            <div className="h-5 w-48 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
