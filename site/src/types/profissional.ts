export interface Profissional {
  id: string;
  nome: string;
  papel: string;
  creci: string;
  /** texto institucional curto e honesto — sem números inventados */
  bio: string;
  especialidades: string[];
  foto: string;
  fotoAlt: string;
  /** número de WhatsApp só com dígitos (ex: 5521999999999) ou null */
  whatsapp: string | null;
}
