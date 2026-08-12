import { redirect } from "next/navigation"

/**
 * /painel/marketing/gerar — descontinuado.
 *
 * Fluxo de "pedir criativo" via formulário foi removido. Marketing agora é
 * automático pelo Estúdio — 1 frase, sistema decide tudo, PNG pronto.
 * Redireciona pra lá.
 */
export default function GerarPage() {
  redirect("/painel/marketing/estudio")
}
