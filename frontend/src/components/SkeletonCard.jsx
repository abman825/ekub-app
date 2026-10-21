import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex flex-col justify-between animate-pulse">
      <div>
        {/* Header Skeleton */}
        <div className="flex justify-between items-start mb-3">
          <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>

        {/* Details Skeleton */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          </div>
        </div>
      </div>

      {/* Buttons Skeleton */}
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex gap-2">
          <div className="h-10 bg-gray-200 rounded-lg w-1/2"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-1/2"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;