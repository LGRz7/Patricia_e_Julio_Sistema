import type { Metadata } from "next";
import { LinktreePage } from "@/components/links/LinktreePage";
import { site } from "@/data/site";
import { profissionais } from "@/data/profissionais";

export const metadata: Metadata = {
  title: "Links — Patrícia e Júlio Corretores",
  description:
    "Acesse o site, Instagram, catálogo de imóveis e WhatsApp da Patrícia e Júlio Corretores de Imóveis.",
  openGraph: {
    title: "Patrícia e Júlio — Corretores de Imóveis",
    description: site.descricao,
    images: ["/equipe/patricia-julio.png"],
  },
};

export default function Page() {
  return <LinktreePage />;
}
