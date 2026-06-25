import Link from "next/link";
import { profissionais } from "@/data/profissionais";
import { site } from "@/data/site";
import { navLinks } from "./nav-links";

export function Footer() {
  return (
    <footer className="bg-navy text-beige">
      <div className="editorial py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <p className="font-display text-fluid-lg font-semibold tracking-tight">
              {site.nome}
            </p>
            <p className="mt-3 max-w-sm text-fluid-sm text-beige/70">
              {site.descricao}
            </p>
            <p className="mt-6 text-fluid-sm text-beige/50">{site.regiao}</p>
          </div>

          <div>
            <p className="text-fluid-sm uppercase tracking-widest text-beige/40">
              Navegação
            </p>
            <ul className="mt-4 space-y-2 text-fluid-sm">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-beige/80 transition-colors hover:text-beige"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-fluid-sm uppercase tracking-widest text-beige/40">
              Corretores
            </p>
            <ul className="mt-4 space-y-3 text-fluid-sm">
              {profissionais.map((p) => (
                <li key={p.id} className="text-beige/80">
                  {p.nome}
                  <span className="block text-beige/40">{p.creci}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-beige/10 pt-6 text-fluid-sm text-beige/40 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.nome} — {site.assinatura}
          </p>
          <p className="flex items-center gap-2">
            {site.instagram && (
              <a
                href={site.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-beige/60 transition-colors hover:text-beige"
              >
                {site.instagram}
              </a>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
