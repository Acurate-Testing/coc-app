'use client';

export default function Logo() {
  return (
    <div className="text-center mb-4">
      <div className="d-inline-block position-relative">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-2"
        >
          <circle cx="60" cy="60" r="58" stroke="#2E7D32" strokeWidth="4" fill="white" />
          <path
            d="M40 70 L55 85 L85 45"
            stroke="#2E7D32"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M60 30 C40 45 40 75 60 90 C80 75 80 45 60 30"
            stroke="#2E7D32"
            strokeWidth="4"
            fill="none"
          />
        </svg>
        <h1 className="h4 text-success mb-0">EcoInspect</h1>
        <p className="text-muted small">Environmental Compliance Platform</p>
      </div>
    </div>
  );
} 