"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { LinkAnimado } from "@/components/ui/LinkAnimado";
import { MenuMobile } from "./MenuMobile";
import { navLinks } from "./nav-links";
import { site } from "@/data/site";

export function Header() {
  const pathname = usePathname();
  const [rolou, setRolou] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  // header começa transparente e ganha fundo claro ao rolar
  useEffect(() => {
    const onScroll = () => setRolou(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // na home o header sobrepõe o hero (texto claro); nas outras, fundo claro
  const sobreHero = pathname === "/" && !rolou;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ease-editorial ${
          rolou || pathname !== "/"
            ? "bg-beige/85 backdrop-blur-md"
            : "bg-transparent"
        }`}
      >
        <div className="editorial flex h-16 items-center justify-between md:h-20">
          <Link
            href="/"
            className={`font-display text-lg font-semibold tracking-tight transition-colors md:text-xl ${
              sobreHero ? "text-beige" : "text-navy"
            }`}
          >
            {site.nome}
            <span className="opacity-50">*</span>
          </Link>

          <nav
            className={`hidden items-center gap-8 text-fluid-sm md:flex ${
              sobreHero ? "text-beige" : "text-navy"
            }`}
          >
            {navLinks.map((link) => (
              <LinkAnimado
                key={link.href}
                href={link.href}
                ativo={pathname === link.href}
              >
                {link.label}
              </LinkAnimado>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/contato"
              className={`hidden rounded-full border px-5 py-2 text-fluid-sm transition-colors duration-400 ease-editorial md:inline-block ${
                sobreHero
                  ? "border-beige/40 text-beige hover:bg-beige hover:text-navy"
                  : "border-navy/30 text-navy hover:bg-navy hover:text-beige"
              }`}
            >
              Falar com a gente
            </Link>

            <button
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className={`rounded-full p-2 md:hidden ${
                sobreHero ? "text-beige" : "text-navy"
              }`}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <MenuMobile aberto={menuAberto} aoFechar={() => setMenuAberto(false)} />
    </>
  );
}
