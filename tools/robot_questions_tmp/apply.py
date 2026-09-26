#!/usr/bin/env python3
from pathlib import Path
import json, runpy, re, shutil, unicodedata, sys

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / "tools" / "robot_questions_tmp"
LANGS = ["ar","de","en","es","fr","id","it","nl","pl","pt","ro","ru","tr","zh"]
PAGE_MODULE = {
    "E-numbers":"enumbers","Flavor":"flavor","Halal":"halal","Haram":"haram",
    "Mashbooh":"mashbooh","Nutrition facts":"nutrition","Sweetener":"sweetener",
    "Texture":"texture","Traceability":"traceability","Endocrine disruptors":"endocrine-disruptors",
    "Packaging migrants":"packaging-migrants","Woman cards":"woman_cards",
    "Woman SafeFood":"woman_safefood","Sugar":"sugar",
}
OVERRIDES = {
    "Arabic gum":"arabic_gum","Aspartame-acesulfame salt":"aspartame_acesulfame_salt",
    "Brominated vegetable oil":"brominated_vegetable_oil","Dioxins / PCBs":"dioxins_pcbs",
    "E171 / titanium dioxide":"e171","L-cysteine / E920":"l_cysteine",
    "Nitrites / nitrates":"nitrites_nitrates","Omega-3":"omega_3",
    "Ponceau 4R":"ponceau_4r","Shellac / E904":"shellac",
    "Natural flavourings":"natural_flavourings","Smoke flavourings":"smoke_flavourings",
    "Caramel colours":"caramel_colours",
}

def fail(msg):
    print("ERROR:", msg, file=sys.stderr)
    raise SystemExit(1)

def slugify(name):
    s = name.lower()
    s = re.sub(r"\s*/\s*.*$", "", s)
    s = re.sub(r"\s*\([^)]*\)", "", s)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    s = s.replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", "_", s).strip("_")
    return s

def parse_spanish_bank(path):
    text = path.read_text(encoding="utf-8")
    matches = list(re.finditer(r"^#\s+(\d+)\s+·\s+(.+?)\s*$", text, flags=re.M))
    entries = []
    for i, m in enumerate(matches):
        num = int(m.group(1))
        if not (1 <= num <= 143):
            continue
        name = m.group(2).strip()
        start = m.end()
        end = matches[i+1].start() if i+1 < len(matches) else len(text)
        block = text[start:end]
        qs = [q.group(1).strip() for q in re.finditer(r"^\s*\d+\.\s+(.+?)\s*$", block, flags=re.M)]
        entries.append((num, name, qs))
    if len(entries) != 143:
        fail(f"Spanish bank has {len(entries)} entries, expected 143")
    return entries

def load_translations():
    merged = {}
    for fn in ["zh_id.py","ru_tr.py","ro_pl.py","de_nl.py","it_pt.py","en_fr.py","ar.py"]:
        data = runpy.run_path(str(TMP / fn)).get("ROBOT_QUESTIONS")
        if not isinstance(data, dict):
            fail(f"{fn}: ROBOT_QUESTIONS missing")
        for lang, payload in data.items():
            if lang in merged:
                fail(f"Duplicate language {lang}")
            merged[lang] = payload
    expected = set(LANGS) - {"es"}
    if set(merged) != expected:
        fail(f"Languages mismatch: have {sorted(merged)}, expected {sorted(expected)}")
    return merged

index = json.loads((ROOT/"i18n"/"es"/"ingredient_index.json").read_text(encoding="utf-8"))
canonical = {x["slug"] for x in index["ingredients"]}

es = {}
for _, name, questions in parse_spanish_bank(TMP/"es_bank.md"):
    if name in PAGE_MODULE:
        key = PAGE_MODULE[name]
    else:
        key = OVERRIDES.get(name, slugify(name))
        if key not in canonical:
            fail(f"Spanish mapping failed: {name} -> {key}")
    if key in es:
        fail(f"Duplicate Spanish key {key}")
    if not questions:
        fail(f"No Spanish questions for {name}")
    es[key] = questions

if len(es) != 143:
    fail(f"Spanish mapped keys: {len(es)}, expected 143")

all_q = load_translations()
all_q["es"] = es
ref_keys = set(es)

for lang in LANGS:
    payload = all_q[lang]
    if set(payload) != ref_keys:
        fail(f"{lang}: key mismatch")
    for key in ref_keys:
        qs = payload[key]
        if not isinstance(qs, list):
            fail(f"{lang}/{key}: not a list")
        if len(qs) != len(es[key]):
            fail(f"{lang}/{key}: {len(qs)} questions, Spanish has {len(es[key])}")
        if any((not isinstance(q, str) or not q.strip()) for q in qs):
            fail(f"{lang}/{key}: empty question")

targets = []
for lang in LANGS:
    for key in sorted(ref_keys):
        path = ROOT/"i18n"/lang/f"{key}.json"
        if not path.exists():
            fail(f"Missing destination: {path.relative_to(ROOT)}")
        try:
            obj = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            fail(f"Invalid JSON {path.relative_to(ROOT)}: {e}")
        if not isinstance(obj, dict):
            fail(f"Destination is not object: {path.relative_to(ROOT)}")
        targets.append((lang, key, path, obj))

if len(targets) != 2002:
    fail(f"Target count {len(targets)}, expected 2002")

changed = 0
for lang, key, path, obj in targets:
    qs = all_q[lang][key]
    if obj.get("robot_questions") == qs:
        continue
    obj["robot_questions"] = qs
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    changed += 1

# Post-write validation
for lang, key, path, _ in targets:
    obj = json.loads(path.read_text(encoding="utf-8"))
    if obj.get("robot_questions") != all_q[lang][key]:
        fail(f"Post-write mismatch: {path.relative_to(ROOT)}")

print(f"OK: 14 languages, 143 entries/language, 2002 destinations, {changed} files changed.")

# Clean temporary deployment files, including this script and workflow.
workflow = ROOT/".github"/"workflows"/"botia-robot-questions-deploy.yml"
if workflow.exists():
    workflow.unlink()
if TMP.exists():
    shutil.rmtree(TMP)
