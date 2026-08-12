import { site } from "@/data/site";

/**
 * Monta um link de WhatsApp com mensagem pré-preenchida.
 * Se nenhum número estiver configurado ainda, retorna null para a UI
 * tratar o estado pendente (sem link quebrado).
 */
export function linkWhatsapp(opts?: {
  numero?: string | null;
  mensagem?: string;
}): string | null {
  const numero = opts?.numero ?? site.whatsappGeral;
  if (!numero) return null;
  const base = `https://wa.me/${numero}`;
  if (!opts?.mensagem) return base;
  return `${base}?text=${encodeURIComponent(opts.mensagem)}`;
}

export function mensagemInteresseImovel(titulo: string): string {
  return `Olá! Tenho interesse no imóvel "${titulo}". Pode me passar mais informações?`;
}

export function mensagemContatoGeral(): string {
  return "Olá! Vim pelo site e gostaria de falar com vocês sobre imóveis.";
}

/** Monta a mensagem do formulário de contato (sem backend). */
export function mensagemFormulario(dados: {
  nome: string;
  telefone?: string;
  imovel?: string;
  mensagem?: string;
}): string {
  const linhas = [
    "Olá! Vim pelo site.",
    `Nome: ${dados.nome}`,
    dados.telefone ? `Telefone: ${dados.telefone}` : null,
    dados.imovel ? `Imóvel de interesse: ${dados.imovel}` : null,
    dados.mensagem ? `Mensagem: ${dados.mensagem}` : null,
  ].filter(Boolean);
  return linhas.join("\n");
}

/** Monta a mensagem do quiz com as respostas resumidas. */
export function mensagemQuiz(
  respostas: { pergunta: string; resposta: string }[]
): string {
  const linhas = [
    "Olá! Fiz o quiz no site e quero ver as opções de imóvel.",
    "",
    ...respostas.map((r) => `• ${r.pergunta}: ${r.resposta}`),
  ];
  return linhas.join("\n");
}
