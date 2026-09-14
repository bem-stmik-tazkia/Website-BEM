import React from "react";

export default function LoadingApply() {
  return (
    <div className="bg-[#f8f9fc] min-h-screen pt-32 pb-20 font-sans animate-pulse">
      <div className="max-w-3xl mx-auto px-4 sm:px-5">
        
        {/* Back button */}
        <div className="mb-6 w-24 h-5 bg-surface-variant/80 rounded-md"></div>

        <div className="bg-surface rounded-2xl md:rounded-3xl border border-outline-variant/30 shadow-lg overflow-hidden">
          {/* HEADER */}
          <div className="bg-primary p-6 md:p-8">
            <div className="w-24 h-6 bg-white/20 rounded-full mb-4"></div>
            <div className="w-3/4 h-8 md:h-10 bg-white/30 rounded-xl mb-3"></div>
            <div className="w-1/2 h-5 bg-white/20 rounded-md"></div>
          </div>

          {/* BODY */}
          <div className="p-6 md:p-8 space-y-6">
            
            {/* Form Fields Skeletons */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 -mx-4 rounded-2xl">
                <div className="flex gap-2 items-center mb-2">
                  <div className="w-4 h-4 bg-surface-variant/80 rounded-md shrink-0"></div>
                  <div className="w-32 h-5 bg-surface-variant/80 rounded-md"></div>
                  <div className="w-12 h-4 bg-surface-variant/50 rounded-md"></div>
                </div>
                
                {/* Randomly vary field size */}
                <div className={`w-full bg-surface-variant/30 rounded-xl ${i % 3 === 0 ? 'h-32' : 'h-12'}`}></div>
              </div>
            ))}

            {/* Submit Button */}
            <div className="pt-6 border-t border-outline-variant/20 flex justify-end">
              <div className="w-32 h-12 bg-surface-variant/80 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
