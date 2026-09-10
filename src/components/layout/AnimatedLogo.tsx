"use client";

import React from "react";

export default function AnimatedLogo() {
  return (
    <div className="logo-wrapper">
      <div className="animated-logo">
        <div className="rect rect-1"></div>
        <div className="rect rect-2"></div>
        <div className="rect rect-3"></div>
        <div className="rect rect-4"></div>
        <div className="rect rect-6"></div>
        <div className="rect rect-7"></div>
      </div>
      <style href="animated-logo" precedence="default" dangerouslySetInnerHTML={{ __html: `
        .logo-wrapper {
          transform: scale(0.4);
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100px;
          height: 115px;
        }

        .animated-logo {
          position: relative;
          width: 238.62px;
          height: 284.55px;
          flex-shrink: 0;
        }

        .rect {
          position: absolute;
          animation-duration: 1.5s;
          animation-iteration-count: infinite;
          animation-direction: alternate;
          animation-timing-function: ease-in-out;
        }

        .rect-1 {
          left: 0.23%; right: 0.23%; top: 55.19%; bottom: 0%;
          background: #EE7B1E;
        }
        
        .rect-2 {
          left: 0%; right: 0.47%; top: 0%; bottom: 55.19%;
          background: #194189;
          transform: rotate(-179.49deg);
        }
        
        .rect-3 {
          left: 30.41%; right: 53.25%; top: 35.51%; bottom: 51.28%;
          background: #194189;
          transform: rotate(-47.97deg);
        }
        
        .rect-4 {
          left: 47.59%; right: 36.07%; top: 47.11%; bottom: 39.69%;
          background: #194189;
          transform: rotate(-47.8deg);
        }

        .rect-6 {
          background: #194189;
          transform: rotate(179.5deg);
          animation-name: animateRect6;
        }

        @keyframes animateRect6 {
          0% {
            left: -0.14%; right: -0.02%; top: -13.72%; bottom: 87.35%;
          }
          100% {
            left: -0.74%; right: -35.49%; top: -13.98%; bottom: 30.84%;
          }
        }

        .rect-7 {
          background: #EE7B1E;
          transform: rotate(-0.5deg);
          animation-name: animateRect7;
        }

        @keyframes animateRect7 {
          0% {
            left: -0.42%; right: 0.26%; top: 86.45%; bottom: -12.83%;
          }
          100% {
            left: -27.23%; right: -5.19%; top: 45.49%; bottom: -12.79%;
          }
        }
      `}} />
    </div>
  );
}
