export function CircleBackground({
  color,
  className,
}: {
  color: string;
  className: string;
}) {
  return (
    <svg
      viewBox="0 0 558 558"
      width="558"
      height="558"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="gradient"
          x1="79"
          y1="16"
          x2="105"
          y2="237"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        opacity=".2"
        d="M1 279C1 125.465 125.465 1 279 1s278 124.465 278 278-124.465 278-278 278S1 432.535 1 279Z"
        stroke={color}
      />
      <path
        d="M1 279C1 125.465 125.465 1 279 1"
        stroke="url(#gradient)"
        strokeLinecap="round"
      />
    </svg>
  );
} 