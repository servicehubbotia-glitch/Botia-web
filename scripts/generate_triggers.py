# -*- coding: utf-8 -*-
"""
Script para generar triggers-master.json desde i18n/en/*.json.
Ejecutar en Google Colab.

ADVERTENCIA: el archivo que genera este script NO debe editarse a mano.
Cualquier correccion se hace aqui, en el generador, y luego se regenera.
"""

import os
import json
import subprocess
import sys
from pathlib import Path
import re
from getpass import getpass

# ============================================================
# CONFIGURACIÓN
# ============================================================
REPO_URL_BASE = "https://github.com/servicehubbotia-glitch/Botia-web.git"
REPO_DIR = Path("/content/Botia-web-upload")
BRANCH = "main"
COMMIT_MESSAGE = "Generar triggers-master.json desde fichas i18n/en/*.json"

# Slugs a excluir (ninguno, ahora se incluyen todos)
EXCLUDED_SLUGS = []  # <--- VACIADO

# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def run_cmd(cmd, cwd=None, capture=True):
    """Ejecuta un comando y devuelve la salida."""
    result = subprocess.run(cmd, cwd=cwd, text=True, capture_output=capture, shell=True)
    if result.returncode != 0:
        if capture:
            print(f"⚠️ Error ejecutando: {cmd}\n{result.stderr}")
        else:
            print(f"⚠️ Error ejecutando: {cmd}")
        sys.exit(1)
    return result.stdout.strip() if capture else result

def read_json(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)

def write_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def parse_aliases(aliases_str):
    """Convierte una cadena de alias separada por comas en una lista sin duplicados, conservando orden.
    No corta en comas internas de nombres quimicos (por ejemplo, "2,6-di-tert-butyl-p-cresol").
    """
    if aliases_str is None:
        return []
    if isinstance(aliases_str, list):
        cleaned = [str(x).strip() for x in aliases_str if x]
        seen = set()
        result = []
        for item in cleaned:
            if item and item not in seen:
                seen.add(item)
                result.append(item)
        return result
    # Solo cortar en comas seguidas de espacio o de un carácter no dígito
    parts = [p.strip() for p in re.split(r",(?=\s)|,(?=[^\d\s])", aliases_str) if p.strip()]
    seen = set()
    result = []
    for p in parts:
        if p not in seen:
            seen.add(p)
            result.append(p)
    return result

# ============================================================
# FLUJO PRINCIPAL
# ============================================================

