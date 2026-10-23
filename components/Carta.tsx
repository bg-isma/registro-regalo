export function Carta() {
  return (
    <figure className="mx-auto w-[200px] sm:w-full sm:max-w-md lg:max-w-none">
      <svg
        viewBox="0 0 520 600"
        className="h-auto w-full"
        role="img"
        aria-label="Carta de papel con un sello de lacre"
      >
        <rect x="86" y="64" width="348" height="456" fill="#e4d8c6" />
        <rect
          x="68"
          y="46"
          width="348"
          height="456"
          fill="#f7f1e6"
          stroke="#1c1916"
          strokeWidth="1.4"
        />
        <path d="M332 46 L416 130 L332 130 Z" fill="#efe3d0" stroke="#1c1916" strokeWidth="1.4" />
        <path d="M332 46 L416 130" stroke="#1c1916" strokeWidth="1.4" />
        <text
          x="96"
          y="92"
          fill="#8e2f2b"
          fontFamily="var(--font-fraunces), Georgia, serif"
          fontSize="18"
        >
          01
        </text>
        <g stroke="#c9bba8" strokeWidth="1.2" fill="none">
          <path d="M100 168 H300" />
          <path d="M100 196 H340" />
          <path d="M100 224 H318" />
          <path d="M100 252 H286" />
          <path d="M100 280 H332" />
          <path d="M100 308 H250" />
        </g>
        <circle cx="292" cy="400" r="52" fill="#8e2f2b" />
        <circle cx="292" cy="400" r="38" fill="none" stroke="#f4e7d4" strokeWidth="1.15" />
        <text
          x="292"
          y="414"
          textAnchor="middle"
          fill="#f6efe4"
          fontFamily="var(--font-fraunces), Georgia, serif"
          fontSize="46"
        >
          S
        </text>
      </svg>
      <figcaption className="mt-3 flex flex-col items-center gap-1 text-center text-[0.68rem] uppercase tracking-[0.18em] text-muted sm:flex-row sm:items-baseline sm:justify-between sm:text-left sm:text-[0.72rem] sm:tracking-[0.22em]">
        <span>Muestra</span>
        <span>Papel y lacre</span>
      </figcaption>
    </figure>
  );
}
