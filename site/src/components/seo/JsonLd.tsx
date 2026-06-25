import { site } from "@/data/site";
import { profissionais } from "@/data/profissionais";

/** Dados estruturados RealEstateAgent para SEO. */
export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: `${site.nome} — ${site.assinatura}`,
    description: site.descricao,
    areaServed: site.regiao,
    url: site.url,
    ...(site.telefone ? { telephone: site.telefone } : {}),
    employee: profissionais.map((p) => ({
      "@type": "Person",
      name: p.nome,
      jobTitle: p.papel,
      identifier: p.creci,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
