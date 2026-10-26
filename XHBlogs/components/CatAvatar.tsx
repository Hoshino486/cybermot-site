'use client';

// A deterministic chibi catgirl avatar: the same seed always renders the same face,
// so a commenter keeps their look while every commenter looks different.
const HAIR = ['#f7b8cc', '#c8b6f2', '#9ed7e9', '#f6cf88', '#a9dfbd', '#f2a7a7', '#ccd5e6', '#e79fc8', '#8fb8f0'];
const EYES = ['#4f7fd0', '#6f56c9', '#2f9e9e', '#c9772f', '#8e4f9e', '#3d6fc2', '#b8455f'];
const SKIN = ['#ffe6d8', '#ffe0d0', '#ffeadf'];
const INNER_EAR = ['#ffc2d6', '#ffd0c0', '#f9c9e0'];
const CLIP = ['#ffd166', '#9be7d8', '#ffb3c7', '#b8c0ff'];

function random(seed: number) {
  let state = (seed || 1) % 2147483647;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

export default function CatAvatar({ seed, size = 44, className = '' }: { seed: number; size?: number; className?: string }) {
  const next = random(seed);
  const pick = (list: string[]) => list[Math.floor(next() * list.length)];
  const flip = next() > 0.5;
  const hair = pick(HAIR);
  const eye = pick(EYES);
  const skin = pick(SKIN);
  const inner = pick(INNER_EAR);
  const clip = pick(CLIP);
  const hasClip = next() > 0.45;
  const hasFang = next() > 0.6;
  const gradientId = `cat-bg-${seed}`;
  const hairShade = `${hair}22`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="猫娘头像"
      data-seed={seed}
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={hairShade} />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill={`url(#${gradientId})`} />

      <g transform={flip ? 'translate(64 0) scale(-1 1)' : undefined}>
        {/* ears */}
        <path d="M15 26 L18.5 9.5 L29 20.5 Z" fill={hair} />
        <path d="M18.5 22 L20 13.5 L25 20 Z" fill={inner} />
        <path d="M49 26 L45.5 9.5 L35 20.5 Z" fill={hair} />
        <path d="M45.5 22 L44 13.5 L39 20 Z" fill={inner} />

        {/* hair behind the face */}
        <ellipse cx="32" cy="38" rx="23" ry="21" fill={hair} />
        <ellipse cx="32" cy="41" rx="23" ry="18" fill={hair} />

        {/* face */}
        <ellipse cx="32" cy="37" rx="16.5" ry="15" fill={skin} />

        {/* bangs */}
        <path d="M15.5 33 C16.5 21 24 15.5 32 15.5 C40 15.5 47.5 21 48.5 33 C45 26.5 41 24 37.5 27.5 C34 31 30 31 26.5 27.5 C23 24 19 26.5 15.5 33 Z" fill={hair} />
        <path d="M32 15.5 C36 19 37 23 36 28" stroke={hairShade} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.7" />

        {/* eyes */}
        <ellipse cx="25.5" cy="37" rx="3.5" ry="4.6" fill={eye} />
        <ellipse cx="38.5" cy="37" rx="3.5" ry="4.6" fill={eye} />
        <circle cx="26.6" cy="35.2" r="1.35" fill="#ffffff" />
        <circle cx="39.6" cy="35.2" r="1.35" fill="#ffffff" />
        <circle cx="24.6" cy="38.8" r="0.75" fill="#ffffff" opacity="0.85" />
        <circle cx="37.6" cy="38.8" r="0.75" fill="#ffffff" opacity="0.85" />

        {/* blush */}
        <ellipse cx="21.5" cy="42.5" rx="3" ry="1.7" fill="#ff9db5" opacity="0.55" />
        <ellipse cx="42.5" cy="42.5" rx="3" ry="1.7" fill="#ff9db5" opacity="0.55" />

        {/* mouth */}
        {hasFang ? (
          <path d="M29.6 44.4 Q32 47 34.4 44.4 L33.4 47.4 Z" fill="#e06a85" />
        ) : (
          <path d="M29.8 44.6 Q32 46.8 34.2 44.6" stroke="#d9768f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        )}

        {/* hair clip */}
        {hasClip && (
          <g transform="translate(44 22) rotate(12)">
            <path d="M0 -4.4 L1.3 -1.3 L4.6 -1.1 L2 -0.9 L1.2 4.2 L0 0.6 L-1.2 4.2 L-2 -0.9 L-4.6 -1.1 L-1.3 -1.3 Z" fill={clip} />
          </g>
        )}
      </g>

      <circle cx="32" cy="32" r="31" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.75" />
    </svg>
  );
}
