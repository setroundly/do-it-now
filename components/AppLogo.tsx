import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

interface AppLogoProps {
  size?: "sm" | "md";
  showTagline?: boolean;
  className?: string;
}

const iconSizes = { sm: 36, md: 40 } as const;

export function AppLogo({
  size = "md",
  showTagline = true,
  className = "",
}: AppLogoProps) {
  const px = iconSizes[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={px} />
      <div className="min-w-0">
        <p
          className={`font-semibold leading-tight tracking-tight text-zinc-900 ${
            size === "sm" ? "text-lg" : "text-xl"
          }`}
          aria-label={APP_NAME}
        >
          {APP_NAME}
        </p>
        {showTagline && (
          <p className="mt-0.5 text-[11px] font-medium text-zinc-500">
            {APP_TAGLINE}
          </p>
        )}
      </div>
    </div>
  );
}

export function LogoMark({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <rect
        x="0.75"
        y="0.75"
        width="38.5"
        height="38.5"
        rx="10"
        fill="#ffffff"
        stroke="#e5e5e5"
        strokeWidth="1.5"
      />
      <circle cx="20" cy="21" r="9" stroke="#dc2626" strokeWidth="2" />
      <path
        d="M20 21V15"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M20 21l4.5 3.5"
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
