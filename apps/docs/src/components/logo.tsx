import { SITE_NAME } from '@/lib/constants';

// Logo de l'interface (apps/web/public/logo.svg), le sifflet de bosco, suivi du nom de l'application
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold">
      <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#0d6e66" height="24" rx="5.3" width="24" />
        <g
          fill="none"
          stroke="#ffffff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          transform="translate(2.64 2.64) scale(0.78)"
        >
          <path d="M2.6 9.2Q8.4 7.6 13.3 9" />
          <circle cx="17.2" cy="10.4" r="4" />
          <path d="M4.6 11.4Q9.6 15.2 14.4 13.8" />
          <path d="M9.4 14.2V16" />
          <circle cx="9.4" cy="18" r="1.7" />
          <circle cx="17.2" cy="8.4" fill="#ffffff" r="1.15" stroke="none" />
        </g>
      </svg>
      {SITE_NAME}
    </span>
  );
}
