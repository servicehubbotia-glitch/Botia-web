# -*- coding: utf-8 -*-
"""
Script para regenerar master_kb.json a partir de todas las fichas de ingrediente.
Ejecutar en Google Colab.
"""

!pip install -q PyGithub

import os
import json
import subprocess
import sys
from pathlib import Path

# ============================================================
# CONFIGURACIÓN
# ============================================================
GITHUB_TOKEN = "AQUI_TU_TOKEN"  # ← REEMPLAZA CON TU TOKEN REAL
REPO_URL = f"https://{GITHUB_TOKEN}@github.com/servicehubbotia-glitch/Botia-web.git"
REPO_DIR = "/content/Botia-web"
GIT_USER_EMAIL = "servicehub.botia@gmail.com"
GIT_USER_NAME = "servicehubbotia-glitch"

# Archivos de ingredients a EXCLUIR (no son fichas de ingrediente)
EXCLUDED_FILES = [
    "index.html",
    "ingredient-template.html",
    "botia-webview-template.html",
    "sugar.html",
    "sweetener.html",
    "texture.html",
    "flavor.html",
    "enumbers.html",
    "halal.html",
    "haram.html",
    "mashbooh.html"
]

# Idiomas soportados (14)
LANGUAGES = ["en", "es", "ar", "de", "fr", "nl", "it", "pt", "pl", "ro", "ru", "tr", "zh", "id"]

# ============================================================
# FUNCIONES
# ============================================================

def run_git_cmd(cmd, cwd=None):
    if cwd is None:
        cwd = REPO_DIR
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"⚠️ Error ejecutando: {cmd}\n{result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def get_ingredient_slugs(repo_path):
    """Recorre ingredients/ y devuelve lista de slugs (nombres de archivo sin extensión)."""
    ing_dir = os.path.join(repo_path, "ingredients")
    if not os.path.isdir(ing_dir):
        print("❌ No se encontró el directorio ingredients/")
        sys.exit(1)

    slugs = []
    for f in os.listdir(ing_dir):
        if f.endswith(".html") and f not in EXCLUDED_FILES:
            slug = f[:-5]  # quitar .html
            slugs.append(slug)
    return sorted(slugs)

def read_ingredient_json(repo_path, slug, lang):
    """Lee i18n/{lang}/{slug}.json y devuelve el contenido como dict, o None si no existe."""
    file_path = os.path.join(repo_path, "i18n", lang, f"{slug}.json")
    if not os.path.isfile(file_path):
        return None
    with open(file_path, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            print(f"⚠️ Error al parsear {file_path}")
            return None

def build_content(data):
    """Construye el campo content concatenando los campos en orden."""
    fields = ["what_is", "why_botia", "can_1", "can_2", "cannot_1", "cannot_2"]
    parts = []
    for field in fields:
        value = data.get(field)
        if value and isinstance(value, str):
            parts.append(value.strip())
    return " ".join(parts)

def get_title(data):
    """Obtiene el título: usa 'name' si existe, si no 'title'."""
    return data.get("name") or data.get("title", "")

def get_aliases(data):
    """Obtiene el campo aliases (puede ser string o lista)."""
    aliases = data.get("aliases")
    if aliases is None:
        return ""
    if isinstance(aliases, list):
        return ", ".join(aliases)
    return str(aliases)

def main():
    # 1. Limpiar y clonar repositorio
    print("🧹 Eliminando directorio anterior (si existe)...")
    subprocess.run(["rm", "-rf", REPO_DIR], check=False)

    print(f"📦 Clonando repositorio desde {REPO_URL.replace(GITHUB_TOKEN, '***')} ...")
    run_git_cmd(f"git clone {REPO_URL} {REPO_DIR}", cwd="/content")

    os.chdir(REPO_DIR)
    run_git_cmd(f'git config user.email "{GIT_USER_EMAIL}"')
    run_git_cmd(f'git config user.name "{GIT_USER_NAME}"')

    # 2. Obtener slugs de ingredientes
    slugs = get_ingredient_slugs(REPO_DIR)
    print(f"\n📄 Encontrados {len(slugs)} ingredientes (excluyendo los listados).")

    master_kb = {}
    total_idiomas_procesados = 0

    for slug in slugs:
        print(f"\n🔍 Procesando: {slug}")
        entry = {}
        idiomas_presentes = 0

        for lang in LANGUAGES:
            data = read_ingredient_json(REPO_DIR, slug, lang)
            if data is None:
                print(f"  ⚠️ {lang}: JSON no encontrado, omitido")
                continue

            # Construir la entrada para este idioma
            title = get_title(data)
            content = build_content(data)
            aliases = get_aliases(data)

            if not title and not content:
                print(f"  ⚠️ {lang}: sin título ni contenido, omitido")
                continue

            entry[lang] = {
                "title": title,
                "content": content,
                "link": f"https://www.botia-safefood.com/ingredients/{slug}.html",
                "aliases": aliases
            }
            idiomas_presentes += 1

        if entry:
            master_kb[slug] = entry
            total_idiomas_procesados += idiomas_presentes
            print(f"  ✅ {idiomas_presentes}/{len(LANGUAGES)} idiomas incluidos")

    # 3. Guardar master_kb.json
    output_path = os.path.join(REPO_DIR, "master_kb.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(master_kb, f, ensure_ascii=False, indent=2)

    print(f"\n✅ master_kb.json generado con {len(master_kb)} ingredientes.")
    print(f"📊 Total de entradas (idioma × ingrediente): {total_idiomas_procesados}")

    # 4. Commit y push (opcional, para tenerlo en el repo)
    print("\n📦 Añadiendo master_kb.json al índice...")
    run_git_cmd("git add master_kb.json")

    # Verificar si hay cambios
    status = run_git_cmd("git status --porcelain")
    if not status:
        print("✅ No hay cambios en master_kb.json. Nada que commitear.")
    else:
        print("✏️ Creando commit...")
        commit_msg = "Regenerar master_kb.json incluyendo nuevas fichas de ingrediente"
        run_git_cmd(f'git commit -m "{commit_msg}"')

        print("\n⬇️ Haciendo git pull --rebase origin main...")
        run_git_cmd("git pull --rebase origin main")

        print("⬆️ Subiendo cambios a GitHub...")
        run_git_cmd("git push origin main")
        print("✅ Push completado con éxito.")

    print(f"\n✅ ¡Proceso finalizado! {len(master_kb)} ingredientes procesados, {total_idiomas_procesados} entradas de idioma guardadas.")
    print(f"📁 Archivo generado: {output_path}")
    print("\n➡️ Ahora puedes subir este archivo a Cloudflare KV manualmente.")

if __name__ == "__main__":
    main()
