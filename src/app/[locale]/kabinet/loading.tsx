import React from "react";

export default function LoadingKabinet() {
  return (
    <div className="relative flex flex-col min-h-screen bg-background font-sans overflow-x-hidden w-full">
      {/* Navbar space filler */}
      <div className="h-16 w-full"></div>
      
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      
      <main className="w-full relative z-10 pb-20 animate-pulse">
        
        {/* Hero Section */}
        <div className="w-full flex items-center justify-center px-4 md:px-0 pt-10 md:pt-16 lg:pt-20">
          <div className="w-full max-w-7xl relative mx-auto bg-surface border border-outline-variant/30 rounded-3xl md:rounded-[40px] shadow-sm overflow-hidden flex flex-col md:flex-row items-center p-8 md:p-12 lg:p-16 min-h-[500px]">
            {/* Dekorasi BG Internal */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl"></div>

            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left z-10 space-y-6">
              <div className="w-32 h-8 bg-surface-variant/80 rounded-full"></div>
              <div className="w-[90%] h-14 md:h-20 bg-surface-variant/80 rounded-2xl"></div>
              <div className="w-full h-24 bg-surface-variant/60 rounded-xl"></div>
              <div className="flex gap-4 mt-4">
                <div className="w-10 h-10 bg-surface-variant/60 rounded-full"></div>
                <div className="w-10 h-10 bg-surface-variant/60 rounded-full"></div>
                <div className="w-10 h-10 bg-surface-variant/60 rounded-full"></div>
              </div>
            </div>

            <div className="w-full md:w-1/2 relative z-10 flex justify-center mt-12 md:mt-0">
              <div className="w-64 h-64 md:w-80 md:h-80 bg-surface-variant/60 rounded-full border-[6px] border-surface shadow-xl"></div>
            </div>
          </div>
        </div>

        {/* Search Input Skeleton */}
        <div className="max-w-2xl mx-auto px-4 mt-12 mb-16">
          <div className="w-full h-14 bg-surface border border-outline-variant/30 rounded-full shadow-sm"></div>
        </div>
        
        {/* Ministry Section Skeleton */}
        <div className="px-container-padding-mobile md:px-container-padding-desktop max-w-7xl mx-auto w-full mt-10 space-y-24">
          
          {[1, 2, 3].map((section) => (
            <div key={section} className="flex flex-col items-center">
              {/* Ministry Title */}
              <div className="text-center mb-10 space-y-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-surface-variant/80 rounded-2xl mb-2"></div>
                <div className="w-64 h-10 bg-surface-variant/80 rounded-xl"></div>
                <div className="w-48 h-5 bg-surface-variant/60 rounded-md"></div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl mx-auto">
                {[1, 2, 3].map((member) => (
                  <div key={member} className="bg-surface border border-outline-variant/30 rounded-[32px] p-6 shadow-sm flex flex-col items-center relative overflow-hidden">
                    <div className="w-32 h-32 bg-surface-variant/80 rounded-full border-4 border-surface shadow-inner z-10 relative"></div>
                    <div className="w-full text-center mt-6 z-10 flex flex-col items-center space-y-3">
                      <div className="w-40 h-6 bg-surface-variant/80 rounded-md"></div>
                      <div className="w-24 h-4 bg-primary/30 rounded-md"></div>
                      <div className="w-full h-[1px] bg-outline-variant/20 my-2"></div>
                      <div className="flex gap-3 justify-center">
                        <div className="w-8 h-8 bg-surface-variant/60 rounded-full"></div>
                        <div className="w-8 h-8 bg-surface-variant/60 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>

      </main>
    </div>
  );
}
