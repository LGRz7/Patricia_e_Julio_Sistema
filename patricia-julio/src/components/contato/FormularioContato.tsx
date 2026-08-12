"use client";

import { useState } from "react";
import { imoveis } from "@/data/imoveis";
import { profissionais } from "@/data/profissionais";
import { site } from "@/data/site";
import { linkWhatsapp, mensagemFormulario } from "@/lib/whatsapp";

/**
 * Formulário sem backend: monta uma mensagem organizada e abre o
 * WhatsApp do profissional escolhido. Se nenhum número estiver
 * configurado, mostra aviso claro em vez de link quebrado.
 */
export function FormularioContato() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [imovel, setImovel] = useState("");
  const [responsavelId, setResponsavelId] = useState(profissionais[0]?.id ?? "");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Por favor, informe seu nome.");
      return;
    }

    const profissional = profissionais.find((p) => p.id === responsavelId);
    const numero = profissional?.whatsapp ?? site.whatsappGeral;

    const texto = mensagemFormulario({
      nome,
      telefone: telefone || undefined,
      imovel: imovel || undefined,
      mensagem: mensagem || undefined,
    });

    const link = linkWhatsapp({ numero, mensagem: texto });

    if (!link) {
      setErro(
        "O WhatsApp ainda não foi configurado. Em breve este formulário estará ativo."
      );
      return;
    }

    window.open(link, "_blank", "noopener,noreferrer");
  };

  const inputClass =
    "w-full rounded-xl border border-navy/20 bg-white/60 px-4 py-3 text-fluid-base text-navy outline-none transition-colors focus:border-teal";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="nome" className="mb-2 block text-fluid-sm text-navy/70">
          Nome *
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="telefone" className="mb-2 block text-fluid-sm text-navy/70">
          Telefone
        </label>
        <input
          id="telefone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="imovel" className="mb-2 block text-fluid-sm text-navy/70">
          Imóvel de interesse
        </label>
        <select
          id="imovel"
          value={imovel}
          onChange={(e) => setImovel(e.target.value)}
          className={inputClass}
        >
          <option value="">Não tenho um específico</option>
          {imoveis.map((i) => (
            <option key={i.slug} value={i.titulo}>
              {i.titulo}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block text-fluid-sm text-navy/70">
          Com quem prefere falar?
        </label>
        <div className="flex flex-wrap gap-3">
          {profissionais.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setResponsavelId(p.id)}
              className={`rounded-full border px-4 py-2 text-fluid-sm transition-colors ${
                responsavelId === p.id
                  ? "border-navy bg-navy text-beige"
                  : "border-navy/20 text-navy/70 hover:border-navy"
              }`}
            >
              {p.nome.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="mensagem" className="mb-2 block text-fluid-sm text-navy/70">
          Mensagem
        </label>
        <textarea
          id="mensagem"
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      {erro && <p className="text-fluid-sm text-teal">{erro}</p>}

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full bg-navy px-6 py-3.5 text-fluid-sm font-medium text-beige transition-colors duration-400 ease-editorial hover:bg-ink sm:w-auto"
      >
        Enviar pelo WhatsApp
      </button>
    </form>
  );
}
