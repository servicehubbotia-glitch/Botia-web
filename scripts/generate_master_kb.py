# -*- coding: utf-8 -*-
"""
Script para regenerar master_kb.json a partir de todas las fichas de ingrediente.
Ejecutar en Google Colab.
"""
# ADVERTENCIA: el archivo que genera este script NO debe editarse a mano.
# Cualquier correccion se hace aqui, en el generador, y luego se regenera.

import os
import json
import subprocess
import sys
from pathlib import Path

# ============================================================
# CONFIGURACIÓN
# ============================================================
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

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

def cargar_ui_labels():
    """Carga i18n/ui_labels.json y devuelve los rótulos por idioma."""
    ui_path = Path(REPO_DIR) / "i18n" / "ui_labels.json"
    if not ui_path.exists():
        print("⚠️ No se encontró i18n/ui_labels.json. Se usarán rótulos en inglés por defecto.")
        return None
    with open(ui_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Eliminar _meta
    data.pop("_meta", None)
    return data

def get_labels(lang, ui_labels):
    """Devuelve los rótulos para un idioma, con fallback al inglés si falta alguno."""
    if ui_labels is None:
        # Fallback a inglés si no hay archivo
        return {
            "what_is": "What it is",
            "why_botia": "Why BOTIA flags it",
            "can": "BOTIA CAN",
            "cannot_do": "BOTIA CANNOT"
        }
    # Intentar obtener el idioma, si no existe usar inglés
    labels = ui_labels.get(lang)
    if labels is None:
        labels = ui_labels.get("en", {})
    # Asegurar que todas las claves existen
    default = {"what_is": "What it is", "why_botia": "Why BOTIA flags it", "can": "BOTIA CAN", "cannot_do": "BOTIA CANNOT"}
    for key in default:
        if key not in labels or not labels[key]:
            labels[key] = default[key]
    return labels

def get_ingredient_slugs(repo_path):
    """Use the curated public ingredient index; never include auxiliary WebViews."""
    index_path = Path(repo_path) / "i18n" / "en" / "ingredient_index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    slugs = [record["slug"] for record in index["ingredients"]]
    if len(slugs) != len(set(slugs)):
        raise ValueError("Duplicate ingredient slugs")
    for slug in slugs:
        if not (Path(repo_path) / "ingredients" / f"{slug}.html").is_file():
            raise FileNotFoundError(slug)
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

def numbered_fields(data, prefix):
    return sorted(int(key.split("_")[1]) for key in data
                  if key.startswith(prefix + "_") and key.split("_")[1].isdigit())

def generate_local(repo_path):
    """Regenerate locally, without cloning, committing, pushing or uploading KV."""
    repo_path = Path(repo_path)
    ui_path = repo_path / "i18n" / "ui_labels.json"
    ui = json.loads(ui_path.read_text(encoding="utf-8"))
    master = {}
    for slug in get_ingredient_slugs(repo_path):
        master[slug] = {}
        for lang in LANGUAGES:
            data = read_ingredient_json(repo_path, slug, lang)
            if not data:
                raise ValueError(f"Missing or invalid {lang}/{slug}.json")
            entry = {"title": get_title(data), "what_is": data.get("what_is", ""),
                     "why_botia": data.get("why_botia", ""),
                     "content": build_content(data, lang, ui),
                     "link": f"https://www.botia-safefood.com/ingredients/{slug}.html",
                     "aliases": get_aliases(data)}
            for prefix in ["can", "cannot"]:
                for i in sorted(set([1, 2, 3] + numbered_fields(data, prefix))):
                    entry[f"{prefix}_{i}"] = data.get(f"{prefix}_{i}", "")
            master[slug][lang] = entry
    output = repo_path / "master_kb.json"
    output.write_text(json.dumps(master, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Generated {len(master)} profiles × {len(LANGUAGES)} languages; KV upload is separate.")

def build_content(data, lang, ui_labels):
    """
    Construye el campo content con rótulos y formato de lista.
    Omite líneas si el campo de contenido está vacío.
    """
    labels = get_labels(lang, ui_labels)
    parts = []

    # what_is
    if data.get("what_is"):
        parts.append(f"{labels['what_is']}: {data['what_is']}")

    # why_botia
    if data.get("why_botia"):
        parts.append(f"{labels['why_botia']}: {data['why_botia']}")

    # can (lista)
    can_items = []
    for i in numbered_fields(data, "can"):
        val = data.get(f"can_{i}")
        if val:
            can_items.append(f"- {val}")
    if can_items:
        parts.append(f"{labels['can']}:")
        parts.extend(can_items)

    # cannot_do (lista)
    cannot_items = []
    for i in numbered_fields(data, "cannot"):
        val = data.get(f"cannot_{i}")
        if val:
            cannot_items.append(f"- {val}")
    if cannot_items:
        parts.append(f"{labels['cannot_do']}:")
        parts.extend(cannot_items)

    return "\n".join(parts)

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
    if not GITHUB_TOKEN:
        raise RuntimeError("GITHUB_TOKEN required for remote mode; use --local-root for local generation")
    # 1. Limpiar y clonar repositorio
    print("🧹 Eliminando directorio anterior (si existe)...")
    subprocess.run(["rm", "-rf", REPO_DIR], check=False)

    print(f"📦 Clonando repositorio desde {REPO_URL.replace(GITHUB_TOKEN, '***')} ...")
    run_git_cmd(f"git clone {REPO_URL} {REPO_DIR}", cwd="/content")

    os.chdir(REPO_DIR)
    run_git_cmd(f'git config user.email "{GIT_USER_EMAIL}"')
    run_git_cmd(f'git config user.name "{GIT_USER_NAME}"')

    # 2. Cargar rótulos de UI
    ui_labels = cargar_ui_labels()
    if ui_labels:
        print("✅ Rótulos de UI cargados correctamente.")
    else:
        print("⚠️ No se encontró i18n/ui_labels.json. Se usarán rótulos en inglés por defecto.")

    # 3. Obtener slugs de ingredientes
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
            content = build_content(data, lang, ui_labels)
            aliases = get_aliases(data)

            if not title and not content:
                print(f"  ⚠️ {lang}: sin título ni contenido, omitido")
                continue

            # Construir el objeto con campos estructurados
            lang_entry = {
                "title": title,
                "what_is": data.get("what_is", ""),
                "why_botia": data.get("why_botia", ""),
                "can_1": data.get("can_1", ""),
                "can_2": data.get("can_2", ""),
                "can_3": data.get("can_3", ""),
                "cannot_1": data.get("cannot_1", ""),
                "cannot_2": data.get("cannot_2", ""),
                "cannot_3": data.get("cannot_3", ""),
                "content": content,
                "link": f"https://www.botia-safefood.com/ingredients/{slug}.html",
                "aliases": aliases
            }

            for prefix in ["can", "cannot"]:
                for i in numbered_fields(data, prefix):
                    lang_entry[f"{prefix}_{i}"] = data[f"{prefix}_{i}"]
            entry[lang] = lang_entry
            idiomas_presentes += 1

        if entry:
            master_kb[slug] = entry
            total_idiomas_procesados += idiomas_presentes
            print(f"  ✅ {idiomas_presentes}/{len(LANGUAGES)} idiomas incluidos")

    # 4. Guardar master_kb.json
    output_path = os.path.join(REPO_DIR, "master_kb.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(master_kb, f, ensure_ascii=False, indent=2)

    print(f"\n✅ master_kb.json generado con {len(master_kb)} ingredientes.")
    print(f"📊 Total de entradas (idioma × ingrediente): {total_idiomas_procesados}")

    # 5. Commit y push (opcional, para tenerlo en el repo)
    print("\n📦 Añadiendo master_kb.json al índice...")
    run_git_cmd("git add master_kb.json")

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
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--local-root", type=Path)
    args = parser.parse_args()
    if args.local_root:
        generate_local(args.local_root)
    else:
        main()
