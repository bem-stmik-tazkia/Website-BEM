"use client";

import { useEffect, useRef, useState } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

interface UseTourOptions {
  tourId: string;
  steps: DriveStep[];
  autoStart?: boolean;
}

export function useTour({ tourId, steps, autoStart = true }: UseTourOptions) {
  const driverObj = useRef<ReturnType<typeof driver> | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    driverObj.current = driver({
      overlayColor: 'rgba(15, 23, 42, 0.85)',
      showProgress: true,
      animate: true,
      progressText: 'Langkah {{current}} dari {{total}}',
      doneBtnText: 'Selesai',
      nextBtnText: 'Lanjut',
      prevBtnText: 'Kembali',
      steps: steps,
      onPopoverRender: (popover, { state }) => {
        // Custom styling to match our premium aesthetic
        const wrapper = popover.wrapper;
        const title = popover.title;
        const description = popover.description;
        const nextBtn = popover.nextButton;
        const prevBtn = popover.previousButton;
        const closeBtn = popover.closeButton;
        
        if (wrapper) {
          wrapper.style.backgroundColor = 'var(--color-primary)'; // Navy background
          wrapper.style.borderRadius = '16px';
          wrapper.style.border = '1px solid rgba(255,255,255,0.1)';
          wrapper.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.5)';
        }

        if (title) {
          title.style.color = 'var(--color-secondary)'; // Orange title
          title.style.fontSize = '18px';
        }
        
        if (description) {
          description.style.color = 'rgba(255, 255, 255, 0.9)'; // White text for description
          description.style.fontWeight = '400';
        }

        if (closeBtn) {
          closeBtn.style.color = 'rgba(255, 255, 255, 0.6)';
        }

        if (nextBtn) {
          nextBtn.style.backgroundColor = 'var(--color-secondary)'; // Orange CTA
          nextBtn.style.color = 'white';
          nextBtn.style.borderRadius = '8px';
          nextBtn.style.padding = '6px 14px';
          nextBtn.style.textShadow = 'none';
          nextBtn.style.border = 'none';
          nextBtn.style.fontWeight = 'bold';
        }
        
        if (prevBtn) {
          prevBtn.style.borderRadius = '8px';
          prevBtn.style.color = 'rgba(255, 255, 255, 0.8)';
          prevBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
          prevBtn.style.backgroundColor = 'transparent';
          prevBtn.style.textShadow = 'none';
        }
      },
    });

    const hasSeenTour = localStorage.getItem(`tour_completed_${tourId}`);
    
    if (autoStart && !hasSeenTour) {
      // Small delay to allow elements to render properly
      const timer = setTimeout(() => {
        driverObj.current?.drive();
        localStorage.setItem(`tour_completed_${tourId}`, 'true');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isClient, steps, tourId, autoStart]);

  const startTour = () => {
    driverObj.current?.drive();
    localStorage.setItem(`tour_completed_${tourId}`, 'true');
  };

  return { startTour };
}
