"use client";

import Link from "next/link";

interface Props {
  href: string;
  children: React.ReactNode;
  className?: string;
  ativo?: boolean;
}

/** Link com sublinhado que cresce no hover (microinteração discreta). */
export function LinkAnimado({ href, children, className = "", ativo }: Props) {
  return (
    <Link
      href={href}
      className={`group relative inline-block ${className}`}
      aria-current={ativo ? "page" : undefined}
    >
      <span>{children}</span>
      <span
        className={`absolute -bottom-1 left-0 h-px bg-current transition-all duration-500 ease-editorial ${
          ativo ? "w-full" : "w-0 group-hover:w-full"
        }`}
      />
    </Link>
  );
}
