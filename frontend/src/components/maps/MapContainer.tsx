'use client';

import React from 'react';

interface MapContainerProps {
  title?: string;
  /** When a real map library is wired up, pass it as children. Until then, shows a skeleton. */
  children?: React.ReactNode;
}

export default function MapContainer({ title = 'Location Map', children }: MapContainerProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>

      {children ? (
        children
      ) : (
        // ---- Skeleton placeholder (no geospatial data wired up yet) ----
        <div className="h-80 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm">Map will render here once location data is available</p>
        </div>
      )}
    </div>
  );
}