import { APP_TAGLINE } from "@/lib/branding";

interface AppLogoProps {
  variant?: "default" | "header";
  showTagline?: boolean;
  className?: string;
}

export function AppLogo({
  variant = "default",
  showTagline = true,
  className = "",
}: AppLogoProps) {
  const onHeader = variant === "header";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoWordmark light={onHeader} />
      {showTagline && (
        <p
          className={`hidden text-[11px] font-medium sm:block ${
            onHeader ? "text-white/80" : "text-zinc-500"
          }`}
        >
          {APP_TAGLINE}
        </p>
      )}
    </div>
  );
}

function LogoWordmark({ light }: { light?: boolean }) {
  return (
    <span
      className={`font-black tracking-tight ${
        light ? "text-white" : "text-brand-700"
      } text-lg sm:text-xl`}
      aria-label="DOO IT NOW"
    >
      D
      <span className="relative inline-block">
        <span className="relative z-10">O</span>
        <span
          className={`absolute left-1/2 top-[0.35em] h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
            light ? "bg-white" : "bg-brand-500"
          }`}
          aria-hidden
        />
        <span
          className={`absolute left-[calc(50%+0.55em)] top-[0.35em] h-1.5 w-1.5 -translate-x-1/2 rounded-full ${
            light ? "bg-white" : "bg-brand-500"
          }`}
          aria-hidden
        />
      </span>
      <span className="mx-0.5"> </span>
      IT NOW
    </span>
  );
}

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        DOO
      </text>
    </svg>
  );
}
