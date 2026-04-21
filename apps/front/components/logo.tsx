export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      {/* 파비콘과 동일한 크루키드-B 심볼 */}
      <svg
        width="1.1em"
        height="1.1em"
        viewBox="0 0 180 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="180" height="180" rx="38" fill="#292524" />
        <line
          x1="58" y1="42"
          x2="62" y2="138"
          stroke="#FAFAF9"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 60,42 C 60,42 118,38 120,68 C 122,88 65,90 63,90"
          fill="none"
          stroke="#FAFAF9"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 60,90 C 60,90 126,86 128,118 C 130,142 62,140 59,138"
          fill="none"
          stroke="#FAFAF9"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        Bluecollar{" "}
        <span className="font-bold text-primary">CV</span>
      </span>
    </span>
  );
}
