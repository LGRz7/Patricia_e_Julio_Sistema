"""
Script para gerar uma versão do catálogo com imagens embutidas (base64).
O HTML resultante pode ser aberto no navegador e convertido em PDF
sem problemas de imagens faltando.

Uso:
  python gerar-catalogo-pdf.py

Resultado:
  catalogo-posts-pdf.html (pronto para imprimir como PDF)
"""

import base64
import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, "catalogo-posts.html")
OUTPUT_FILE = os.path.join(SCRIPT_DIR, "catalogo-posts-pdf.html")


def get_mime(filename):
    ext = filename.lower().rsplit(".", 1)[-1]
    return {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "svg": "image/svg+xml",
        "gif": "image/gif",
    }.get(ext, "image/png")


def img_to_base64(match):
    src = match.group(1)
    # Resolve caminho relativo a partir da pasta do HTML
    img_path = os.path.normpath(os.path.join(SCRIPT_DIR, src))

    if not os.path.isfile(img_path):
        print(f"  [AVISO] Imagem não encontrada: {img_path}")
        return match.group(0)  # mantém original

    mime = get_mime(img_path)
    with open(img_path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")

    print(f"  ✓ Embutida: {src}")
    return f'src="data:{mime};base64,{data}"'


def main():
    print(f"Lendo: {INPUT_FILE}")
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        html = f.read()

    # Substitui todos os src="..." de imagens por base64
    pattern = r'src="([^"]+\.(?:png|jpg|jpeg|webp|gif|svg))"'
    result = re.sub(pattern, img_to_base64, html, flags=re.IGNORECASE)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(result)

    print(f"\nPronto! Arquivo gerado: {OUTPUT_FILE}")
    print("Abra no navegador e use Ctrl+P para salvar como PDF.")


if __name__ == "__main__":
    main()
