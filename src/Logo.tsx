export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return <img src="/logo.png" className={`no-invert block ${className}`} alt="Machinarc logo" />;
}
