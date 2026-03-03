/**
 * Reusable card component — layout and styling pattern used across the app.
 * Props: title, children, optional className and style overrides.
 */
import React from 'react';

export default function Card({ title, children, className = '', style = {} }) {
  return (
    <div
      className={`card ${className}`}
      style={{
        background: 'var(--bg-secondary, #1a1a1a)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        ...style,
      }}
    >
      {title && (
        <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
