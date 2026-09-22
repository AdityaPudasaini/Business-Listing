// TiktokIcon.tsx — lucide-react ships Facebook, Instagram and Linkedin but
// has no TikTok mark, so this fills the gap with a simplified note-and-loop
// glyph drawn in the same stroke style (24x24 viewBox, round caps, currentColor)
// as the rest of the app's lucide icons, so it drops in anywhere a lucide
// icon is used (size/className/style props behave the same way).
import { forwardRef, type SVGProps } from "react";

interface TiktokIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const TiktokIcon = forwardRef<SVGSVGElement, TiktokIconProps>(
  ({ size = 24, color = "currentColor", strokeWidth = 2, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  ),
);

TiktokIcon.displayName = "TiktokIcon";
