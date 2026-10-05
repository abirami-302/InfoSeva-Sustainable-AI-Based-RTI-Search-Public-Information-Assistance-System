import React from 'react';
import tricolorBg from '../../assets/tricolor-bg.jpg';

/**
 * Fixed, low-opacity tricolor watercolor backdrop.
 * Used behind User / Admin / DataManager portals (NOT the landing page,
 * which has its own hero treatment).
 * Sits at z-0 with a white wash on top so text/cards (z-10+) stay fully readable.
 */
export default function TricolorBackdrop() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      <img
        src={tricolorBg}
        alt=""
        className="w-full h-full object-cover opacity-[0.07]"
      />
      <div className="absolute inset-0 bg-gray-50/80" />
    </div>
  );
}