def main():
    print("=" * 72)
    print("BOTIA — GENERAR TRIGGERS-MASTER.JSON")
    print("=" * 72)
    print("Este script genera triggers-master.json desde i18n/en/*.json")
    print("ADVERTENCIA: NO editar triggers-master.json a mano.")
    print("=" * 72)

    # 1. Pedir token
    github_token = getpass("GitHub token: ").strip()
    if not github_token:
        print("❌ No se introdujo token. Proceso cancelado.")
        return

    # 2. Clonar repositorio
    if REPO_DIR.exists():
        import shutil
        shutil.rmtree(REPO_DIR)

    repo_url = f"https://{github_token}@github.com/servicehubbotia-glitch/Botia-web.git"
    run_cmd(f"git clone {repo_url} {REPO_DIR}", cwd="/content", capture=False)

    os.chdir(REPO_DIR)
    run_cmd('git config user.email "servicehub.botia@gmail.com"', capture=False)
    run_cmd('git config user.name "servicehubbotia-glitch"', capture=False)

    print("\n🔄 Generando triggers-master.json desde fichas...\n")

    # 3. Leer índice de ingredientes
    index_path = REPO_DIR / "i18n" / "en" / "ingredient_index.json"
    if not index_path.exists():
        print("❌ No se encontró i18n/en/ingredient_index.json")
        return

    index_data = read_json(index_path)
    slugs = [entry.get("slug") for entry in index_data.get("ingredients", []) if entry.get("slug")]
    print(f"📄 Encontrados {len(slugs)} slugs en el índice.")

    triggers = {}
    slugs_sin_json = []
    slugs_con_aliases_vacios = []
    slugs_con_layers_vacios = []

    for slug in slugs:
        if slug in EXCLUDED_SLUGS:
            continue

        json_path = REPO_DIR / "i18n" / "en" / f"{slug}.json"
        if not json_path.exists():
            slugs_sin_json.append(slug)
            continue

        try:
            data = read_json(json_path)
        except Exception as e:
            print(f"  ⚠️ Error al leer {slug}.json: {e}")
            continue

        name = data.get("name")
        if not name:
            print(f"  ⚠️ {slug}.json no tiene campo 'name'")

        e_code = data.get("e_code")
        aliases_raw = data.get("aliases")
        aliases_list = parse_aliases(aliases_raw)
        layers = data.get("layers")
        if not isinstance(layers, list):
            layers = []

        if not aliases_list:
            slugs_con_aliases_vacios.append(slug)
        if not layers:
            slugs_con_layers_vacios.append(slug)

        triggers[slug] = {
            "common_name": name,
            "technical_name": name,
            "e_code": e_code,
            "aliases": aliases_list,
            "layers": layers
        }

    # 4. Construir el JSON final
    meta = {
        "file": "triggers-master.json",
        "version": "2.0",
        "last_updated": "2026-08-13",
        "generated_from": "i18n/en/*.json",
        "total_triggers": len(triggers)
    }

    output_data = {
        "_meta": meta,
        "triggers": triggers
    }

    # 5. Escribir archivo
    output_path = REPO_DIR / "triggers-master.json"
    write_json(output_path, output_data)
    print(f"\n✅ triggers-master.json generado con {len(triggers)} triggers.")

    # 6. Informe
    print("\n📊 INFORME DE GENERACIÓN")
    print(f"Total de triggers: {len(triggers)}")
    if slugs_sin_json:
        print(f"⚠️ Slugs del índice sin archivo JSON: {len(slugs_sin_json)}")
        for s in slugs_sin_json:
            print(f"  - {s}")
    else:
        print("✅ Todos los slugs del índice tienen archivo JSON.")

    if slugs_con_aliases_vacios:
        print(f"⚠️ Triggers con aliases vacíos: {len(slugs_con_aliases_vacios)}")
        for s in slugs_con_aliases_vacios:
            print(f"  - {s}")
    else:
        print("✅ Todos los triggers tienen aliases no vacíos.")

    if slugs_con_layers_vacios:
        print(f"⚠️ Triggers con layers vacíos: {len(slugs_con_layers_vacios)}")
        for s in slugs_con_layers_vacios:
            print(f"  - {s}")
    else:
        print("✅ Todos los triggers tienen layers no vacíos.")

    print(f"\n📝 Slugs excluidos (ninguno): {len(EXCLUDED_SLUGS)}")

    # 7. Commit y push
    print("\n📦 Añadiendo triggers-master.json al índice...")
    run_cmd("git add triggers-master.json", capture=False)

    status = run_cmd("git status --porcelain")
    if not status:
        print("✅ No hay cambios en triggers-master.json. Nada que commitear.")
        return

    print("✏️ Creando commit...")
    run_cmd(f'git commit -m "{COMMIT_MESSAGE}"', capture=False)

    print("\n⬇️ Haciendo git pull --rebase origin main...")
    run_cmd("git pull --rebase origin main", capture=False)

    print("⬆️ Subiendo cambios a GitHub...")
    run_cmd("git push origin main", capture=False)

    commit_sha = run_cmd("git rev-parse HEAD")
    print("\n" + "=" * 72)
    print("✅ ¡Proceso completado!")
    print(f"Commit: {commit_sha}")
    print(f"Archivo generado: triggers-master.json ({len(triggers)} triggers)")
    print("=" * 72)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
