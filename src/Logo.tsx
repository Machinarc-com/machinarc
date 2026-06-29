export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={`no-invert flex shrink-0 items-center justify-center ${className}`}>
      <svg viewBox="0 0 512 512" className="h-full w-full" fill="none" aria-hidden="true">
        <g transform="rotate(2 256 256) translate(22 24)">
          <path
            d="M104 400 L140 150 L256 320 L372 150 L408 400 L322 400 L308 252 L256 348 L204 252 L190 400 Z"
            fill="#f4ead9"
          />
        </g>
        <g transform="rotate(-2 256 256)">
          <path
            d="M104 400 L140 150 L256 320 L372 150 L408 400 L322 400 L308 252 L256 348 L204 252 L190 400 Z"
            fill="#cf0a14"
          />
        </g>
      </svg>
    </span>
  );
}
