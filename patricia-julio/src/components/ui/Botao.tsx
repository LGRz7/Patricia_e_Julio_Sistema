import Link from "next/link";

type Variante = "solido" | "contorno" | "claro";

interface BaseProps {
  variante?: Variante;
  className?: string;
  children: React.ReactNode;
}

const estilos: Record<Variante, string> = {
  solido: "bg-navy text-beige hover:bg-ink",
  contorno: "border border-navy/30 text-navy hover:border-navy hover:bg-navy hover:text-beige",
  claro: "bg-beige text-navy hover:bg-white",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-fluid-sm font-medium tracking-tight transition-colors duration-400 ease-editorial focus-visible:outline-2";

export function BotaoLink({
  href,
  external,
  variante = "solido",
  className = "",
  children,
}: BaseProps & { href: string; external?: boolean }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} ${estilos[variante]} ${className}`}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`${base} ${estilos[variante]} ${className}`}>
      {children}
    </Link>
  );
}

export function Botao({
  variante = "solido",
  className = "",
  children,
  ...props
}: BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${estilos[variante]} ${className}`} {...props}>
      {children}
    </button>
  );
}
