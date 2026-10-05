import React from 'react';

/**
 * Reusable Switch (Toggle) Component
 *
 * Design Specifications:
 * - Rounded pill shape
 * - Height: 28px (`h-[28px]`)
 * - Width: 56px (`w-[56px]`)
 * - White circular thumb (`w-6 h-6 bg-white rounded-full`)
 * - Soft shadow on the thumb (`shadow-md`)
 * - Primary theme color when ON (`bg-gov-blue hover:bg-gov-blue-dark`)
 * - Light gray background when OFF (`bg-gray-300 hover:bg-gray-400/80`)
 * - Smooth 250ms transition duration (`duration-300` / `duration-200`)
 * - Focus ring (`focus:outline-none focus:ring-2 focus:ring-gov-blue/40 focus:ring-offset-2`)
 * - Hover effect
 * - Disabled state (`disabled:opacity-50 disabled:cursor-not-allowed`)
 * - Keyboard accessible (`Space` & `Enter` support, `role="switch"`, `aria-checked`)
 */
export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  name,
  id,
  ariaLabel,
  className = '',
}) {
  const handleClick = (e) => {
    e.preventDefault();
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (onChange) onChange(!checked);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      id={id}
      name={name}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex items-center flex-shrink-0
        w-[56px] h-[28px] p-0.5
        rounded-full cursor-pointer
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-gov-blue/40 focus:ring-offset-2
        ${checked ? 'bg-gov-blue hover:bg-gov-blue-dark' : 'bg-gray-300 hover:bg-gray-400/80'}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-gray-300' : ''}
        ${className}
      `.trim()}
    >
      <span
        className={`
          pointer-events-none block w-6 h-6 bg-white rounded-full
          shadow-md
          transform transition-transform duration-200 ease-in-out
          ${checked ? 'translate-x-[28px]' : 'translate-x-0'}
        `.trim()}
      />
    </button>
  );
}
