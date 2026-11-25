$base = (Get-Location).Path
$enc = New-Object System.Text.UTF8Encoding($false)
$backend = Join-Path (Split-Path $base -Parent) "backend"

Write-Host "Base frontend : $base" -ForegroundColor DarkGray
Write-Host "Base backend  : $backend" -ForegroundColor DarkGray

# ---------- 0. Backup ----------
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backup = Join-Path (Split-Path $base -Parent) "backup_$stamp"
New-Item -ItemType Directory -Path $backup -Force | Out-Null
foreach ($f in @("src\App.jsx", "src\pages\admin\InfoModel.jsx")) {
  $src = Join-Path $base $f
  if (Test-Path $src) { Copy-Item $src (Join-Path $backup ((Split-Path $f -Leaf) + ".bak")) -Force }
}
foreach ($f in @("main.py", "services\predictor.py", "requirements.txt")) {
  $src = Join-Path $backend $f
  if (Test-Path $src) { Copy-Item $src (Join-Path $backup ((Split-Path $f -Leaf) + ".bak")) -Force }
}
Write-Host "Backup -> $backup" -ForegroundColor Yellow

# ---------- 1. models\registry.json ----------
$registryPath = Join-Path $backend "models\registry.json"
[System.IO.File]::WriteAllText($registryPath, @'
{
  "aktif": "logreg_tuned",
  "model": {
    "logreg_tuned": {
      "nama": "LogReg Tuned",
      "tipe": "sklearn",
      "path": "models/logreg_tuned.pkl",
      "f1_test": 0.7286,
      "f1_emot": 0.4142,
      "deskripsi": "Logistic Regression + TF-IDF kata & karakter"
    }
  }
}
'@, $enc)
Write-Host "[OK] registry.json" -ForegroundColor Green

# ---------- 2. services\predictor.py ----------
$predictorPath = Join-Path $backend "services\predictor.py"
[System.IO.File]::WriteAllText($predictorPath, @'
import json
import os
import joblib

LABELS = ["marah", "takut", "senang", "cinta", "netral", "sedih"]

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REGISTRY_PATH = os.path.join(_BASE, "models", "registry.json")

_loaded = {}

def _load_registry():
    with open(_REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def _load_model(nama):
    if nama in _loaded:
        return _loaded[nama]
    reg = _load_registry()
    if nama not in reg["model"]:
        raise ValueError(f"Model '{nama}' tidak ada di registry")
    info = reg["model"][nama]
    path = os.path.join(_BASE, info["path"])
    if info["tipe"] == "sklearn":
        obj = joblib.load(path)
    elif info["tipe"] == "transformer":
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        tok = AutoTokenizer.from_pretrained(path)
        mod = AutoModelForSequenceClassification.from_pretrained(path)
        mod.eval()
        obj = {"tokenizer": tok, "model": mod}
    else:
        raise ValueError(f"Tipe model tidak dikenal: {info['tipe']}")
    _loaded[nama] = obj
    return obj

def get_registry():
    reg = _load_registry()
    return {
        "aktif": reg["aktif"],
        "model": [{"id": k, **v} for k, v in reg["model"].items()],
    }

def set_aktif(nama):
    reg = _load_registry()
    if nama not in reg["model"]:
        raise ValueError(f"Model '{nama}' tidak ada")
    reg["aktif"] = nama
    with open(_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(reg, f, ensure_ascii=False, indent=2)
    return reg["aktif"]

def predict(teks, nama_model=None):
    reg = _load_registry()
    nama = nama_model or reg["aktif"]
    info = reg["model"][nama]
    obj = _load_model(nama)
    if info["tipe"] == "sklearn":
        return obj.predict_proba([teks])[0].tolist()
    import torch
    inputs = obj["tokenizer"](teks, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        logits = obj["model"](**inputs).logits
    return torch.softmax(logits, dim=-1)[0].tolist()
'@, $enc)
Write-Host "[OK] services/predictor.py" -ForegroundColor Green

# ---------- 3. Patch main.py ----------
$mainPath = Join-Path $backend "main.py"
$main = [System.IO.File]::ReadAllText($mainPath)
if ($main -notmatch "/admin/models") {
  $snippet = @'

# ===== MODEL SELECTOR (auto) =====
from services import predictor as _predictor_mod
from pydantic import BaseModel as _BM

class _SetModelBody(_BM):
    id: str

@app.get("/admin/models")
def list_models():
    return _predictor_mod.get_registry()

@app.get("/admin/models/aktif")
def get_aktif():
    return {"aktif": _predictor_mod.get_registry()["aktif"]}

@app.post("/admin/models/aktif")
def set_aktif(body: _SetModelBody):
    return {"aktif": _predictor_mod.set_aktif(body.id)}
# ===== END MODEL SELECTOR =====
'@
  [System.IO.File]::WriteAllText($mainPath, $main + $snippet, $enc)
  Write-Host "[OK] main.py dipatch (+endpoint /admin/models)" -ForegroundColor Green
} else {
  Write-Host "[SKIP] main.py sudah punya /admin/models" -ForegroundColor Yellow
}

# ---------- 4. requirements.txt ----------
$reqPath = Join-Path $backend "requirements.txt"
$req = [System.IO.File]::ReadAllText($reqPath)
$tambah = @()
foreach ($p in @("joblib","torch","transformers","safetensors")) {
  if ($req -notmatch "(?m)^\s*$p\b") { $tambah += $p }
}
if ($tambah.Count -gt 0) {
  [System.IO.File]::WriteAllText($reqPath, $req.TrimEnd() + "`n# model selector`n" + ($tambah -join "`n") + "`n", $enc)
  Write-Host ("[OK] requirements.txt (+" + ($tambah -join ", ") + ")") -ForegroundColor Green
} else {
  Write-Host "[SKIP] requirements.txt lengkap" -ForegroundColor Yellow
}

# ---------- 5. ModelSelector.jsx ----------
$selectorPath = Join-Path $base "src\pages\admin\ModelSelector.jsx"
[System.IO.File]::WriteAllText($selectorPath, @'
import { useEffect, useState } from 'react'
import { CheckCircle2, Cpu, RefreshCw } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ModelSelector() {
  const [data, setData] = useState(null)
  const [pilih, setPilih] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  async function muat() {
    setLoading(true)
    try {
      const r = await fetch(`${API}/admin/models`)
      const j = await r.json()
      setData(j)
      setPilih(j.aktif)
    } catch {
      setMsg({ tipe: 'error', isi: 'Gagal memuat daftar model' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { muat() }, [])

  async function simpan() {
    if (!pilih) return
    setSaving(true); setMsg(null)
    try {
      const r = await fetch(`${API}/admin/models/aktif`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pilih }),
      })
      if (!r.ok) throw new Error()
      setMsg({ tipe: 'ok', isi: 'Model aktif diperbarui' })
      await muat()
    } catch {
      setMsg({ tipe: 'error', isi: 'Gagal menyimpan pilihan' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-muted">Memuat…</div>
  if (!data) return <div className="p-6 text-muted">Tidak ada data model.</div>

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Pilih Model Analisis</h1>
          <p className="text-muted text-sm">Model aktif dipakai untuk semua analisis baru.</p>
        </div>
        <button onClick={muat} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 font-bold shadow-soft">
          <RefreshCw size={16} /> Muat ulang
        </button>
      </div>

      {msg && (
        <div className={`rounded-2xl px-4 py-3 text-sm font-bold ${msg.tipe === 'ok' ? 'bg-[#DFF3EA] text-[#2E8A62]' : 'bg-[#FCE4EE] text-[#C2416F]'}`}>
          {msg.isi}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {data.model.map((m) => {
          const aktif = data.aktif === m.id
          const dipilih = pilih === m.id
          return (
            <label key={m.id} className={`flex cursor-pointer items-start gap-4 rounded-[24px] bg-white p-5 shadow-soft transition ${dipilih ? 'ring-2 ring-primary' : ''}`}>
              <input type="radio" name="model" checked={dipilih} onChange={() => setPilih(m.id)} className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Cpu size={18} className="text-primary" />
                  <span className="text-lg font-black">{m.nama}</span>
                  {aktif && (
                    <span className="flex items-center gap-1 rounded-full bg-[#DFF3EA] px-2 py-0.5 text-xs font-black text-[#2E8A62]">
                      <CheckCircle2 size={12} /> aktif
                    </span>
                  )}
                </div>
                <p className="text-muted text-sm mt-0.5">{m.deskripsi}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-muted">
                  <span>F1 test: {m.f1_test ?? '—'}</span>
                  {m.f1_emot != null && <span>F1 EmoT: {m.f1_emot}</span>}
                  <span>Tipe: {m.tipe}</span>
                </div>
              </div>
            </label>
          )
        })}
      </div>

      <button onClick={simpan} disabled={saving || pilih === data.aktif}
        className="self-start rounded-full bg-primary px-6 py-3 font-black text-white shadow-button disabled:opacity-50">
        {saving ? 'Menyimpan…' : 'Simpan pilihan'}
      </button>
    </div>
  )
}
'@, $enc)
Write-Host "[OK] src/pages/admin/ModelSelector.jsx" -ForegroundColor Green

# ---------- 6. Patch App.jsx ----------
$appPath = Join-Path $base "src\App.jsx"
$app = [System.IO.File]::ReadAllText($appPath)
if ($app -notmatch "ModelSelector") {
  $app = $app -replace "(const InfoModel = lazy\(\(\) => import\('./pages/admin/InfoModel\.jsx'\)\))", "`$1`nconst ModelSelector = lazy(() => import('./pages/admin/ModelSelector.jsx'))"
  $app = $app -replace "(<Route path=""model"" element=\{<InfoModel />\} />)", "`$1`n            <Route path=""model/pilih"" element={<ModelSelector />} />"
  [System.IO.File]::WriteAllText($appPath, $app, $enc)
  Write-Host "[OK] App.jsx dipatch (+route /admin/model/pilih)" -ForegroundColor Green
} else {
  Write-Host "[SKIP] App.jsx sudah punya ModelSelector" -ForegroundColor Yellow
}

# ---------- 7. Verifikasi ----------
Write-Host ""
Write-Host "=== APP.JSX (bagian admin) ===" -ForegroundColor Cyan
Get-Content $appPath | Select-String "admin|ModelSelector|InfoModel"
Write-Host ""
Write-Host "=== REGISTRY ===" -ForegroundColor Cyan
Get-Content $registryPath

# ---------- 8. Jalankan backend & frontend ----------
Write-Host ""
Write-Host "=== MENJALANKAN BACKEND ===" -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backend'; if (Test-Path .venv\Scripts\Activate.ps1) { . .venv\Scripts\Activate.ps1 }; uvicorn main:app --reload"

Write-Host "=== MENJALANKAN FRONTEND ===" -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$base'; npm run dev"

Write-Host ""
Write-Host "Selesai. Dua jendela PowerShell baru dibuka:" -ForegroundColor Green
Write-Host "  - backend  : http://localhost:8000" -ForegroundColor Green
Write-Host "  - frontend : http://localhost:5173" -ForegroundColor Green
Write-Host "Buka: http://localhost:5173/admin/model/pilih (login admin dulu)" -ForegroundColor Green