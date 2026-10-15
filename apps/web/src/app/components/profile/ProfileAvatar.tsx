import type { SVGProps } from 'react'

export function ProfileAvatarSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Avatar"
      {...props}
    >
      {/* Off-white background */}
      <rect width="100" height="100" fill="#FFFFFF" />

      {/* Hair & Head Silhouette */}
      <path
        d="M24 45 C22 30 30 14 50 12 C68 10 78 18 80 32 C82 38 80 44 78 48 C76 44 74 38 72 34 C64 26 52 24 38 30 C30 34 26 40 24 45 Z"
        fill="#1C1B18"
      />
      {/* Spiky hair tufts on top and sides */}
      <path
        d="M26 38 C28 26 38 18 48 16 C54 15 64 15 72 19 C76 21 78 26 80 32 C75 25 68 21 60 20 C50 19 40 22 34 28 C30 32 28 35 26 38 Z"
        fill="#1C1B18"
      />
      <path
        d="M38 16 C42 10 50 11 54 14 C48 15 44 18 38 16 Z"
        fill="#1C1B18"
      />
      <path
        d="M56 12 C62 8 70 11 72 15 C66 14 62 16 56 12 Z"
        fill="#1C1B18"
      />

      {/* Ears */}
      <path
        d="M27 52 C21 52 20 62 25 65 C27 66 28 64 29 62"
        fill="#FFFFFF"
        stroke="#1C1B18"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M77 50 C83 50 84 60 79 63 C77 64 76 62 75 60"
        fill="#FFFFFF"
        stroke="#1C1B18"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Face outline */}
      <path
        d="M28 48 C27 68 32 82 50 86 C64 88 74 80 76 66 C78 56 78 50 77 48"
        fill="#FFFFFF"
        stroke="#1C1B18"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {/* Sideburns */}
      <path d="M27 46 L29 55 L31 52 Z" fill="#1C1B18" />
      <path d="M77 46 L75 54 L73 51 Z" fill="#1C1B18" />

      {/* Thick Sunglasses */}
      {/* Left lens */}
      <path
        d="M31 48 C31 42 38 40 47 40 C52 40 55 43 55 48 C55 54 52 58 45 58 C36 58 31 55 31 48 Z"
        fill="#1C1B18"
      />
      {/* Sunglasses bridge */}
      <path
        d="M54 46 L58 46"
        stroke="#1C1B18"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Right lens */}
      <path
        d="M57 48 C57 43 60 40 65 40 C74 40 81 42 81 48 C81 55 76 58 67 58 C60 58 57 54 57 48 Z"
        fill="#1C1B18"
      />

      {/* Sunglasses white reflections */}
      <path
        d="M34 45 L42 43"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M60 45 L68 43"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Nose */}
      <path
        d="M55 60 C55 64 53 66 50 66"
        stroke="#1C1B18"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Cool smirk / smile */}
      <path
        d="M43 73 C50 77 62 76 67 71"
        stroke="#1C1B18"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Smile dimple */}
      <path
        d="M67 69 C68 71 68 72 68 73"
        stroke="#1C1B18"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Chin crease */}
      <path
        d="M51 81 C54 82 56 82 58 81"
        stroke="#1C1B18"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Neck line */}
      <path
        d="M42 85 L42 96"
        stroke="#1C1B18"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M66 84 L66 96"
        stroke="#1C1B18"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
