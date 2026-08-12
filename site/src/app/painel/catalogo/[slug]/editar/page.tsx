"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ImovelForm } from "@/components/painel/catalogo/ImovelForm"
import { apiGetImovel } from "@/lib/painel/imoveis-api"
import type { Imovel } from "@/types/imovel"

export default function EditarImovel() {
  const params = useParams<{ slug: string }>()
  const slug = params?.slug
  const [imovel, setImovel] = useState<Imovel | null | undefined>(undefined)

  useEffect(() => {
    if (!slug) return
    let mounted = true
    apiGetImovel(slug).then((r) => { if (mounted) setImovel(r) }).catch(() => { if (mounted) setImovel(null) })
    return () => { mounted = false }
  }, [slug])

  if (imovel === undefined) {
    return <div className="px-5 lg:px-10 py-16 text-center text-teal text-[13px]">Carregando imóvel…</div>
  }
  if (imovel === null) {
    return (
      <div className="px-5 lg:px-10 py-16 text-center">
        <p className="text-[14px] font-bold text-navy">Imóvel não encontrado</p>
        <Link href="/painel/catalogo" className="mt-3 inline-block text-[12px] text-teal underline">Voltar ao catálogo</Link>
      </div>
    )
  }

  return <ImovelForm modo="editar" inicial={imovel} />
}
