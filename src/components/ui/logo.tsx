import { Share2 } from "lucide-react";
import Link from "next/link";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export function Logo({ className, iconClassName, textClassName }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className || ""}`}>
      <Share2 className={`h-6 w-6 text-indigo-600 ${iconClassName || ""}`} />
      <span className={`font-bold ${textClassName || ""}`}>SplitEase</span>
    </Link>
  );
}
