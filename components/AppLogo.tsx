import Image from "next/image";
import { APP_TAGLINE } from "@/lib/branding";

const LOGO_SRC = "/doo-it-now-logo.png";

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
      <Image
        src={LOGO_SRC}
        alt="DOO IT NOW"
        width={240}
        height={120}
        className={`w-auto object-contain ${
          onHeader ? "h-10 rounded-md sm:h-12" : "h-12 sm:h-14"
        }`}
        priority={onHeader}
      />
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

export function LogoMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      width={size * 2}
      height={size}
      className={`rounded object-contain ${className}`}
      aria-hidden
    />
  );
}
