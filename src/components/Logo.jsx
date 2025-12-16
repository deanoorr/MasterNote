import React from 'react';

export const Logo = ({ className = "w-8 h-8" }) => (
    <img
        src="/logo.png"
        alt="Bart Logo"
        className={className}
    />
);
