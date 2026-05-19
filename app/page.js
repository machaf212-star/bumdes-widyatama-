'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const ROLES = {
  admin: { label: 'Admin', c: '#7c3aed', bg: '#ede9fe', tabs: ['dash','input','kasir','keluar','laporan','hist','setting'] },
  abk:   { label: 'ABK',   c: '#15803d', bg: '#dcfce7', tabs: ['dash','input','kasir','keluar','hist'] },
}
const KATS = [
  { id: 'pakan',  label: 'Pakan',        ic: '🌾', c: '#15803d' },
  { id: 'obat',   label: 'Obat/Vaksin',  ic: '💊', c: '#dc2626' },
  { id: 'listrik',label: 'Listrik/Air',  ic: '⚡', c: '#d97706' },
  { id: 'gaji',   label: 'Gaji',         ic: '👤', c: '#0284c7' },
  { id: 'pemel',  label: 'Pemeliharaan', ic: '🔧', c: '#7c3aed' },
  { id: 'lain',   label: 'Lain-lain',    ic: '📦', c: '#6b7280' },
]
const SHU = [
  { l: 'Reinvestasi', p: 25, c: '#16a34a' },
  { l: 'PADes',       p: 25, c: '#0284c7' },
  { l: 'Cadangan',    p: 15, c: '#7c3aed' },
  { l: 'Manajemen',   p: 30, c: '#d97706' },
  { l: 'Sosial/CSR',  p:  5, c: '#db2777' },
]
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
const PAY_METHODS = [
  { id: 'tunai',    label: 'Tunai',    ic: '💵' },
  { id: 'tempo',    label: 'Tempo',    ic: '🕐' },
  { id: 'transfer', label: 'Transfer', ic: '🏦' },
  { id: 'qris',     label: 'QRIS',     ic: '📱' },
]

const rp  = n => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID')
const f1  = n => (+(n || 0)).toFixed(1)
const tod = () => new Date().toISOString().slice(0, 10)
const katOf = id => KATS.find(k => k.id === id) || KATS[0]

// ─── STYLES ──────────────────────────────────────────────────────────────────
const S = {
  wrap:    { fontFamily: 'system-ui,sans-serif', background: '#f3f4f6', minHeight: '100vh', maxWidth: 430, margin: '0 auto', position: 'relative' },
  topbar:  { background: '#15803d', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
  page:    { padding: '10px 12px 74px' },
  card:    { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e7eb', padding: '12px 14px', marginBottom: 8 },
  g2:      { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 },
  g3:      { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 6 },
  stat:    { background: '#f9fafb', borderRadius: 8, padding: '10px 12px' },
  sec:     { fontSize: 10, fontWeight: 600, color: '#15803d', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 },
  lbl:     { fontSize: 11, color: '#6b7280', fontWeight: 500, display: 'block', marginBottom: 3, marginTop: 7 },
  inp:     { width: '100%', borderRadius: 8, border: '0.5px solid #d1d5db', padding: '8px 10px', fontSize: 12, background: '#fff', color: '#111', fontFamily: 'inherit', boxSizing: 'border-box' },
  sel:     { width: '100%', borderRadius: 8, border: '0.5px solid #d1d5db', padding: '8px 10px', fontSize: 12, background: '#fff', color: '#111', fontFamily: 'inherit', boxSizing: 'border-box' },
  btnGrn:  { background: '#15803d', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', marginTop: 8, fontFamily: 'inherit' },
  btnSm:   { border: '0.5px solid #d1d5db', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 500, cursor: 'pointer', background: '#f9fafb', color: '#374151', fontFamily: 'inherit' },
  botnav:  { background: '#fff', borderTop: '0.5px solid #e5e7eb', display: 'flex', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, zIndex: 10 },
  nbtn:    (on) => ({ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', background: 'none', border: 'none', fontSize: 8, padding: '6px 2px', color: on ? '#15803d' : '#6b7280', fontWeight: on ? 600 : 400, fontFamily: 'inherit' }),
  tag:     { borderRadius: 4, padding: '2px 7px', fontSize: 10, fontWeight: 500, display: 'inline-block' },
  bar:     { background: '#e5e7eb', borderRadius: 99, height: 5, marginTop: 4 },
  notif:   (err) => ({ position: 'fixed', top: 62, left: '50%', transform: 'translateX(-50%)', zIndex: 100, borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#fff', background: err ? '#dc2626' : '#15803d', whiteSpace: 'nowrap', maxWidth: '90%' }),
  loginWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#f3f4f6' },
  pakanBox:  { background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '11px 13px', marginBottom: 10 },
  rg:        { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 5, maxHeight: 320, overflowY: 'auto' },
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  // ── AUTH ──
  const [user,      setUser]      = useState(null)
  const [loginForm, setLoginForm] = useState({ u: '', p: '' })
  const [loginErr,  setLoginErr]  = useState('')

  // ── NAVIGATION ──
  const [tab, setTab] = useState('dash')
  const [kd,  setKd]  = useState('A')
  const [focR, setFocR] = useState(0)

  // ── CONFIG (dari Supabase tabel config) ──
  const [cfg, setCfg] = useState({
    nama_bumdes: 'BUMDes Widyatama',
    desa: 'Desa Kaligowong',
    kecamatan: 'Kec. Wadaslintang',
    kabupaten: 'Kab. Wonosobo',
    pop_a: 500, pop_b: 362,
    pakan_a: 200, pakan_b: 150,
    kas: 5000000, stok_kg: 0, stok_butir: 0,
    modal_awal: 0,  // modal/saldo awal sebelum aplikasi dipakai
  })

  // ── DATA LOGS ──
  const [users,       setUsers]       = useState([])
  const [hlog,        setHlog]        = useState([])
  const [slog,        setSlog]        = useState([])
  const [elog,        setElog]        = useState([])
  const [piutang,     setPiutang]     = useState([])
  const [pelanggan,   setPelanggan]   = useState([])
  const [pakanHarian, setPakanHarian] = useState([]) // log pakan harian pagi/sore

  // ── FORM DRAFTS ──
  const [hdA, setHdA] = useState({ kg: '', km: '', rusak: '' })
  const [hdB, setHdB] = useState({ kg: '', km: '', rusak: '' })
  const [hd,  setHd]  = useState({ pakanAPagi: '', pakanASore: '', pakanBPagi: '', pakanBSore: '' })
  const [td,  setTd]  = useState({ kg: '', harga: '25000', nama: '', alamat: '', hp: '', metode: 'tunai', bank: '', norek: '', tempo: '' })
  const [ed,  setEd]  = useState({ kat: 'pakan', tgl: tod(), jml: '', ket: '', qty: '', kdPakan: 'A' })
  const [nu,  setNu]  = useState({ nama: '', username: '', password: '', role: 'abk' })

  // ── UI STATE ──
  const [notif,       setNotif]       = useState(null)
  const [receipt,     setReceipt]     = useState(null)
  const [rooms,       setRooms]       = useState({ A: new Array(250).fill(null), B: new Array(181).fill(null) })
  const [loading,     setLoading]     = useState(true)
  const [hf,          setHf]          = useState('all')
  const [tabelKd,     setTabelKd]     = useState('all')
  const [ef,          setEf]          = useState('all')
  const [accordion,   setAccordion]   = useState({ A: false, B: false, pakan: false })
  const [localCfg,    setLocalCfg]    = useState(null)
  const [rekapPopup,  setRekapPopup]  = useState(null)
  const [waPopup,     setWaPopup]     = useState(null)

  const txRef = useRef(1000)
  const exRef = useRef(1)

  // ── NOTIFY ──
  const notify = useCallback((msg, err = false) => {
    setNotif({ msg, err })
    setTimeout(() => setNotif(null), 3200)
  }, [])

  // ── LOAD DATA FROM SUPABASE ──
  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      // Config
      const { data: cfgData } = await supabase.from('config').select('*')
      if (cfgData && cfgData.length > 0) {
        const cfgMap = {}
        cfgData.forEach(row => { cfgMap[row.key] = row.value })
        setCfg(prev => ({
          ...prev,
          nama_bumdes: cfgMap.nama_bumdes || prev.nama_bumdes,
          desa:        cfgMap.desa        || prev.desa,
          kecamatan:   cfgMap.kecamatan   || prev.kecamatan,
          kabupaten:   cfgMap.kabupaten   || prev.kabupaten,
          pop_a:       parseInt(cfgMap.pop_a)    || prev.pop_a,
          pop_b:       parseInt(cfgMap.pop_b)    || prev.pop_b,
          pakan_a:     parseFloat(cfgMap.pakan_a) || prev.pakan_a,
          pakan_b:     parseFloat(cfgMap.pakan_b) || prev.pakan_b,
          kas:         parseFloat(cfgMap.kas)     || prev.kas,
          stok_kg:     parseFloat(cfgMap.stok_kg) || 0,
          stok_butir:  parseInt(cfgMap.stok_butir) || 0,
          modal_awal:  parseFloat(cfgMap.modal_awal) || 0,
        }))
      }

      // Users
      const { data: usersData } = await supabase.from('users').select('*').order('created_at')
      if (usersData) setUsers(usersData)

      // Panen
      const { data: panenData } = await supabase.from('panen').select('*').order('created_at', { ascending: false })
      if (panenData) {
        setHlog(panenData.map(p => ({
          id: p.id, tgl: new Date(p.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
          tgl2: p.tanggal, kd: p.kandang, tb: p.total_butir, kg: p.total_kg,
          hdp: p.hdp, km: p.kematian,
          rusak: p.telur_rusak || 0,
          pakanA: p.pakan_a || 0, pakanB: p.pakan_b || 0,
          pakanAPagi: p.pakan_a_pagi || 0, pakanASore: p.pakan_a_sore || 0,
          pakanBPagi: p.pakan_b_pagi || 0, pakanBSore: p.pakan_b_sore || 0,
          roomDetail: (() => { try { return p.room_detail ? JSON.parse(p.room_detail) : null } catch(e) { return null } })(),
          by: p.dicatat_oleh,
        })))
      }

      // Penjualan
      const { data: jualData } = await supabase.from('penjualan').select('*').order('created_at', { ascending: false })
      if (jualData) {
        setSlog(jualData.map(t => ({
          id: t.id, no: t.no_transaksi, tgl: new Date(t.created_at).toLocaleString('id-ID'),
          tgl2: t.tanggal, kg: t.kg, harga: t.harga, total: t.total,
          nama: t.nama_pembeli, alamat: t.alamat, hp: t.hp,
          metode: t.metode, bank: t.bank, norek: t.no_rekening,
          tempo: t.tempo, lunas: t.lunas, by: t.dicatat_oleh,
        })))
        setPiutang(jualData.filter(t => !t.lunas).map(t => ({
          id: t.id, no: t.no_transaksi, tgl: new Date(t.created_at).toLocaleString('id-ID'),
          kg: t.kg, total: t.total, nama: t.nama_pembeli, tempo: t.tempo,
        })))
        if (jualData.length > 0) txRef.current = 1000 + jualData.length
      }

      // Pengeluaran
      const { data: keluarData } = await supabase.from('pengeluaran').select('*').order('created_at', { ascending: false })
      if (keluarData) {
        setElog(keluarData.map(e => ({
          id: e.id, no: e.no_exp, kat: e.kategori, tgl: e.tanggal,
          jml: e.jumlah, ket: e.keterangan, qty: e.qty_pakan,
          kdPakan: e.kandang_pakan, by: e.dicatat_oleh,
        })))
        if (keluarData.length > 0) exRef.current = 1 + keluarData.length
      }

      // Pelanggan langganan
      const { data: plgData } = await supabase.from('pelanggan').select('*').order('nama')
      if (plgData) setPelanggan(plgData)

      // Pakan harian
      const { data: pakanData } = await supabase.from('pakan_harian').select('*').order('created_at', { ascending: false })
      if (pakanData) setPakanHarian(pakanData)
    } catch (err) {
      notify('Gagal memuat data. Cek koneksi internet.', true)
    }
    setLoading(false)
  }

  // ── UPDATE CONFIG KE SUPABASE ──
  async function saveCfg(key, value) {
    await supabase.from('config').upsert({ key, value: String(value) }, { onConflict: 'key' })
  }

  // ── SIMPAN PELANGGAN ──
  async function simpanPelanggan(nama, alamat, hp) {
    if (!nama.trim()) return
    const exists = pelanggan.find(p => p.nama.toLowerCase() === nama.toLowerCase())
    if (exists) return // sudah ada
    try {
      const { data, error } = await supabase.from('pelanggan').insert({ nama, alamat, hp }).select().single()
      if (error) throw error
      setPelanggan(prev => [...prev, data].sort((a,b) => a.nama.localeCompare(b.nama)))
    } catch(e) { console.error(e) }
  }

  async function hapusPelanggan(id) {
    await supabase.from('pelanggan').delete().eq('id', id)
    setPelanggan(prev => prev.filter(p => p.id !== id))
  }

  // ── STATE PRINT POPUP ──
  const [printPopup, setPrintPopup] = useState(null) // {html, title}

  // ── STRUK PENJUALAN — PRINT & WA ──
  function printStruk(tx) {
    const pm = PAY_METHODS.find(p => p.id === tx.metode)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;width:100%;padding:4mm;color:#000}
.c{text-align:center}.b{font-weight:bold}.lg{font-size:14px}
hr{border:none;border-top:1px dashed #000;margin:5px 0}
.row{display:flex;justify-content:space-between;margin-bottom:2px}
.tot{font-size:16px;font-weight:bold}
</style></head><body>
<div class="c b lg">${cfg.nama_bumdes}</div>
<div class="c" style="font-size:11px">${cfg.desa}, ${cfg.kecamatan}, ${cfg.kabupaten}</div>
<div class="c" style="font-size:11px">Telur Ayam Petelur Segar</div>
<hr>
<div class="row"><span>No.</span><span>${tx.no}</span></div>
<div class="row"><span>Tanggal</span><span style="font-size:10px">${tx.tgl}</span></div>
<div class="row"><span>Kasir</span><span>${tx.by}</span></div>
<div class="row"><span>Pelanggan</span><span>${tx.nama}</span></div>
${tx.alamat ? `<div class="row"><span>Alamat</span><span style="max-width:55%;text-align:right">${tx.alamat}</span></div>` : ''}
${tx.hp ? `<div class="row"><span>No. HP</span><span>${tx.hp}</span></div>` : ''}
<div class="row"><span>Metode</span><span>${pm ? pm.label : tx.metode}</span></div>
${tx.metode==='transfer' ? `<div class="row"><span>Bank</span><span>${tx.bank}(${tx.norek})</span></div>` : ''}
${tx.metode==='tempo' ? `<div class="row"><span>J. Tempo</span><span>${tx.tempo}</span></div>` : ''}
<hr>
<div class="row"><span>Telur Ayam</span><span>${tx.kg}kg x ${rp(tx.harga)}</span></div>
<hr>
<div class="row tot"><span>TOTAL</span><span>${rp(tx.total)}</span></div>
<hr>
${tx.metode==='tempo' ? '<div class="c b" style="color:red;font-size:11px">BELUM LUNAS</div><hr>' : ''}
<br>
<div class="c" style="font-size:11px">Tanda Tangan Kasir</div>
<br><br>
<div class="c">_______________</div>
<div class="c" style="font-size:11px">${tx.by}</div>
<br>
<div class="c" style="font-size:11px">Terima kasih!</div>
</body></html>`
    setPrintPopup({ html, title: `Struk ${tx.no}` })
  }

  function kirimWAStruk(tx) {
    const pm = PAY_METHODS.find(p => p.id === tx.metode)
    const teks = `*${cfg.nama_bumdes}*\n${cfg.desa}, ${cfg.kecamatan}, ${cfg.kabupaten}\n\n` +
      `📋 *STRUK PENJUALAN*\n` +
      `No. : ${tx.no}\nTgl : ${tx.tgl}\nKasir: ${tx.by}\n\n` +
      `👤 *Pelanggan*\nNama : ${tx.nama}\nAlamat: ${tx.alamat||'-'}\nHP : ${tx.hp||'-'}\n\n` +
      `🥚 Telur Ayam ${tx.kg} kg x ${rp(tx.harga)}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 *TOTAL: ${rp(tx.total)}*\n` +
      `Metode: ${pm ? pm.label : tx.metode}` +
      (tx.metode==='tempo' ? `\nJatuh Tempo: ${tx.tempo}\n⚠️ STATUS: BELUM LUNAS` : '') +
      `\n\nTerima kasih atas kepercayaan Anda! 🙏`
    const hp = tx.hp ? tx.hp.replace(/[^0-9]/g,'').replace(/^0/,'62') : ''
    setWaPopup({ teks, hp, judul: 'Struk Penjualan' })
  }

  // ── KWITANSI PENGELUARAN — PRINT & WA ──
  function printKwitansi(exp) {
    const ki = katOf(exp.kat)
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;font-size:12px;width:100%;padding:4mm;color:#000}
.c{text-align:center}.b{font-weight:bold}.lg{font-size:14px}
hr{border:none;border-top:1px dashed #000;margin:5px 0}
.row{display:flex;justify-content:space-between;margin-bottom:2px}
.tot{font-size:16px;font-weight:bold}
</style></head><body>
<div class="c b lg">${cfg.nama_bumdes}</div>
<div class="c" style="font-size:11px">${cfg.desa}, ${cfg.kecamatan}, ${cfg.kabupaten}</div>
<hr>
<div class="c b">KWITANSI PENGELUARAN</div>
<hr>
<div class="row"><span>No.</span><span>${exp.no}</span></div>
<div class="row"><span>Tanggal</span><span>${exp.tgl}</span></div>
<div class="row"><span>Kategori</span><span>${ki.label}</span></div>
<div class="row"><span>Keterangan</span><span style="max-width:55%;text-align:right">${exp.ket}</span></div>
${exp.qty > 0 ? `<div class="row"><span>Qty Pakan</span><span>${exp.qty}kg Kand.${exp.kdPakan}</span></div>` : ''}
<div class="row"><span>Oleh</span><span>${exp.by}</span></div>
<hr>
<div class="row tot"><span>JUMLAH</span><span>${rp(exp.jml)}</span></div>
<hr>
<br>
<div class="c" style="font-size:11px">Tanda Tangan</div>
<br><br>
<div class="c">_______________</div>
<div class="c" style="font-size:11px">${exp.by}</div>
</body></html>`
    setPrintPopup({ html, title: `Kwitansi ${exp.no}` })
  }

  function kirimWAKwitansi(exp) {
    const ki = katOf(exp.kat)
    const teks = `*${cfg.nama_bumdes}*\n${cfg.desa}, ${cfg.kecamatan}\n\n` +
      `🧾 *KWITANSI PENGELUARAN*\n` +
      `No. : ${exp.no}\nTgl : ${exp.tgl}\n` +
      `Kategori: ${ki.ic} ${ki.label}\n` +
      `Keterangan: ${exp.ket}\n` +
      (exp.qty > 0 ? `Qty Pakan: ${exp.qty} kg (Kandang ${exp.kdPakan})\n` : '') +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💸 *JUMLAH: ${rp(exp.jml)}*\n\n` +
      `Dicatat oleh: ${exp.by}`
    setWaPopup({ teks, hp: '', judul: 'Kwitansi Pengeluaran' })
  }

  // ── PRINT LAPORAN ──
  function printLaporan() {
    const rows = monthlyRows()
    const tot = rows.reduce((a,r) => ({kg:a.kg+r.kg,btr:a.btr+r.btr,inc:a.inc+r.inc,exp:a.exp+r.exp,mati:a.mati+r.mati}),{kg:0,btr:0,inc:0,exp:0,mati:0})
    const ec = ecByCat()
    const lb = totalIncome - totalExpense
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Laporan ${cfg.nama_bumdes} 2026</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:10px;padding:15px;color:#111}
h1{font-size:14px;color:#15803d;margin-bottom:2px}
h2{font-size:12px;margin:10px 0 4px;color:#15803d}
.sub{font-size:9px;color:#6b7280;margin-bottom:8px}
table{width:100%;border-collapse:collapse;margin-bottom:10px;font-size:9px}
th{background:#15803d;color:#fff;padding:4px 5px;text-align:left;white-space:nowrap}
td{padding:4px 5px;border-bottom:0.5px solid #e5e7eb}
tr:nth-child(even) td{background:#f9fafb}
.tot td{background:#f3f4f6;font-weight:700;border-top:1.5px solid #15803d}
.ttl{display:flex;justify-content:space-between;align-items:center}
@media print{body{padding:5mm}.no-print{display:none}}
</style></head><body>
<div class="no-print" style="background:#15803d;color:#fff;padding:10px;text-align:center;margin-bottom:12px;border-radius:6px;cursor:pointer" onclick="window.print()">
  🖨 Klik di sini untuk Print / Simpan sebagai PDF
</div>
<div class="ttl"><div>
<h1>${cfg.nama_bumdes}</h1>
<div class="sub">${cfg.desa}, ${cfg.kecamatan}, ${cfg.kabupaten}</div>
<div class="sub">Laporan Pertanggungjawaban Tahun 2026</div>
</div><div style="text-align:right;font-size:9px;color:#6b7280">Dicetak: ${new Date().toLocaleString('id-ID')}</div></div>

<h2>Ringkasan Per Bulan</h2>
<table><thead><tr>
<th>Bulan</th><th>Prod(kg)</th><th>Butir</th><th>Pendapatan(Rp)</th><th>Pengeluaran(Rp)</th><th>Laba(Rp)</th><th>Pakan A(kg)</th><th>Pakan B(kg)</th><th>HDP A</th><th>HDP B</th><th>Kematian</th>
</tr></thead><tbody>
${rows.map((r,i) => {
  const hA=r.hAn>0?f1(r.hA/r.hAn):'-',hB=r.hBn>0?f1(r.hB/r.hBn):'-',lb2=r.inc-r.exp
  return `<tr><td>${BULAN[i]}</td><td>${f1(r.kg)}</td><td>${r.btr}</td><td>${Math.round(r.inc).toLocaleString('id-ID')}</td><td>${Math.round(r.exp).toLocaleString('id-ID')}</td><td style="color:${lb2>=0?'#15803d':'#dc2626'}">${Math.round(lb2).toLocaleString('id-ID')}</td><td>${f1(r.pkA)}</td><td>${f1(r.pkB)}</td><td style="color:${parseFloat(hA)>=78?'#15803d':'#dc2626'}">${hA}</td><td style="color:${parseFloat(hB)>=78?'#15803d':'#dc2626'}">${hB}</td><td>${r.mati}</td></tr>`
}).join('')}
<tr class="tot"><td>TOTAL</td><td>${f1(tot.kg)}</td><td>${tot.btr}</td><td>${Math.round(tot.inc).toLocaleString('id-ID')}</td><td>${Math.round(tot.exp).toLocaleString('id-ID')}</td><td>${Math.round(tot.inc-tot.exp).toLocaleString('id-ID')}</td><td>—</td><td>—</td><td>—</td><td>—</td><td>${tot.mati}</td></tr>
</tbody></table>

<h2>Rincian Pengeluaran Per Kategori</h2>
<table><thead><tr><th>Kategori</th><th>Nominal (Rp)</th><th>% dari Total</th></tr></thead><tbody>
${KATS.map((k,i) => `<tr><td>${k.label}</td><td>${ec[k.id]?Math.round(ec[k.id]).toLocaleString('id-ID'):'-'}</td><td>${totalExpense>0?f1((ec[k.id]||0)/totalExpense*100)+'%':'0%'}</td></tr>`).join('')}
<tr class="tot"><td>TOTAL</td><td>${Math.round(totalExpense).toLocaleString('id-ID')}</td><td>100%</td></tr>
</tbody></table>

<h2>Alokasi SHU dari Laba Bersih</h2>
<table><thead><tr><th>Item SHU</th><th>%</th><th>Nominal (Rp)</th></tr></thead><tbody>
${SHU.map(x => `<tr><td>${x.l}</td><td>${x.p}%</td><td>${Math.round(lb*x.p/100).toLocaleString('id-ID')}</td></tr>`).join('')}
<tr class="tot"><td>TOTAL</td><td>100%</td><td>${Math.round(lb).toLocaleString('id-ID')}</td></tr>
</tbody></table>

<div style="margin-top:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px">
<div style="text-align:center">
<div style="margin-bottom:40px">Mengetahui,</div>
<div style="border-top:1px solid #000;padding-top:4px">Kepala Desa ${cfg.desa}</div>
</div>
<div style="text-align:center">
<div style="margin-bottom:40px">Dibuat oleh,</div>
<div style="border-top:1px solid #000;padding-top:4px">Direktur ${cfg.nama_bumdes}</div>
</div>
</div>
</body></html>`
    // Gunakan blob URL agar kompatibel di semua browser & mobile
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
  }

  // ── LOGIN ──
  async function doLogin() {
    const found = users.find(u => u.username === loginForm.u.trim() && u.password === loginForm.p)
    if (!found) { setLoginErr('Username atau password salah!'); return }
    setUser(found); setLoginErr('')
    setTab(ROLES[found.role].tabs[0])
  }
  function doLogout() { setUser(null); setLoginForm({ u: '', p: '' }); setTab('dash') }
  const canDo = t => user && ROLES[user.role].tabs.includes(t)
  function go(t) { if (!canDo(t)) { notify('Akses ditolak!', true); return } setTab(t) }

  // ── ROOM INPUT ──
  function setRoom(k, i, v) {
    setRooms(prev => {
      const arr = [...prev[k]]; arr[i] = v
      return { ...prev, [k]: arr }
    })
    if (v !== 'mati' && i + 1 < (k === 'A' ? 250 : 181)) setFocR(i + 1)
  }
  function resetRooms() {
    setRooms(prev => ({ ...prev, [kd]: new Array(kd === 'A' ? 250 : 181).fill(null) }))
    setFocR(0)
  }

  const curRooms  = rooms[kd] || rooms['A']
  const popK      = kd === 'B' ? cfg.pop_b : cfg.pop_a
  const totBtr    = curRooms.reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0)
  const matiCnt   = curRooms.filter(v => v === 'mati').length
  const hdpLive   = popK > 0 ? (totBtr / popK) * 100 : 0
  const filledCnt = curRooms.filter(v => v !== null).length

  // avg HDP per kandang (7 panen terakhir)
  const hdpAvg = k => {
    const x = hlog.filter(h => h.kd === k).slice(0, 7)
    return x.length ? x.reduce((a, b) => a + b.hdp, 0) / x.length : 0
  }

  // totals
  const totalIncome  = slog.filter(t => t.lunas !== false).reduce((a, t) => a + t.total, 0)
  const totalExpense = elog.reduce((a, e) => a + e.jml, 0)
  const laba = totalIncome - totalExpense
  const ecByCat = () => {
    const m = {}; KATS.forEach(k => m[k.id] = 0)
    elog.forEach(e => m[e.kat] = (m[e.kat] || 0) + e.jml)
    return m
  }

  // ── SIMPAN PANEN PER KANDANG ──
  async function simpanPanenKandang(kdX) {
    const formData = kdX === 'A' ? hdA : hdB
    const roomsKd = rooms[kdX]
    const totBtrKd = roomsKd.reduce((a, v) => a + (typeof v === 'number' ? v : 0), 0)
    const matiKd = roomsKd.filter(v => v === 'mati').length

    const kgV = parseFloat(formData.kg) || 0
    if (kgV <= 0) { alert(`Total kg panen Kandang ${kdX} wajib diisi!`); return }

    const rusakV = parseInt(formData.rusak) || 0
    const kmV = parseInt(formData.km) || matiKd
    const popKey = kdX === 'A' ? 'pop_a' : 'pop_b'
    const newPop = Math.max(0, cfg[popKey] - kmV)
    const hdp = newPop > 0 ? (totBtrKd / newPop) * 100 : 0
    const newStokKg = cfg.stok_kg + kgV
    const newStokBtr = cfg.stok_butir + totBtrKd
    const roomDetail = JSON.stringify(roomsKd)

    // ── Ambil data pakan hari ini dari pakan_harian ──
    const pakanHari = pakanHarian.filter(p => p.tanggal === tod())
    const pakanPagi = pakanHari.find(p => p.sesi === 'pagi')
    const pakanSore = pakanHari.find(p => p.sesi === 'sore')

    const pakanField = kdX === 'A' ? 'kandang_a' : 'kandang_b'
    const pkPagi = pakanPagi ? (pakanPagi[pakanField] || 0) : 0
    const pkSore = pakanSore ? (pakanSore[pakanField] || 0) : 0
    const pkTotal = pkPagi + pkSore

    const pakanInfo = pkTotal > 0
      ? `\nPakan ${kdX}: ${f1(pkTotal)} kg (pagi ${f1(pkPagi)} + sore ${f1(pkSore)})`
      : '\n⚠ Pakan belum diinput hari ini'

    try {
      const { data: insertedPanen, error } = await supabase.from('panen').insert({
        kandang: kdX, total_butir: totBtrKd, total_kg: kgV, hdp,
        kematian: kmV,
        pakan_a: kdX === 'A' ? pkTotal : 0,
        pakan_b: kdX === 'B' ? pkTotal : 0,
        pakan_a_pagi: kdX === 'A' ? pkPagi : 0,
        pakan_a_sore: kdX === 'A' ? pkSore : 0,
        pakan_b_pagi: kdX === 'B' ? pkPagi : 0,
        pakan_b_sore: kdX === 'B' ? pkSore : 0,
        telur_rusak: rusakV, room_detail: roomDetail,
        dicatat_oleh: user.nama, tanggal: tod(),
      }).select().single()
      if (error) throw error

      await saveCfg(popKey, newPop)
      await saveCfg('stok_kg', newStokKg)
      await saveCfg('stok_butir', newStokBtr)
      setCfg(prev => ({ ...prev, [popKey]: newPop, stok_kg: newStokKg, stok_butir: newStokBtr }))

      const tgl = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      setHlog(prev => [{
        id: insertedPanen.id, tgl, tgl2: tod(), kd: kdX,
        tb: totBtrKd, kg: kgV, hdp, km: kmV, rusak: rusakV,
        pakanA: kdX === 'A' ? pkTotal : 0,
        pakanB: kdX === 'B' ? pkTotal : 0,
        pakanAPagi: kdX === 'A' ? pkPagi : 0,
        pakanASore: kdX === 'A' ? pkSore : 0,
        pakanBPagi: kdX === 'B' ? pkPagi : 0,
        pakanBSore: kdX === 'B' ? pkSore : 0,
        roomDetail: roomsKd.slice(), by: user.nama,
      }, ...prev])
      setRooms(prev => ({ ...prev, [kdX]: new Array(kdX === 'A' ? 250 : 181).fill(null) }))
      if (kdX === 'A') setHdA({ kg: '', km: '', rusak: '' })
      else setHdB({ kg: '', km: '', rusak: '' })
      alert(`✅ Panen Kandang ${kdX} disimpan!\n${totBtrKd} butir | ${kgV} kg | HDP ${f1(hdp)}%${rusakV > 0 ? `\nTelur rusak: ${rusakV} butir` : ''}${pakanInfo}`)
    } catch (err) {
      alert('Gagal simpan panen: ' + err.message)
    }
  }

  // ── SIMPAN PAKAN SESI (PAGI / SORE) ──
  async function simpanPakanSesi(sesi) {
    const pkA = sesi === 'pagi' ? (parseFloat(hd.pakanAPagi)||0) : (parseFloat(hd.pakanASore)||0)
    const pkB = sesi === 'pagi' ? (parseFloat(hd.pakanBPagi)||0) : (parseFloat(hd.pakanBSore)||0)
    if (pkA <= 0 && pkB <= 0) { alert(`Isi minimal satu field pakan ${sesi}!`); return }
    if (pkA > cfg.pakan_a) { alert(`Pakan A melebihi stok (${f1(cfg.pakan_a)} kg)!`); return }
    if (pkB > cfg.pakan_b) { alert(`Pakan B melebihi stok (${f1(cfg.pakan_b)} kg)!`); return }

    try {
      // Cek apakah sesi ini sudah diinput hari ini
      const sudahAda = pakanHarian.find(p => p.tanggal === tod() && p.sesi === sesi)

      if (sudahAda) {
        // Timpa data lama — kembalikan stok lama dulu lalu kurangi dengan yang baru
        const selisihA = pkA - (sudahAda.kandang_a || 0)
        const selisihB = pkB - (sudahAda.kandang_b || 0)
        const newPakanA = Math.max(0, cfg.pakan_a - selisihA)
        const newPakanB = Math.max(0, cfg.pakan_b - selisihB)

        await supabase.from('pakan_harian').update({
          kandang_a: pkA, kandang_b: pkB, dicatat_oleh: user.nama
        }).eq('id', sudahAda.id)

        await saveCfg('pakan_a', newPakanA)
        await saveCfg('pakan_b', newPakanB)
        setCfg(prev => ({ ...prev, pakan_a: newPakanA, pakan_b: newPakanB }))
        setPakanHarian(prev => prev.map(p =>
          p.id === sudahAda.id ? { ...p, kandang_a: pkA, kandang_b: pkB } : p
        ))
      } else {
        // Insert baru
        const { data, error } = await supabase.from('pakan_harian').insert({
          tanggal: tod(), sesi, kandang_a: pkA, kandang_b: pkB,
          dicatat_oleh: user.nama
        }).select().single()
        if (error) throw error

        const newPakanA = Math.max(0, cfg.pakan_a - pkA)
        const newPakanB = Math.max(0, cfg.pakan_b - pkB)
        await saveCfg('pakan_a', newPakanA)
        await saveCfg('pakan_b', newPakanB)
        setCfg(prev => ({ ...prev, pakan_a: newPakanA, pakan_b: newPakanB }))
        setPakanHarian(prev => [data, ...prev])
      }

      // Reset field sesi yang disimpan
      if (sesi === 'pagi') setHd(p => ({ ...p, pakanAPagi: '', pakanBPagi: '' }))
      else setHd(p => ({ ...p, pakanASore: '', pakanBSore: '' }))

      alert(`✅ Pakan ${sesi} disimpan!\nA: ${f1(pkA)} kg | B: ${f1(pkB)} kg\n\nSaat simpan panen sore, data pakan otomatis terhubung ke log panen.`)
    } catch (err) {
      alert('Gagal simpan pakan: ' + err.message)
    }
  }

  // ── SIMPAN KONSUMSI PAKAN ──
  async function simpanPakan() {
    const pkA     = (parseFloat(hd.pakanAPagi)||0) + (parseFloat(hd.pakanASore)||0)
    const pkB     = (parseFloat(hd.pakanBPagi)||0) + (parseFloat(hd.pakanBSore)||0)
    const pkAPagi = parseFloat(hd.pakanAPagi)||0
    const pkASore = parseFloat(hd.pakanASore)||0
    const pkBPagi = parseFloat(hd.pakanBPagi)||0
    const pkBSore = parseFloat(hd.pakanBSore)||0

    if (pkA <= 0 && pkB <= 0) { alert('Isi minimal satu field konsumsi pakan!'); return }
    if (pkA > cfg.pakan_a) { alert(`Pakan A melebihi stok (${f1(cfg.pakan_a)} kg)!`); return }
    if (pkB > cfg.pakan_b) { alert(`Pakan B melebihi stok (${f1(cfg.pakan_b)} kg)!`); return }

    const newPakanA = Math.max(0, cfg.pakan_a - pkA)
    const newPakanB = Math.max(0, cfg.pakan_b - pkB)
    const today = tod()

    try {
      // 1. Update stok pakan di config
      if (pkA > 0) await saveCfg('pakan_a', newPakanA)
      if (pkB > 0) await saveCfg('pakan_b', newPakanB)
      setCfg(prev => ({ ...prev, pakan_a: newPakanA, pakan_b: newPakanB }))

      // 2. Update log panen hari ini dengan data pakan
      // Kandang A — cari panen hari ini
      if (pkA > 0) {
        const { data: panenA } = await supabase
          .from('panen').select('id').eq('tanggal', today).eq('kandang', 'A')
          .order('created_at', { ascending: false }).limit(1)
        if (panenA && panenA.length > 0) {
          await supabase.from('panen').update({
            pakan_a: pkA, pakan_a_pagi: pkAPagi, pakan_a_sore: pkASore
          }).eq('id', panenA[0].id)
          // Update local state
          setHlog(prev => prev.map(h =>
            h.tgl2 === today && h.kd === 'A'
              ? { ...h, pakanA: pkA, pakanAPagi: pkAPagi, pakanASore: pkASore }
              : h
          ))
        }
      }

      // Kandang B — cari panen hari ini
      if (pkB > 0) {
        const { data: panenB } = await supabase
          .from('panen').select('id').eq('tanggal', today).eq('kandang', 'B')
          .order('created_at', { ascending: false }).limit(1)
        if (panenB && panenB.length > 0) {
          await supabase.from('panen').update({
            pakan_b: pkB, pakan_b_pagi: pkBPagi, pakan_b_sore: pkBSore
          }).eq('id', panenB[0].id)
          // Update local state
          setHlog(prev => prev.map(h =>
            h.tgl2 === today && h.kd === 'B'
              ? { ...h, pakanB: pkB, pakanBPagi: pkBPagi, pakanBSore: pkBSore }
              : h
          ))
        }
      }

      setHd({ kg: '', km: '', rusak: '', pakanAPagi: '', pakanASore: '', pakanBPagi: '', pakanBSore: '' })
      alert(`✅ Konsumsi pakan disimpan & dicatat ke log panen!\nA: ${f1(pkA)} kg (pagi ${f1(pkAPagi)}+sore ${f1(pkASore)})\nB: ${f1(pkB)} kg (pagi ${f1(pkBPagi)}+sore ${f1(pkBSore)})`)
    } catch (err) {
      alert('Gagal simpan pakan: ' + err.message)
    }
  }

  // ── SIMPAN PANEN (legacy, kept for compatibility) ──
  async function simpanPanen() { await simpanPanenKandang(kd) }


  // ── PROSES JUAL ──
  async function prosesJual() {
    const kgV = parseFloat(td.kg) || 0, hV = parseFloat(td.harga) || 0
    if (kgV <= 0 || hV <= 0) { alert('Isi jumlah & harga!'); return }
    if (!td.nama.trim()) { alert('Nama pelanggan wajib!'); return }
    if (td.metode === 'tempo' && !td.tempo) { alert('Tanggal jatuh tempo wajib!'); return }
    if (td.metode === 'transfer' && (!td.bank.trim() || !td.norek.trim())) { alert('Bank & no. rekening wajib!'); return }
    if (td.metode !== 'tempo' && kgV > cfg.stok_kg) { alert('Stok Telur Tidak Mencukupi!'); return }

    const total = kgV * hV
    const no = 'TRX-' + String(txRef.current).padStart(4, '0')
    const lunas = td.metode !== 'tempo'

    try {
      const { data, error } = await supabase.from('penjualan').insert({
        no_transaksi: no, nama_pembeli: td.nama, alamat: td.alamat, hp: td.hp,
        kg: kgV, harga: hV, total, metode: td.metode,
        bank: td.bank || null, no_rekening: td.norek || null,
        tempo: td.tempo || null, lunas, dicatat_oleh: user.nama, tanggal: tod(),
      }).select().single()
      if (error) throw error

      if (lunas) {
        const newStok = cfg.stok_kg - kgV
        const newKas  = cfg.kas + total
        const newIncome = totalIncome + total
        await saveCfg('stok_kg', newStok)
        await saveCfg('kas', newKas)
        setCfg(prev => ({ ...prev, stok_kg: newStok, kas: newKas }))
      }
      txRef.current++
      const tx = { id: data.id, no, tgl: new Date().toLocaleString('id-ID'), tgl2: tod(), kg: kgV, harga: hV, total, nama: td.nama, alamat: td.alamat, hp: td.hp, metode: td.metode, bank: td.bank, norek: td.norek, tempo: td.tempo, lunas, by: user.nama }
      setSlog(prev => [tx, ...prev])
      if (!lunas) setPiutang(prev => [{ id: data.id, no, tgl: tx.tgl, kg: kgV, total, nama: td.nama, tempo: td.tempo }, ...prev])
      setReceipt(tx)
      setTd({ kg: '', harga: '25000', nama: '', alamat: '', hp: '', metode: td.metode, bank: '', norek: '', tempo: '' })
    } catch (err) {
      alert('Gagal simpan transaksi: ' + err.message)
    }
  }

  // ── LUNASI TEMPO ──
  async function lunasTempo(id) {
    const tx = piutang.find(p => p.id === id); if (!tx) return
    try {
      await supabase.from('penjualan').update({ lunas: true }).eq('id', id)
      const newStok = cfg.stok_kg - tx.kg
      const newKas  = cfg.kas + tx.total
      await saveCfg('stok_kg', newStok)
      await saveCfg('kas', newKas)
      setCfg(prev => ({ ...prev, stok_kg: newStok, kas: newKas }))
      setPiutang(prev => prev.filter(p => p.id !== id))
      setSlog(prev => prev.map(t => t.id === id ? { ...t, lunas: true } : t))
      notify(`Piutang ${tx.nama} dilunasi: ${rp(tx.total)}`)
    } catch (err) {
      alert('Gagal lunasi: ' + err.message)
    }
  }

  // ── SIMPAN PENGELUARAN ──
  async function simpanKeluar() {
    const jmlV = parseFloat(ed.jml) || 0
    if (jmlV <= 0) { alert('Jumlah pengeluaran wajib!'); return }
    const no = 'EXP-' + String(exRef.current).padStart(4, '0')
    try {
      await supabase.from('pengeluaran').insert({
        no_exp: no, kategori: ed.kat, jumlah: jmlV,
        keterangan: ed.ket || '-', qty_pakan: parseFloat(ed.qty) || 0,
        kandang_pakan: ed.kdPakan, dicatat_oleh: user.nama, tanggal: ed.tgl,
      })
      const newKas = cfg.kas - jmlV
      await saveCfg('kas', newKas)
      setCfg(prev => ({ ...prev, kas: newKas }))

      if (ed.kat === 'pakan') {
        const qty = parseFloat(ed.qty) || 0
        if (qty > 0) {
          const key = ed.kdPakan === 'A' ? 'pakan_a' : 'pakan_b'
          const newPakan = cfg[key] + qty
          await saveCfg(key, newPakan)
          setCfg(prev => ({ ...prev, [key]: newPakan }))
        }
      }
      exRef.current++
      setElog(prev => [{ id: Date.now(), no, kat: ed.kat, tgl: ed.tgl, jml: jmlV, ket: ed.ket || '-', qty: parseFloat(ed.qty) || 0, kdPakan: ed.kdPakan, by: user.nama }, ...prev])
      setEd({ kat: 'pakan', tgl: tod(), jml: '', ket: '', qty: '', kdPakan: 'A' })
      alert(`Pengeluaran ${katOf(ed.kat).label} disimpan: ${rp(jmlV)}`)
    } catch (err) {
      alert('Gagal simpan pengeluaran: ' + err.message)
    }
  }

  // ── TAMBAH USER ──
  async function addUser() {
    if (!nu.nama || !nu.username || !nu.password) { alert('Semua field wajib!'); return }
    if (users.find(u => u.username === nu.username)) { alert('Username sudah ada!'); return }
    try {
      const { data, error } = await supabase.from('users').insert({
        nama: nu.nama, username: nu.username, password: nu.password,
        role: nu.role, avatar: nu.nama.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2),
      }).select().single()
      if (error) throw error
      setUsers(prev => [...prev, data])
      setNu({ nama: '', username: '', password: '', role: 'abk' })
      alert('User berhasil ditambahkan!')
    } catch (err) {
      alert('Gagal tambah user: ' + err.message)
    }
  }

  async function delUser(id) {
    if (user.id === id) { notify('Tidak bisa hapus akun sendiri!', true); return }
    await supabase.from('users').delete().eq('id', id)
    setUsers(prev => prev.filter(u => u.id !== id))
    notify('User dihapus.')
  }

  // ── SIMPAN SETTING ──
  async function simpanSetting(vals) {
    for (const [k, v] of Object.entries(vals)) await saveCfg(k, v)
    setCfg(prev => ({ ...prev, ...Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, isNaN(v) ? v : +v])) }))
    notify('Pengaturan disimpan!')
  }

  // ── MONTHLY DATA ──
  function monthlyRows() {
    const rows = Array(12).fill(null).map(() => ({ kg: 0, btr: 0, inc: 0, exp: 0, mati: 0, hA: 0, hAn: 0, hB: 0, hBn: 0, pkA: 0, pkB: 0 }))
    hlog.forEach(h => {
      const m = new Date(h.tgl2 || tod()).getMonth()
      rows[m].kg += h.kg; rows[m].btr += h.tb; rows[m].mati += h.km || 0
      rows[m].pkA += h.pakanA || 0; rows[m].pkB += h.pakanB || 0
      h.kd === 'A' ? (rows[m].hA += h.hdp, rows[m].hAn++) : (rows[m].hB += h.hdp, rows[m].hBn++)
    })
    slog.filter(t => t.lunas !== false).forEach(t => { rows[new Date(t.tgl2 || tod()).getMonth()].inc += t.total })
    elog.forEach(e => { rows[new Date(e.tgl).getMonth()].exp += e.jml })
    return rows
  }

  // ─── LOADING ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...S.loginWrap, gap: 12 }}>
      <div style={{ fontSize: 40 }}>🐓</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: '#15803d' }}>BUMDes Widyatama</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>Memuat data...</div>
    </div>
  )

  // ─── LOGIN ─────────────────────────────────────────────────────────────────
  if (!user) return (
    <div style={S.loginWrap}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 58, height: 58, borderRadius: 14, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 28 }}>🐓</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#15803d' }}>{cfg.nama_bumdes}</div>
        <div style={{ fontSize: 11, color: '#6b7280' }}>{cfg.desa}, {cfg.kecamatan}</div>
      </div>
      <div style={{ ...S.card, width: '100%', maxWidth: 310 }}>
        <div style={S.sec}>Masuk ke aplikasi</div>
        <label style={{ ...S.lbl, marginTop: 0 }}>Username</label>
        <input style={S.inp} type="text" placeholder="Masukkan username" value={loginForm.u}
          onChange={e => setLoginForm(p => ({ ...p, u: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && doLogin()} />
        <label style={S.lbl}>Password</label>
        <input style={S.inp} type="password" placeholder="Masukkan password" value={loginForm.p}
          onChange={e => setLoginForm(p => ({ ...p, p: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && doLogin()} />
        {loginErr && <div style={{ background: '#fff1f2', borderRadius: 7, padding: '7px 10px', fontSize: 11, color: '#dc2626', marginTop: 7, textAlign: 'center' }}>{loginErr}</div>}
        <button style={S.btnGrn} onClick={doLogin}>Masuk</button>
      </div>
    </div>
  )

  const role = ROLES[user.role]
  const tabDef = [
    { k: 'dash',    i: '📊', l: 'Dashboard' },
    { k: 'input',   i: '🥚', l: 'Input' },
    { k: 'kasir',   i: '🧾', l: 'Kasir' },
    { k: 'keluar',  i: '💸', l: 'Pengeluaran' },
    { k: 'laporan', i: '📋', l: 'Laporan' },
    { k: 'hist',    i: '🕐', l: 'Riwayat' },
    { k: 'setting', i: '⚙️', l: 'Pengaturan' },
  ].filter(t => canDo(t.k))

  const ec = ecByCat()
  const hdpA = hdpAvg('A'), hdpB = hdpAvg('B')
  const hcA = hdpA >= 78 ? '#15803d' : hdpA > 0 ? '#dc2626' : '#9ca3af'
  const hcB = hdpB >= 78 ? '#15803d' : hdpB > 0 ? '#dc2626' : '#9ca3af'

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER PAGES
  // ═══════════════════════════════════════════════════════════════════════════

  const renderDash = () => {
    const saldoKasTotal = cfg.modal_awal + totalIncome - totalExpense
    return (
    <>
      <div style={S.g2}>
        {[['Stok Telur', `${f1(cfg.stok_kg)} kg`, `${cfg.stok_butir} butir`, '#15803d'],
          ['Laba Bersih', rp(laba), laba >= 0 ? 'positif' : 'negatif', laba >= 0 ? '#15803d' : '#dc2626'],
          ['Pendapatan', rp(totalIncome), 'penjualan', '#0284c7'],
          ['Pengeluaran', rp(totalExpense), 'biaya', '#d97706'],
        ].map(([l, v, s, c]) => (
          <div key={l} style={S.stat}>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{l}</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: c, margin: '2px 0' }}>{v}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Modal Awal + Saldo Kas */}
      <div style={{ ...S.card, marginTop: 8, background: '#f0fdf4', border: '0.5px solid #bbf7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Saldo Kas Aktual</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#15803d' }}>{rp(saldoKasTotal)}</div>
            <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>
              Modal Awal {rp(cfg.modal_awal)} + Pendapatan {rp(totalIncome)} − Pengeluaran {rp(totalExpense)}
            </div>
          </div>
          {cfg.modal_awal === 0 && (
            <div style={{ background: '#fffbeb', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#92400e', maxWidth: 120, textAlign: 'center' }}>
              ⚠ Set modal awal di Pengaturan
            </div>
          )}
        </div>
        {cfg.modal_awal > 0 && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            {[['Modal Awal', cfg.modal_awal, '#15803d'], ['+ Pendapatan', totalIncome, '#0284c7'], ['− Pengeluaran', totalExpense, '#dc2626']].map(([l, v, c]) => (
              <div key={l} style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '5px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{l}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: c }}>{rp(v)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ ...S.card, marginTop: 8 }}>
        <div style={S.sec}>Populasi & stok pakan</div>
        <div style={S.g2}>
          {[['Kandang A', cfg.pop_a, 500, cfg.pakan_a, '#15803d'], ['Kandang B', cfg.pop_b, 362, cfg.pakan_b, '#0284c7']].map(([l, p, cap, pk, c]) => (
            <div key={l}>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{l}</div>
              <div style={{ fontSize: 19, fontWeight: 600, color: c }}>{p} <span style={{ fontSize: 10, fontWeight: 400 }}>ekor</span></div>
              <div style={S.bar}><div style={{ background: c, width: `${Math.round(p / cap * 100)}%`, height: '100%', borderRadius: 99 }} /></div>
              <div style={{ marginTop: 5, background: pk < 50 ? '#fff1f2' : '#f0fdf4', borderRadius: 8, padding: '5px 8px' }}>
                <div style={{ fontSize: 9, color: '#6b7280' }}>Stok Pakan</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: pk < 50 ? '#dc2626' : c }}>{f1(pk)} kg{pk < 50 ? ' ⚠' : ''}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sec}>HDP rata-rata — 7 panen terakhir</div>
        <div style={S.g2}>
          {[[hdpA, hcA, 'Kandang A'], [hdpB, hcB, 'Kandang B']].map(([hdp, hc, label]) => (
            <div key={label} style={{ background: hdp >= 78 ? '#f0fdf4' : '#fff1f2', borderLeft: `3px solid ${hc}`, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: hc }}>{hdp > 0 ? f1(hdp) : '—'}%</div>
              <div style={{ fontSize: 10, color: hc, marginTop: 2 }}>{hdp >= 78 ? 'Target tercapai' : hdp > 0 ? 'Di bawah target' : 'Belum ada data'}</div>
              <div style={S.bar}><div style={{ background: hc, width: `${Math.min(hdp, 100)}%`, height: '100%', borderRadius: 99 }} /></div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 7 }}>Target HDP ≥ 78%</div>
      </div>

      <div style={S.card}>
        <div style={S.sec}>Ringkasan pengeluaran</div>
        <div style={S.g3}>
          {KATS.map(k => (
            <div key={k.id} style={{ ...S.stat, borderTop: `2px solid ${k.c}` }}>
              <div style={{ fontSize: 13 }}>{k.ic}</div>
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: k.c }}>{rp(ec[k.id])}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff1f2', borderRadius: 8, padding: '7px 10px', marginTop: 7, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Total pengeluaran</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{rp(totalExpense)}</span>
        </div>
      </div>

      {piutang.length > 0 && (
        <div style={S.card}>
          <div style={S.sec}>Piutang tempo belum lunas</div>
          {piutang.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f3f4f6' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{p.nama}</div>
                <div style={{ fontSize: 10, color: '#d97706' }}>JT: {p.tempo} — {p.kg} kg</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#d97706' }}>{rp(p.total)}</div>
                <button onClick={() => lunasTempo(p.id)} style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', marginTop: 2 }}>Lunasi</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...S.card, background: '#f0fdf4', border: '0.5px solid #bbf7d0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d' }}>📋 Alokasi SHU & Laporan Lengkap</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Laba bersih: <strong style={{ color: '#15803d' }}>{rp(laba)}</strong></div>
          </div>
          {canDo('laporan') && (
            <button onClick={() => go('laporan')}
              style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              Lihat →
            </button>
          )}
        </div>
      </div>
    </>
  )}

  // ── HELPER RENDER GRID KAMAR ──
  const renderRoomGrid = (kdX) => {
    const col = kdX === 'A' ? '#15803d' : '#0284c7'
    const roomsKd = rooms[kdX]
    return (
      <div style={S.rg}>
        {roomsKd.map((v, i) => {
          const iD = v === 'mati', iF = v !== null
          return (
            <div key={i} style={{ borderRadius:8, padding:'7px 6px', border:`1.5px solid ${iD?'#fca5a5':iF?'#86efac':'#e5e7eb'}`, background:iD?'#fff1f2':iF?'#f0fdf4':'#fff' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
                <span style={{ fontSize:9, fontWeight:600, color:iD?'#dc2626':iF?col:'#9ca3af' }}>K-{i+1} {iD?'X':iF?'✓'+v:''}</span>
                <button onClick={() => setRoom(kdX, i, 'mati')} style={{ background:'none', border:'none', fontSize:8, color:'#dc2626', cursor:'pointer' }}>Mati</button>
              </div>
              <div style={{ display:'flex', gap:2 }}>
                {[0,1,2].map(n => (
                  <button key={n} onClick={() => setRoom(kdX, i, n)}
                    style={{ flex:1, border:`1.5px solid ${v===n?col:'#e5e7eb'}`, borderRadius:5, padding:'5px 0', fontWeight:600, fontSize:12, cursor:'pointer', background:v===n?col:'transparent', color:v===n?'#fff':'#111', fontFamily:'inherit' }}>{n}</button>
                ))}
                <button onClick={() => setRoom(kdX, i, 3)}
                  style={{ flex:1, border:`1.5px solid ${v===3?'#d97706':'#fde68a'}`, borderRadius:5, padding:'5px 0', fontWeight:700, fontSize:12, cursor:'pointer', background:v===3?'#d97706':'#fffbeb', color:v===3?'#fff':'#92400e', fontFamily:'inherit' }}>3</button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderInput = () => {
    const mkKandang = (kdX) => {
      const col   = kdX === 'A' ? '#15803d' : '#0284c7'
      const bg    = kdX === 'A' ? '#f0fdf4' : '#eff6ff'
      const pop   = kdX === 'A' ? cfg.pop_a : cfg.pop_b
      const fd    = kdX === 'A' ? hdA : hdB
      const setFd = kdX === 'A' ? setHdA : setHdB
      const roomsKd  = rooms[kdX]
      const totBtrKd = roomsKd.reduce((a,v) => a+(typeof v==='number'?v:0), 0)
      const matiKd   = roomsKd.filter(v=>v==='mati').length
      const filledKd = roomsKd.filter(v=>v!==null).length
      const hdpKd    = pop > 0 ? (totBtrKd / pop) * 100 : 0

      return (
        <>
          {/* HDP bar */}
          <div style={{ ...S.stat, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
            <div>
              <div style={{ fontSize:10, color:'#6b7280' }}>HDP Live — Kandang {kdX}</div>
              <div style={{ fontSize:20, fontWeight:700, color:hdpKd>=78?col:'#d97706' }}>{f1(hdpKd)}%</div>
            </div>
            <div style={{ textAlign:'right', fontSize:10, color:'#6b7280' }}>
              <div>{totBtrKd} butir | {filledKd}/{kdX==='A'?250:181} kamar</div>
              {matiKd > 0 && <div style={{ color:'#dc2626' }}>{matiKd} kamar mati</div>}
            </div>
          </div>
          <div style={{ ...S.bar, height:5, marginBottom:8 }}>
            <div style={{ background:hdpKd>=78?col:'#d97706', width:`${Math.min(hdpKd,100)}%`, height:'100%', borderRadius:99 }} />
          </div>

          {/* Grid kamar */}
          <div style={{ ...S.card, padding:'9px 7px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <div style={S.sec}>Input per kamar</div>
              <button style={S.btnSm} onClick={() => setRooms(prev => ({ ...prev, [kdX]: new Array(kdX==='A'?250:181).fill(null) }))}>Reset</button>
            </div>
            {renderRoomGrid(kdX)}
          </div>

          {/* Form data panen */}
          <div style={S.card}>
            <div style={S.sec}>Data panen Kandang {kdX}</div>
            <label style={{ ...S.lbl, marginTop:0 }}>Total berat panen (kg) *</label>
            <input style={S.inp} type="number" placeholder="Total kg dipanen" value={fd.kg}
              onChange={e => setFd(p => ({ ...p, kg: e.target.value }))} />
            <div style={{ fontSize:9, color:'#0284c7', marginTop:2, marginBottom:6 }}>
              💡 Berat telur <strong>yang bagus saja</strong> (sudah dipisah dari yang rusak)
            </div>
            <div style={S.g2}>
              <div>
                <label style={S.lbl}>Kematian (ekor)</label>
                <input style={S.inp} type="number" placeholder="Atau tandai di kamar" value={fd.km}
                  onChange={e => setFd(p => ({ ...p, km: e.target.value }))} />
              </div>
              <div>
                <label style={S.lbl}>🥚 Telur Rusak (butir)</label>
                <input style={S.inp} type="number" placeholder="0" value={fd.rusak}
                  onChange={e => setFd(p => ({ ...p, rusak: e.target.value }))} />
                <div style={{ fontSize:9, color:'#9ca3af', marginTop:2 }}>Dicatat, tidak kurangi stok</div>
              </div>
            </div>
            <div style={{ background:bg, borderRadius:8, padding:'7px 10px', margin:'8px 0', fontSize:11 }}>
              <span style={{ fontWeight:600, color:col }}>{totBtrKd} butir dari {filledKd} kamar — HDP {f1(hdpKd)}%</span>
              {(parseInt(fd.rusak)||0)>0 && <span style={{ color:'#d97706', marginLeft:8 }}>| Rusak: {fd.rusak} butir</span>}
            </div>
            <button style={{ ...S.btnGrn, background:col }} onClick={() => simpanPanenKandang(kdX)}>
              💾 Simpan Panen Kandang {kdX}
            </button>
          </div>
        </>
      )
    }

    const mkPakan = () => {
      const pakanHari = pakanHarian.filter(p => p.tanggal === tod())
      const sudahPagi = pakanHari.find(p => p.sesi === 'pagi')
      const sudahSore = pakanHari.find(p => p.sesi === 'sore')
      const tA = (parseFloat(hd.pakanAPagi)||0)+(parseFloat(hd.pakanASore)||0)
      const tB = (parseFloat(hd.pakanBPagi)||0)+(parseFloat(hd.pakanBSore)||0)
      return (
        <div style={S.card}>
          <div style={S.sec}>Konsumsi pakan hari ini</div>

          {/* Status hari ini */}
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            <div style={{ flex:1, background: sudahPagi?'#f0fdf4':'#fff1f2', border:`1px solid ${sudahPagi?'#bbf7d0':'#fecaca'}`, borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#6b7280' }}>Pakan Pagi</div>
              {sudahPagi
                ? <div style={{ fontSize:11, fontWeight:600, color:'#15803d' }}>✅ A:{f1(sudahPagi.kandang_a)}kg B:{f1(sudahPagi.kandang_b)}kg</div>
                : <div style={{ fontSize:11, color:'#dc2626' }}>Belum diinput</div>}
            </div>
            <div style={{ flex:1, background: sudahSore?'#f0fdf4':'#fff1f2', border:`1px solid ${sudahSore?'#bbf7d0':'#fecaca'}`, borderRadius:8, padding:'6px 8px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#6b7280' }}>Pakan Sore</div>
              {sudahSore
                ? <div style={{ fontSize:11, fontWeight:600, color:'#15803d' }}>✅ A:{f1(sudahSore.kandang_a)}kg B:{f1(sudahSore.kandang_b)}kg</div>
                : <div style={{ fontSize:11, color:'#dc2626' }}>Belum diinput</div>}
            </div>
          </div>

          {/* Form pagi */}
          <div style={{ background:'#fffbeb', borderRadius:8, padding:'10px 12px', marginBottom:8, border:'1px solid #fde68a' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#92400e', marginBottom:6 }}>🌅 Pakan Pagi</div>
            <div style={S.g2}>
              <div>
                <label style={{ ...S.lbl, marginTop:0 }}>Kandang A (kg)</label>
                <input style={S.inp} type="number" placeholder="0" value={hd.pakanAPagi}
                  onChange={e => setHd(p => ({ ...p, pakanAPagi: e.target.value }))} />
              </div>
              <div>
                <label style={{ ...S.lbl, marginTop:0 }}>Kandang B (kg)</label>
                <input style={S.inp} type="number" placeholder="0" value={hd.pakanBPagi}
                  onChange={e => setHd(p => ({ ...p, pakanBPagi: e.target.value }))} />
              </div>
            </div>
            <button style={{ ...S.btnGrn, background:'#d97706', marginTop:8 }}
              onClick={() => simpanPakanSesi('pagi')}>
              💾 Simpan Pakan Pagi
            </button>
          </div>

          {/* Form sore */}
          <div style={{ background:'#fff7ed', borderRadius:8, padding:'10px 12px', marginBottom:8, border:'1px solid #fed7aa' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'#9a3412', marginBottom:6 }}>🌆 Pakan Sore</div>
            <div style={S.g2}>
              <div>
                <label style={{ ...S.lbl, marginTop:0 }}>Kandang A (kg)</label>
                <input style={S.inp} type="number" placeholder="0" value={hd.pakanASore}
                  onChange={e => setHd(p => ({ ...p, pakanASore: e.target.value }))} />
              </div>
              <div>
                <label style={{ ...S.lbl, marginTop:0 }}>Kandang B (kg)</label>
                <input style={S.inp} type="number" placeholder="0" value={hd.pakanBSore}
                  onChange={e => setHd(p => ({ ...p, pakanBSore: e.target.value }))} />
              </div>
            </div>
            <button style={{ ...S.btnGrn, background:'#ea580c', marginTop:8 }}
              onClick={() => simpanPakanSesi('sore')}>
              💾 Simpan Pakan Sore
            </button>
          </div>

          {/* Info stok */}
          <div style={{ display:'flex', gap:6, fontSize:10 }}>
            <div style={{ flex:1, background:'#f0fdf4', borderRadius:6, padding:'5px 8px' }}>
              <div style={{ color:'#6b7280' }}>Stok Pakan A</div>
              <div style={{ fontWeight:600, color:'#15803d' }}>{f1(cfg.pakan_a)} kg</div>
            </div>
            <div style={{ flex:1, background:'#eff6ff', borderRadius:6, padding:'5px 8px' }}>
              <div style={{ color:'#6b7280' }}>Stok Pakan B</div>
              <div style={{ fontWeight:600, color:'#0284c7' }}>{f1(cfg.pakan_b)} kg</div>
            </div>
          </div>
          <div style={{ fontSize:10, color:'#6b7280', marginTop:6 }}>Pembelian pakan baru? Catat di menu Pengeluaran</div>
        </div>
      )
    }

    return (
      <>
        {/* Tab bar */}
        <div style={{ display:'flex', background:'#f9fafb', borderRadius:10, padding:3, marginBottom:10, gap:3 }}>
          {[['A','🐔 Kandang A','#15803d'],['B','🐔 Kandang B','#0284c7'],['pakan','🌾 Pakan','#d97706']].map(([k,v,c]) => (
            <button key={k} onClick={() => setKd(k)}
              style={{ flex:1, padding:'8px 0', borderRadius:8, border:'none', fontSize:11, fontWeight:600, cursor:'pointer',
                background: kd===k ? c : 'transparent',
                color: kd===k ? '#fff' : '#6b7280',
                fontFamily:'inherit', lineHeight:1.3 }}>
              {v}
            </button>
          ))}
        </div>

        {/* Konten tab */}
        {kd === 'A' && mkKandang('A')}
        {kd === 'B' && mkKandang('B')}
        {kd === 'pakan' && mkPakan()}
      </>
    )
  }


  const renderKasir = () => {
    const prev = (parseFloat(td.kg) || 0) * (parseFloat(td.harga) || 0)
    const warn = td.metode !== 'tempo' && parseFloat(td.kg) > cfg.stok_kg && td.kg
    return (
      <>
        <div style={S.card}>
          <div style={S.sec}>Kasir POS — penjualan telur</div>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '9px 11px', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Stok gudang</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#15803d' }}>{f1(cfg.stok_kg)} kg</div>
          </div>

          <div style={S.sec}>Metode pembayaran</div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
            {PAY_METHODS.map(p => (
              <button key={p.id} onClick={() => setTd(prev => ({ ...prev, metode: p.id }))}
                style={{ flex: 1, border: `1.5px solid ${td.metode === p.id ? '#15803d' : '#e5e7eb'}`, borderRadius: 8, padding: '8px 4px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: td.metode === p.id ? '#f0fdf4' : '#fff', color: td.metode === p.id ? '#15803d' : '#374151', textAlign: 'center', fontFamily: 'inherit' }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{p.ic}</div>
                <span style={{ fontSize: 9 }}>{p.label}</span>
              </button>
            ))}
          </div>

          {td.metode === 'transfer' && (
            <div style={S.g2}>
              <div><label style={{ ...S.lbl, marginTop: 0 }}>Nama Bank *</label><input style={S.inp} type="text" placeholder="BRI / BNI..." value={td.bank} onChange={e => setTd(p => ({ ...p, bank: e.target.value }))} /></div>
              <div><label style={{ ...S.lbl, marginTop: 0 }}>No. Rekening *</label><input style={S.inp} type="text" placeholder="Nomor rekening" value={td.norek} onChange={e => setTd(p => ({ ...p, norek: e.target.value }))} /></div>
            </div>
          )}
          {td.metode === 'tempo' && (
            <>
              <label style={{ ...S.lbl, marginTop: 0 }}>Tanggal Jatuh Tempo *</label>
              <input style={{ ...S.inp, marginBottom: 8 }} type="date" value={td.tempo} onChange={e => setTd(p => ({ ...p, tempo: e.target.value }))} />
              <div style={{ background: '#fffbeb', borderRadius: 8, padding: '7px 10px', fontSize: 10, color: '#92400e', marginBottom: 8 }}>⚠ Stok & pendapatan belum berubah hingga dilunasi</div>
            </>
          )}
          {td.metode === 'qris' && (
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 10, textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 28 }}>📱</div>
              <div style={{ fontSize: 10, color: '#15803d', marginTop: 4 }}>QRIS — pembayaran langsung diproses</div>
            </div>
          )}

          <div style={S.sec}>Data pelanggan</div>

          {/* Pilih pelanggan langganan */}
          {pelanggan.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ ...S.lbl, marginTop: 0 }}>Pilih Pelanggan Langganan</label>
              <select style={S.sel} onChange={e => {
                const p = pelanggan.find(x => x.id === e.target.value)
                if (p) setTd(prev => ({ ...prev, nama: p.nama, alamat: p.alamat||'', hp: p.hp||'' }))
              }} defaultValue="">
                <option value="">-- Ketik baru atau pilih dari daftar --</option>
                {pelanggan.map(p => <option key={p.id} value={p.id}>{p.nama} {p.hp ? `(${p.hp})` : ''}</option>)}
              </select>
            </div>
          )}

          {[['Nama pelanggan *', 'nama', 'text', 'Nama lengkap'], ['Alamat', 'alamat', 'text', 'Alamat'], ['No. HP', 'hp', 'tel', '08xx']].map(([l, f, t, ph]) => (
            <div key={f}><label style={{ ...S.lbl, marginTop: 0 }}>{l}</label><input style={{ ...S.inp, marginBottom: 6 }} type={t} placeholder={ph} value={td[f] || ''} onChange={e => setTd(p => ({ ...p, [f]: e.target.value }))} /></div>
          ))}

          {/* Simpan ke daftar pelanggan */}
          {td.nama && !pelanggan.find(p => p.nama.toLowerCase() === td.nama.toLowerCase()) && (
            <button onClick={() => { simpanPelanggan(td.nama, td.alamat, td.hp); alert(`${td.nama} disimpan ke daftar pelanggan!`) }}
              style={{ ...S.btnSm, background: '#eff6ff', color: '#1d4ed8', border: '0.5px solid #bfdbfe', marginBottom: 8 }}>
              💾 Simpan ke daftar pelanggan
            </button>
          )}

          <div style={S.sec}>Detail transaksi</div>
          <div style={S.g2}>
            <div><label style={{ ...S.lbl, marginTop: 0 }}>Jumlah (kg)</label><input style={S.inp} type="number" placeholder="0" value={td.kg || ''} onChange={e => setTd(p => ({ ...p, kg: e.target.value }))} /></div>
            <div><label style={{ ...S.lbl, marginTop: 0 }}>Harga/kg (Rp)</label><input style={S.inp} type="number" value={td.harga || ''} onChange={e => setTd(p => ({ ...p, harga: e.target.value }))} /></div>
          </div>
          {prev > 0 && <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', marginTop: 7, display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: '#6b7280' }}>Total</span><span style={{ fontSize: 16, fontWeight: 600, color: '#15803d' }}>{rp(prev)}</span></div>}
          {warn && <div style={{ background: '#fff1f2', borderRadius: 8, padding: 8, marginTop: 6, fontSize: 11, color: '#dc2626', textAlign: 'center' }}>Stok Telur Tidak Mencukupi! ({f1(cfg.stok_kg)} kg)</div>}
          <button style={S.btnGrn} onClick={prosesJual}>🧾 Proses & cetak struk</button>
        </div>

        {piutang.length > 0 && (
          <div style={S.card}>
            <div style={S.sec}>Tagihan tempo belum lunas</div>
            {piutang.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                <div><div style={{ fontSize: 11, fontWeight: 600 }}>{p.nama} — {p.kg} kg</div><div style={{ fontSize: 10, color: '#d97706' }}>JT: {p.tempo}</div></div>
                <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 600, color: '#d97706' }}>{rp(p.total)}</div><button onClick={() => lunasTempo(p.id)} style={{ background: '#15803d', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer', marginTop: 2 }}>Lunasi</button></div>
              </div>
            ))}
          </div>
        )}

        {slog.length > 0 && (
          <div style={S.card}>
            <div style={S.sec}>Riwayat penjualan</div>
            {slog.slice(0, 5).map(t => {
              const pm = PAY_METHODS.find(p => p.id === t.metode)
              return (
                <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{t.no}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{t.nama} · {t.kg} kg</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                      <span style={{ ...S.tag, background: t.lunas === false ? '#fffbeb' : '#f0fdf4', color: t.lunas === false ? '#92400e' : '#166534' }}>{t.lunas === false ? 'Tempo' : 'Lunas'}</span>
                      {pm && <span style={{ ...S.tag, background: '#f9fafb', color: '#6b7280' }}>{pm.ic} {pm.label}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: '#15803d' }}>{rp(t.total)}</div>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 3 }}>
                      <button onClick={() => setReceipt(t)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#0284c7', cursor: 'pointer' }}>Struk</button>
                      <button onClick={() => printStruk(t)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#15803d', cursor: 'pointer' }}>🖨 Print</button>
                      <button onClick={() => kirimWAStruk(t)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#16a34a', cursor: 'pointer' }}>💬 WA</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </>
    )
  }

  const renderKeluar = () => (
    <>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Manajemen pengeluaran</div>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Input & riwayat semua biaya operasional</div>
      <div style={S.card}>
        <div style={S.sec}>Ringkasan per kategori</div>
        <div style={S.g3}>
          {KATS.map(k => (
            <div key={k.id} style={{ ...S.stat, borderTop: `2px solid ${k.c}` }}>
              <div style={{ fontSize: 13 }}>{k.ic}</div>
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 2 }}>{k.label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: k.c }}>{rp(ec[k.id])}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#fff1f2', borderRadius: 8, padding: '7px 10px', marginTop: 7, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Total pengeluaran</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{rp(totalExpense)}</span>
        </div>
      </div>
      <div style={S.card}>
        <div style={S.sec}>Tambah pengeluaran</div>
        <label style={{ ...S.lbl, marginTop: 0 }}>Kategori</label>
        <select style={{ ...S.sel, marginBottom: 8 }} value={ed.kat} onChange={e => setEd(p => ({ ...p, kat: e.target.value }))}>
          {KATS.map(k => <option key={k.id} value={k.id}>{k.ic} {k.label}</option>)}
        </select>
        <div style={{ ...S.g2, marginBottom: 8 }}>
          <div><label style={{ ...S.lbl, marginTop: 0 }}>Tanggal</label><input style={S.inp} type="date" value={ed.tgl} onChange={e => setEd(p => ({ ...p, tgl: e.target.value }))} /></div>
          <div><label style={{ ...S.lbl, marginTop: 0 }}>Jumlah (Rp)</label><input style={S.inp} type="number" placeholder="0" value={ed.jml || ''} onChange={e => setEd(p => ({ ...p, jml: e.target.value }))} /></div>
        </div>
        <label style={{ ...S.lbl, marginTop: 0 }}>Keterangan</label>
        <input style={{ ...S.inp, marginBottom: 8 }} type="text" placeholder="Deskripsi pengeluaran..." value={ed.ket || ''} onChange={e => setEd(p => ({ ...p, ket: e.target.value }))} />
        {ed.kat === 'pakan' && (
          <>
            <div style={S.g2}>
              <div><label style={{ ...S.lbl, marginTop: 0 }}>Qty pakan (kg)</label><input style={S.inp} type="number" placeholder="0" value={ed.qty || ''} onChange={e => setEd(p => ({ ...p, qty: e.target.value }))} /></div>
              <div><label style={{ ...S.lbl, marginTop: 0 }}>Kandang</label>
                <select style={S.sel} value={ed.kdPakan} onChange={e => setEd(p => ({ ...p, kdPakan: e.target.value }))}>
                  <option value="A">Kandang A</option>
                  <option value="B">Kandang B</option>
                </select>
              </div>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '7px 10px', margin: '6px 0 8px', fontSize: 10, color: '#15803d' }}>✓ Stok pakan bertambah otomatis</div>
          </>
        )}
        <button style={S.btnGrn} onClick={simpanKeluar}>💾 Simpan pengeluaran</button>
      </div>
      <div style={S.card}>
        <div style={S.sec}>Riwayat pengeluaran</div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8, background: '#f9fafb', padding: 3, borderRadius: 8 }}>
          {[['all', 'Semua'], ...KATS.map(k => [k.id, k.label.split('/')[0]])].map(([k, v]) => (
            <button key={k} onClick={() => setEf(k)} style={{ border: 'none', borderRadius: 6, padding: '5px 9px', fontSize: 10, fontWeight: 600, cursor: 'pointer', background: ef === k ? '#fff' : 'transparent', color: ef === k ? '#15803d' : '#6b7280', fontFamily: 'inherit' }}>{v}</button>
          ))}
        </div>
        {(ef === 'all' ? elog : elog.filter(e => e.kat === ef)).length === 0
          ? <div style={{ textAlign: 'center', padding: 16, fontSize: 12, color: '#9ca3af' }}>Belum ada pengeluaran</div>
          : (ef === 'all' ? elog : elog.filter(e => e.kat === ef)).slice(0, 10).map(e => {
            const ki = katOf(e.kat)
            return (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: ki.c + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{ki.ic}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{ki.label}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{e.tgl} · {e.ket}{e.qty > 0 ? ` · +${e.qty}kg Kand.${e.kdPakan}` : ''}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 12, color: '#dc2626' }}>{rp(e.jml)}</div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                    <button onClick={() => printKwitansi(e)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#15803d', cursor: 'pointer' }}>🖨 Print</button>
                    <button onClick={() => kirimWAKwitansi(e)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#16a34a', cursor: 'pointer' }}>💬 WA</button>
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </>
  )

  const renderLaporan = () => {
    const rows = monthlyRows()
    const tot = rows.reduce((a, r) => ({ kg: a.kg + r.kg, btr: a.btr + r.btr, inc: a.inc + r.inc, exp: a.exp + r.exp, mati: a.mati + r.mati, pkA: a.pkA + r.pkA, pkB: a.pkB + r.pkB }), { kg: 0, btr: 0, inc: 0, exp: 0, mati: 0, pkA: 0, pkB: 0 })
    const ecMap = ecByCat()
    const labaBersih = totalIncome - totalExpense
    return (
      <>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Laporan pertanggungjawaban</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Ringkasan tahunan {cfg.nama_bumdes} — 2026</div>

        {/* Tombol Print & Export */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={printLaporan}
            style={{ flex: 1, background: '#15803d', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            🖨 Print / PDF
          </button>
          <button onClick={exportCSV}
            style={{ flex: 1, background: '#fff', color: '#15803d', border: '0.5px solid #15803d', borderRadius: 8, padding: '10px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            📥 Export CSV
          </button>
        </div>

        <div style={{ ...S.card, padding: '10px 8px', overflowX: 'auto' }}>
          <div style={S.sec}>Ringkasan per bulan</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, minWidth: 480 }}>
            <thead><tr>{['Bulan','Prod(kg)','Butir','Pendapatan','Pengeluaran','Laba','Pakan A','Pakan B','HDP A','HDP B','Mati'].map(h => <th key={h} style={{ background: '#15803d', color: '#fff', padding: '5px 6px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const hA = r.hAn > 0 ? f1(r.hA / r.hAn) : '-', hB = r.hBn > 0 ? f1(r.hB / r.hBn) : '-', lb2 = r.inc - r.exp
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                    <td style={{ padding: '5px 6px', fontWeight: 600 }}>{BULAN[i].slice(0, 3)}</td>
                    <td style={{ padding: '5px 6px' }}>{f1(r.kg)}</td>
                    <td style={{ padding: '5px 6px' }}>{r.btr}</td>
                    <td style={{ padding: '5px 6px', color: r.inc > 0 ? '#0284c7' : '#9ca3af' }}>{r.inc > 0 ? rp(r.inc) : '0'}</td>
                    <td style={{ padding: '5px 6px', color: r.exp > 0 ? '#dc2626' : '#9ca3af' }}>{r.exp > 0 ? rp(r.exp) : '0'}</td>
                    <td style={{ padding: '5px 6px', color: lb2 > 0 ? '#15803d' : lb2 < 0 ? '#dc2626' : '#9ca3af', fontWeight: lb2 !== 0 ? 600 : 400 }}>{rp(lb2)}</td>
                    <td style={{ padding: '5px 6px', color: r.pkA > 0 ? '#d97706' : '#9ca3af' }}>{f1(r.pkA)}</td>
                    <td style={{ padding: '5px 6px', color: r.pkB > 0 ? '#d97706' : '#9ca3af' }}>{f1(r.pkB)}</td>
                    <td style={{ padding: '5px 6px', color: parseFloat(hA) >= 78 ? '#15803d' : hA !== '-' ? '#dc2626' : '#9ca3af' }}>{hA}</td>
                    <td style={{ padding: '5px 6px', color: parseFloat(hB) >= 78 ? '#15803d' : hB !== '-' ? '#dc2626' : '#9ca3af' }}>{hB}</td>
                    <td style={{ padding: '5px 6px', color: r.mati > 0 ? '#dc2626' : '#9ca3af' }}>{r.mati}</td>
                  </tr>
                )
              })}
              <tr style={{ background: '#f3f4f6', borderTop: '2px solid #15803d' }}>
                {[['TOTAL', '#111', 600], [f1(tot.kg), '#111', 600], [tot.btr, '#111', 600], [rp(tot.inc), '#0284c7', 600], [rp(tot.exp), '#dc2626', 600], [rp(tot.inc - tot.exp), tot.inc - tot.exp >= 0 ? '#15803d' : '#dc2626', 700], [f1(tot.pkA), '#d97706', 600], [f1(tot.pkB), '#d97706', 600], ['—','#9ca3af',400],['—','#9ca3af',400],[tot.mati,'#dc2626',600]].map(([v, c, fw], idx) => (
                  <td key={idx} style={{ padding: '5px 6px', color: c, fontWeight: fw }}>{v}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div style={S.card}>
          <div style={S.sec}>Rincian pengeluaran per kategori</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr>{['Kategori','Nominal (Rp)','% dari total'].map(h => <th key={h} style={{ background: '#15803d', color: '#fff', padding: '5px 6px', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {KATS.map((k, i) => (
                <tr key={k.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '5px 6px' }}>{k.ic} {k.label}</td>
                  <td style={{ padding: '5px 6px', color: k.c, fontWeight: 600 }}>{ecMap[k.id] ? rp(ecMap[k.id]) : '-'}</td>
                  <td style={{ padding: '5px 6px' }}>{totalExpense > 0 ? f1((ecMap[k.id] || 0) / totalExpense * 100) + '%' : '0%'}</td>
                </tr>
              ))}
              <tr style={{ background: '#f3f4f6', borderTop: '2px solid #15803d' }}>
                <td style={{ padding: '5px 6px', fontWeight: 600 }}>TOTAL</td>
                <td style={{ padding: '5px 6px', fontWeight: 600 }}>{rp(totalExpense)}</td>
                <td style={{ padding: '5px 6px', fontWeight: 600 }}>100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SHU pindah ke Laporan */}
        <div style={S.card}>
          <div style={S.sec}>Alokasi SHU tahunan</div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
            Dari laba bersih: <strong style={{ color: labaBersih >= 0 ? '#15803d' : '#dc2626' }}>{rp(labaBersih)}</strong>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead><tr>{['Item SHU','%','Nominal (Rp)'].map(h => <th key={h} style={{ background: '#15803d', color: '#fff', padding: '5px 6px', textAlign: 'left', fontWeight: 600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {SHU.map((x, i) => (
                <tr key={x.l} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '5px 6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c, flexShrink: 0 }} />
                      {x.l}
                    </div>
                  </td>
                  <td style={{ padding: '5px 6px' }}>{x.p}%</td>
                  <td style={{ padding: '5px 6px', fontWeight: 600, color: x.c }}>{rp(labaBersih * x.p / 100)}</td>
                </tr>
              ))}
              <tr style={{ background: '#f3f4f6', borderTop: '2px solid #15803d' }}>
                <td style={{ padding: '5px 6px', fontWeight: 600 }}>TOTAL</td>
                <td style={{ padding: '5px 6px', fontWeight: 600 }}>100%</td>
                <td style={{ padding: '5px 6px', fontWeight: 600, color: '#15803d' }}>{rp(labaBersih)}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', marginTop: 8, fontSize: 10, color: '#6b7280' }}>
            Distribusi SHU berdasarkan AD/ART BUMDes Widyatama
          </div>
        </div>
      </>
    )
  }

  const renderHist = () => {
    const all = [
      ...hlog.map(h => ({ ...h, type: 'panen' })),
      ...slog.map(t => ({ ...t, type: 'jual' })),
      ...elog.map(e => ({ ...e, type: 'keluar' })),
    ].sort((a, b) => b.id - a.id)
    const logs = hf === 'all' ? all : all.filter(l => l.type === hf)
    const panenLogs = hlog.slice().sort((a,b) => new Date(a.tgl2)-new Date(b.tgl2))

    // Hitung rekap per kamar dari semua panen
    const maxRA = 250, maxRB = 181
    const kamRecapA = new Array(maxRA).fill(null).map(() => ({0:0,1:0,2:0,3:0,mati:0,total:0}))
    const kamRecapB = new Array(maxRB).fill(null).map(() => ({0:0,1:0,2:0,3:0,mati:0,total:0}))
    hlog.forEach(h => {
      if (!Array.isArray(h.roomDetail)) return
      const recap = h.kd === 'A' ? kamRecapA : kamRecapB
      h.roomDetail.forEach((v, i) => {
        if (i >= recap.length || v === null || v === undefined) return
        recap[i].total++
        if (v === 'mati') recap[i].mati++
        else if (typeof v === 'number') recap[i][v] = (recap[i][v]||0) + 1
      })
    })

    // Chart data — produksi per hari (max 30 hari terakhir)
    const chartData = panenLogs.slice(-30)
    const maxBtr = Math.max(...chartData.map(h => h.tb), 1)

    return (
      <>
        <div style={{ display: 'flex', gap: 3, marginBottom: 8, background: '#f9fafb', padding: 3, borderRadius: 8 }}>
          {[['all','Semua'],['panen','Panen'],['jual','Penjualan'],['keluar','Pengeluaran']].map(([k, v]) => (
            <button key={k} onClick={() => setHf(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer', background: hf === k ? '#15803d' : 'transparent', color: hf === k ? '#fff' : '#6b7280', fontFamily: 'inherit' }}>{v}</button>
          ))}
        </div>

        {/* ── REKAP PRODUKSI — hanya tampil saat filter Panen ── */}
        {hf === 'panen' && hlog.length > 0 && (
          <>
            {/* 1. Tabel harian */}
            <div style={{ ...S.card, overflowX: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={S.sec}>📋 Tabel produksi harian</div>
                <div style={{ display: 'flex', gap: 3, background: '#f9fafb', padding: 3, borderRadius: 6 }}>
                  {[['all','Semua'],['A','Kand A'],['B','Kand B']].map(([k,v]) => (
                    <button key={k} onClick={() => setTabelKd(k)}
                      style={{ border: 'none', borderRadius: 5, padding: '4px 8px', fontSize: 9, fontWeight: 600, cursor: 'pointer', background: tabelKd===k?(k==='A'?'#15803d':k==='B'?'#0284c7':'#374151'):'transparent', color: tabelKd===k?'#fff':'#6b7280', fontFamily: 'inherit' }}>{v}</button>
                  ))}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, minWidth: 420 }}>
                <thead><tr>
                  {['Tanggal','Kand','Butir','Layak Jual','Kg','HDP%','Pakan(kg)','Rusak','Mati'].map(h => (
                    <th key={h} style={{ background: '#15803d', color: '#fff', padding: '4px 5px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {(tabelKd==='all'?hlog:hlog.filter(h=>h.kd===tabelKd)).map((h, i) => {
                    const layakJual = h.tb - (h.rusak||0)
                    return (
                      <tr key={h.id} style={{ background: i%2===0?'#fff':'#f9fafb' }}>
                        <td style={{ padding: '4px 5px', whiteSpace: 'nowrap' }}>{h.tgl}</td>
                        <td style={{ padding: '4px 5px' }}>
                          <span style={{ background: h.kd==='A'?'#dcfce7':'#dbeafe', color: h.kd==='A'?'#166534':'#1e40af', borderRadius: 3, padding: '1px 5px', fontSize: 9, fontWeight: 600 }}>{h.kd}</span>
                        </td>
                        <td style={{ padding: '4px 5px', fontWeight: 600 }}>{h.tb}</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700, color: '#15803d' }}>
                          {layakJual}
                          {(h.rusak||0) > 0 && <span style={{ fontSize: 8, color: '#9ca3af', marginLeft: 2 }}>(-{h.rusak})</span>}
                        </td>
                        <td style={{ padding: '4px 5px' }}>{f1(h.kg)}</td>
                        <td style={{ padding: '4px 5px', color: h.hdp>=78?'#15803d':'#dc2626', fontWeight: 600 }}>{f1(h.hdp)}%</td>
                        <td style={{ padding: '4px 5px', color: '#d97706' }}>{f1((h.pakanA||0)+(h.pakanB||0))}</td>
                        <td style={{ padding: '4px 5px', color: (h.rusak||0)>0?'#d97706':'#9ca3af' }}>{h.rusak||0}</td>
                        <td style={{ padding: '4px 5px', color: (h.km||0)>0?'#dc2626':'#9ca3af' }}>{h.km||0}</td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Baris total */}
                <tfoot>
                  {(() => {
                    const flog = tabelKd==='all'?hlog:hlog.filter(h=>h.kd===tabelKd)
                    return (
                      <tr style={{ background: '#f3f4f6', borderTop: '2px solid #15803d' }}>
                        <td colSpan={2} style={{ padding: '4px 5px', fontWeight: 700, fontSize: 10 }}>TOTAL {tabelKd!=='all'?`Kand ${tabelKd}`:''}</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700 }}>{flog.reduce((a,h)=>a+h.tb,0)}</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700, color: '#15803d' }}>{flog.reduce((a,h)=>a+(h.tb-(h.rusak||0)),0)}</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700 }}>{f1(flog.reduce((a,h)=>a+h.kg,0))}</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700, color: '#15803d' }}>{flog.length>0?f1(flog.reduce((a,h)=>a+h.hdp,0)/flog.length):0}%</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700, color: '#d97706' }}>{f1(flog.reduce((a,h)=>a+(h.pakanA||0)+(h.pakanB||0),0))}</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700, color: '#d97706' }}>{flog.reduce((a,h)=>a+(h.rusak||0),0)}</td>
                        <td style={{ padding: '4px 5px', fontWeight: 700, color: '#dc2626' }}>{flog.reduce((a,h)=>a+(h.km||0),0)}</td>
                      </tr>
                    )
                  })()}
                </tfoot>
              </table>
              {/* Keterangan */}
              <div style={{ fontSize: 9, color: '#6b7280', marginTop: 6, padding: '4px 0' }}>
                💡 <strong>Layak Jual</strong> = Total Butir − Telur Rusak &nbsp;|&nbsp; <strong>HDP%</strong> = rata-rata semua panen
              </div>
            </div>

            {/* 2. Chart produksi per hari */}
            {chartData.length > 0 && (
              <div style={S.card}>
                <div style={S.sec}>📈 Grafik produksi harian (30 panen terakhir)</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, overflowX: 'auto', paddingBottom: 4 }}>
                  {chartData.map((h, i) => {
                    const pct = h.tb / maxBtr
                    const col = h.kd === 'A' ? '#15803d' : '#0284c7'
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 18, flex: '0 0 auto' }}>
                        <div style={{ fontSize: 7, color: '#9ca3af', marginBottom: 1 }}>{h.tb}</div>
                        <div style={{ width: 14, height: Math.max(4, pct * 60), background: col, borderRadius: '2px 2px 0 0' }} title={`${h.tgl}: ${h.tb} butir`} />
                        <div style={{ fontSize: 6, color: '#9ca3af', marginTop: 1, transform: 'rotate(-45deg)', transformOrigin: 'top left', width: 20 }}>
                          {h.tgl.split(' ')[0]}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16, fontSize: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, background: '#15803d', borderRadius: 2 }} /> Kandang A</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, background: '#0284c7', borderRadius: 2 }} /> Kandang B</div>
                </div>
              </div>
            )}

            {/* 3. Rekap per kamar */}
            {hlog.some(h => Array.isArray(h.roomDetail)) && (
              <div style={S.card}>
                <div style={S.sec}>🏠 Rekap produksi per kamar</div>
                <div style={{ display: 'flex', gap: 3, marginBottom: 8, background: '#f9fafb', padding: 3, borderRadius: 8 }}>
                  {['A', 'B'].map(k => (
                    <button key={k} onClick={() => setKd(k)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 11, cursor: 'pointer', background: kd === k ? (k==='A'?'#15803d':'#0284c7') : 'transparent', color: kd === k ? '#fff' : '#6b7280', fontFamily: 'inherit' }}>
                      Kandang {k}
                    </button>
                  ))}
                </div>
                {(() => {
                  const recap = kd === 'A' ? kamRecapA : kamRecapB
                  const maxR = kd === 'A' ? maxRA : maxRB
                  const col = kd === 'A' ? '#15803d' : '#0284c7'
                  // Kamar problematis: sering 0 butir atau tidak terisi
                  const sorted0 = recap.map((r,i) => ({i, pct0: r.total>0?r[0]/r.total:0, tot: r.total})).filter(x=>x.tot>0).sort((a,b)=>b.pct0-a.pct0).slice(0,5)
                  const sorted2 = recap.map((r,i) => ({i, pct2: r.total>0?r[2]/r.total:0, tot: r.total})).filter(x=>x.tot>0).sort((a,b)=>b.pct2-a.pct2).slice(0,5)
                  return (
                    <>
                      {/* Grid mini semua kamar */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: 2, marginBottom: 10 }}>
                        {Array(maxR).fill(0).map((_,i) => {
                          const r = recap[i]
                          const best = r.total > 0 ? (r[2]>r[1]&&r[2]>r[0] ? 2 : r[1]>r[0] ? 1 : 0) : -1
                          const bg = best===2?'#dcfce7':best===1?'#dbeafe':best===0?'#f9fafb':'#f3f4f6'
                          const fc = best===2?'#166534':best===1?'#1d4ed8':best===0?'#6b7280':'#d1d5db'
                          return (
                            <div key={i} style={{ background: bg, borderRadius: 3, padding: '2px 1px', textAlign: 'center', border: `1px solid ${fc}33` }} title={`K-${i+1}: 0=${r[0]} 1=${r[1]} 2=${r[2]} 3=${r[3]}`}>
                              <div style={{ fontSize: 7, color: '#9ca3af' }}>{i+1}</div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: fc }}>{best>=0?best:'—'}</div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Warna legend */}
                      <div style={{ display: 'flex', gap: 8, fontSize: 9, color: '#6b7280', marginBottom: 10, flexWrap: 'wrap' }}>
                        {[['#dcfce7','#166534','Dominan 2 butir'],['#dbeafe','#1d4ed8','Dominan 1 butir'],['#f9fafb','#6b7280','Dominan 0 butir']].map(([bg,c,l]) => (
                          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <div style={{ width: 10, height: 10, background: bg, border: `1px solid ${c}33`, borderRadius: 2 }} />{l}
                          </div>
                        ))}
                      </div>

                      {/* Top 5 kamar terbaik & perlu perhatian */}
                      <div style={S.g2}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#15803d', marginBottom: 5 }}>🏆 Top 5 terbaik (dominan 2 butir)</div>
                          {sorted2.map(x => (
                            <div key={x.i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                              <span>K-{x.i+1}</span>
                              <span style={{ color: '#15803d', fontWeight: 600 }}>{Math.round(x.pct2*100)}% 2-butir</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', marginBottom: 5 }}>⚠ Perlu perhatian (sering 0)</div>
                          {sorted0.map(x => (
                            <div key={x.i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '3px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                              <span>K-{x.i+1}</span>
                              <span style={{ color: '#dc2626', fontWeight: 600 }}>{Math.round(x.pct0*100)}% kosong</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </>
        )}
        {/* ── END REKAP ── */}
        {logs.length === 0 ? <div style={{ ...S.card, textAlign: 'center', padding: 20, color: '#9ca3af', fontSize: 12 }}>Belum ada riwayat</div> :
          logs.map(log => {
            if (log.type === 'panen') return (
              <div key={log.id} style={{ ...S.card, padding: '9px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ ...S.tag, background: '#dcfce7', color: '#166534' }}>Panen</span>
                    <span style={{ ...S.tag, background: log.kd === 'A' ? '#dcfce7' : '#dbeafe', color: log.kd === 'A' ? '#166534' : '#1e40af', marginLeft: 4 }}>{log.kd}</span>
                    <div style={{ fontSize: 11, marginTop: 3 }}>{log.tb} butir · {f1(log.kg)} kg</div>
                    <div style={{ fontSize: 10, color: log.hdp >= 78 ? '#15803d' : '#dc2626' }}>HDP {f1(log.hdp)}%</div>
                    {(log.pakanA || 0) > 0 || (log.pakanB || 0) > 0 ? <div style={{ fontSize: 10, color: '#d97706' }}>🌾 Pakan A:{f1(log.pakanA || 0)}kg B:{f1(log.pakanB || 0)}kg</div> : null}
                    {log.km > 0 && <div style={{ fontSize: 10, color: '#dc2626' }}>Kematian: {log.km} ekor</div>}
                    {(log.rusak || 0) > 0 && <div style={{ fontSize: 10, color: '#d97706' }}>Telur rusak: {log.rusak} butir</div>}
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{log.by}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 4 }}>{log.tgl}</div>
                    {log.roomDetail && (
                      <button onClick={() => setRekapPopup(log)}
                        style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: 6, padding: '4px 8px', fontSize: 9, fontWeight: 600, color: '#15803d', cursor: 'pointer' }}>
                        📊 Rekap Kamar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
            if (log.type === 'jual') {
              const pm = PAY_METHODS.find(p => p.id === log.metode)
              return (
                <div key={log.id} style={{ ...S.card, padding: '9px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ ...S.tag, background: '#dbeafe', color: '#1e40af' }}>Jual</span>
                      {log.lunas === false && <span style={{ ...S.tag, background: '#fffbeb', color: '#92400e', marginLeft: 4 }}>Tempo</span>}
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 3 }}>{log.no}</div>
                      <div style={{ fontSize: 11 }}>{log.nama} · {log.kg} kg</div>
                      {pm && <div style={{ fontSize: 10, color: '#9ca3af' }}>{pm.ic} {pm.label}</div>}
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{log.by}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{log.tgl}</div>
                      <div style={{ fontWeight: 600, color: '#15803d' }}>{rp(log.total)}</div>
                      <button onClick={() => setReceipt(log)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#0284c7', cursor: 'pointer' }}>Struk</button>
                    </div>
                  </div>
                </div>
              )
            }
            const ki = katOf(log.kat)
            return (
              <div key={log.id} style={{ ...S.card, padding: '9px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 6, background: ki.c + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>{ki.ic}</div>
                    <div>
                      <span style={{ ...S.tag, background: '#fff1f2', color: '#dc2626' }}>Keluar</span>
                      <div style={{ fontSize: 11, marginTop: 2 }}>{ki.label} · {log.ket}</div>
                      {log.qty > 0 && <div style={{ fontSize: 10, color: '#15803d' }}>+{log.qty}kg pakan Kand.{log.kdPakan}</div>}
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{log.tgl} · {log.by}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, color: '#dc2626' }}>{rp(log.jml)}</div>
                </div>
              </div>
            )
          })
        }
      </>
    )
  }

  const SettingPage = () => {
    const [sv, setSv] = useState({
      nama_bumdes: cfg.nama_bumdes || '',
      desa: cfg.desa || '',
      kecamatan: cfg.kecamatan || '',
      kabupaten: cfg.kabupaten || '',
      kas: Math.round(cfg.kas || 0),
      modal_awal: Math.round(cfg.modal_awal || 0),
      pop_a: cfg.pop_a || 500,
      pop_b: cfg.pop_b || 362,
      pakan_a: cfg.pakan_a || 200,
      pakan_b: cfg.pakan_b || 150,
      stok_kg: cfg.stok_kg || 0,
    })
    const [saving, setSaving] = useState(false)
    const [np, setNp] = useState({ nama: '', alamat: '', hp: '' })

    async function handleSimpan() {
      setSaving(true)
      try {
        for (const [k, v] of Object.entries(sv)) {
          await saveCfg(k, v)
        }
        setCfg(prev => ({ ...prev, ...sv,
          kas: +sv.kas, pop_a: +sv.pop_a, pop_b: +sv.pop_b,
          pakan_a: +sv.pakan_a, pakan_b: +sv.pakan_b,
          stok_kg: +sv.stok_kg, modal_awal: +sv.modal_awal,
        }))
        alert('Pengaturan berhasil disimpan!')
      } catch(err) {
        alert('Gagal simpan: ' + err.message)
      }
      setSaving(false)
    }

    return (
      <>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Pengaturan</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Konfigurasi sistem BUMDes</div>
        <div style={S.card}>
          <div style={S.sec}>Informasi BUMDes</div>
          {[['Nama BUMDes','nama_bumdes','text'],['Desa','desa','text'],['Kecamatan','kecamatan','text'],['Kabupaten','kabupaten','text']].map(([l, k, t]) => (
            <div key={k}>
              <label style={S.lbl}>{l}</label>
              <input style={S.inp} type={t||'text'} value={sv[k]||''} onChange={e => setSv(p => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sec}>Keuangan & kas</div>

          <label style={{ ...S.lbl, marginTop: 0 }}>💰 Modal Awal / Saldo Sebelum Pakai Aplikasi (Rp)</label>
          <input style={S.inp} type="number" placeholder="0" value={sv.modal_awal}
            onChange={e => setSv(p => ({ ...p, modal_awal: e.target.value }))} />
          <div style={{ background: '#fffbeb', borderRadius: 7, padding: '7px 10px', fontSize: 10, color: '#92400e', margin: '5px 0 10px' }}>
            💡 Isi dengan total uang BUMDes yang sudah ada <strong>sebelum</strong> aplikasi dipakai —
            termasuk pendapatan penjualan telur yang belum tercatat. Bukan pendapatan, murni modal awal.
          </div>

          <label style={S.lbl}>Saldo kas manual (Rp)</label>
          <input style={S.inp} type="number" value={sv.kas}
            onChange={e => setSv(p => ({ ...p, kas: e.target.value }))} />

          <div style={{ background: '#f0fdf4', borderRadius: 7, padding: '7px 10px', fontSize: 10, color: '#15803d', marginTop: 6 }}>
            <strong>Saldo kas aktual:</strong> {rp((+sv.modal_awal||0) + totalIncome - totalExpense)}<br/>
            <span style={{ color: '#6b7280' }}>= Modal Awal ({rp(+sv.modal_awal||0)}) + Pendapatan ({rp(totalIncome)}) − Pengeluaran ({rp(totalExpense)})</span>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.sec}>Stok Telur</div>
          <label style={{ ...S.lbl, marginTop: 0 }}>Stok Telur Saat Ini (kg)</label>
          <input style={S.inp} type="number" placeholder="0" value={sv.stok_kg}
            onChange={e => setSv(p => ({ ...p, stok_kg: e.target.value }))} />
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>
            Isi jika ada stok telur yang belum terjual sebelum aplikasi digunakan.
            Nilai ini akan otomatis <strong>bertambah</strong> setiap kali input panen disimpan.
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '7px 10px', marginTop: 8, fontSize: 11 }}>
            <div style={{ fontWeight: 600, color: '#15803d' }}>Stok telur di dashboard saat ini:</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#15803d' }}>{f1(cfg.stok_kg)} kg</div>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.sec}>Populasi & stok pakan</div>
          <div style={S.g2}>
            {[['Populasi A (ekor)','pop_a'],['Populasi B (ekor)','pop_b'],['Stok Pakan A (kg)','pakan_a'],['Stok Pakan B (kg)','pakan_b']].map(([l, k]) => (
              <div key={k}>
                <label style={S.lbl}>{l}</label>
                <input style={S.inp} type="number" value={sv[k]||0} onChange={e => setSv(p => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sec}>Manajemen pengguna</div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #f3f4f6' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: ROLES[u.role]?.bg || '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, color: ROLES[u.role]?.c || '#374151' }}>{u.avatar}</div>
                <div><div style={{ fontSize: 12, fontWeight: 600 }}>{u.nama}</div><div style={{ fontSize: 10, color: '#9ca3af' }}>@{u.username}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: ROLES[u.role]?.bg, color: ROLES[u.role]?.c, borderRadius: 4, padding: '2px 7px', fontSize: 9, fontWeight: 600 }}>{ROLES[u.role]?.label}</span>
                {u.id !== user.id
                  ? <button onClick={() => delUser(u.id)} style={{ background: '#fff1f2', color: '#dc2626', border: 'none', borderRadius: 5, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}>Hapus</button>
                  : <span style={{ fontSize: 10, color: '#9ca3af' }}>Anda</span>}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <div style={{ ...S.sec, marginBottom: 6 }}>Tambah pengguna baru</div>
            {[['Nama lengkap','nama','text'],['Username','username','text'],['Password','password','password']].map(([l, f, t]) => (
              <div key={f}><label style={S.lbl}>{l}</label><input style={{ ...S.inp, marginBottom: 4 }} type={t} placeholder={l} value={nu[f]||''} onChange={e => setNu(p => ({ ...p, [f]: e.target.value }))} /></div>
            ))}
            <label style={S.lbl}>Role</label>
            <select style={{ ...S.sel, marginBottom: 8 }} value={nu.role} onChange={e => setNu(p => ({ ...p, role: e.target.value }))}>
              <option value="abk">ABK (Peternak + Kasir)</option>
              <option value="admin">Admin</option>
            </select>
            <button style={{ ...S.btnGrn, marginTop: 0 }} onClick={addUser}>👤 Tambah pengguna</button>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.sec}>Daftar Pelanggan Langganan ({pelanggan.length})</div>
          <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>Kelola di sini, pilih di menu Kasir saat transaksi</div>

          {/* Form tambah pelanggan */}
          {[['Nama *','nama','text','Nama toko/pelanggan'],['Alamat','alamat','text','Alamat'],['No. HP','hp','tel','08xx']].map(([l,f,t,ph]) => (
            <div key={f}><label style={S.lbl}>{l}</label><input style={S.inp} type={t} placeholder={ph} value={np[f]||''} onChange={e => setNp(p => ({ ...p, [f]: e.target.value }))} /></div>
          ))}
          <button style={{ ...S.btnGrn, marginTop: 8, background: '#1d4ed8' }} onClick={() => {
            if (!np.nama.trim()) { alert('Nama wajib diisi!'); return }
            simpanPelanggan(np.nama, np.alamat, np.hp)
            const savedName = np.nama
            setNp({ nama: '', alamat: '', hp: '' })
            alert(`${savedName} berhasil ditambahkan!`)
          }}>➕ Tambah Pelanggan</button>

          {/* Daftar pelanggan */}
          {pelanggan.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Daftar tersimpan:</div>
              {pelanggan.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{p.nama}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }}>{p.hp||'-'}{p.alamat ? ` · ${p.alamat}` : ''}</div>
                  </div>
                  <button onClick={() => { if(window.confirm(`Hapus ${p.nama}?`)) hapusPelanggan(p.id) }}
                    style={{ ...S.btnSm, background: '#fff1f2', color: '#dc2626', border: '0.5px solid #fecaca' }}>Hapus</button>
                </div>
              ))}
            </div>
          )}
          {pelanggan.length === 0 && <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: '#9ca3af' }}>Belum ada pelanggan tersimpan</div>}
        </div>

        <button style={{ ...S.btnGrn, opacity: saving ? 0.7 : 1 }} onClick={handleSimpan} disabled={saving}>
          {saving ? '⏳ Menyimpan...' : '💾 Simpan semua pengaturan'}
        </button>
      </>
    )
  }

  const renderSetting = () => <SettingPage />

  // ── EXPORT CSV ──
  function exportCSV() {
    const rows = monthlyRows()
    let csv = 'Bulan,Prod(kg),Prod(butir),Pendapatan(Rp),Pengeluaran(Rp),Laba Bersih(Rp),HDP A(%),HDP B(%),Pakan A(kg),Pakan B(kg),Kematian\n'
    rows.forEach((r, i) => {
      const hA = r.hAn > 0 ? f1(r.hA / r.hAn) : '-'
      const hB = r.hBn > 0 ? f1(r.hB / r.hBn) : '-'
      const lb = r.inc - r.exp
      csv += `${BULAN[i]},${f1(r.kg)},${r.btr},${Math.round(r.inc)},${Math.round(r.exp)},${Math.round(lb)},${hA},${hB},${f1(r.pkA)},${f1(r.pkB)},${r.mati}\n`
    })
    const t = rows.reduce((a,r) => ({kg:a.kg+r.kg,btr:a.btr+r.btr,inc:a.inc+r.inc,exp:a.exp+r.exp,mati:a.mati+r.mati}),{kg:0,btr:0,inc:0,exp:0,mati:0})
    csv += `TOTAL,${f1(t.kg)},${t.btr},${Math.round(t.inc)},${Math.round(t.exp)},${Math.round(t.inc-t.exp)},-,-,-,-,${t.mati}\n`
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='Laporan_BUMDes_2026.csv'
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    alert('CSV berhasil diunduh!')
  }

  // ─── PRINT POPUP ─────────────────────────────────────────────────────────────
  const PrintPopup = () => {
    if (!printPopup) return null
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:80, display:'flex', flexDirection:'column' }}>
        {/* Header */}
        <div style={{ background:'#15803d', padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>🖨 {printPopup.title}</div>
          <button onClick={() => setPrintPopup(null)}
            style={{ background:'rgba(255,255,255,.2)', border:'none', borderRadius:6, padding:'4px 10px', color:'#fff', fontSize:12, cursor:'pointer' }}>✕ Tutup</button>
        </div>

        {/* Preview iframe */}
        <div style={{ flex:1, background:'#fff', overflow:'hidden' }}>
          <iframe
            srcDoc={printPopup.html}
            style={{ width:'100%', height:'100%', border:'none' }}
            title="Preview Struk"
          />
        </div>

        {/* Tombol aksi */}
        <div style={{ background:'#fff', padding:'10px 14px', display:'flex', gap:8, borderTop:'0.5px solid #e5e7eb', flexShrink:0 }}>
          <button
            onClick={() => {
              const iframe = document.querySelector('iframe[title="Preview Struk"]')
              if (iframe) iframe.contentWindow.print()
              else alert('Tap tombol Share di browser → Print → pilih printer RPP02')
            }}
            style={{ flex:1, background:'#15803d', color:'#fff', border:'none', borderRadius:8, padding:'12px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            🖨 Print Sekarang
          </button>
          <button onClick={() => setPrintPopup(null)}
            style={{ flex:1, background:'#f9fafb', color:'#374151', border:'0.5px solid #e5e7eb', borderRadius:8, padding:'12px 0', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Tutup
          </button>
        </div>
      </div>
    )
  }

  // ─── WA POPUP ────────────────────────────────────────────────────────────────
  const WAPopup = () => {
    if (!waPopup) return null
    const { teks, hp, judul } = waPopup
    const [copied, setCopied] = useState(false)

    function doCopy() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(teks).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2500)
        })
      } else {
        // fallback untuk browser lama
        const ta = document.createElement('textarea')
        ta.value = teks; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.select(); document.execCommand('copy')
        document.body.removeChild(ta)
        setCopied(true); setTimeout(() => setCopied(false), 2500)
      }
    }

    function bukaWA() {
      const url = hp
        ? `https://wa.me/${hp}?text=${encodeURIComponent(teks)}`
        : `https://wa.me/?text=${encodeURIComponent(teks)}`
      window.location.href = url
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 70, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '14px 14px 0 0', padding: 16, width: '100%', maxWidth: 430, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>💬 Kirim via WhatsApp</div>
            <button onClick={() => setWaPopup(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 10 }}>{judul}</div>

          {/* Preview teks */}
          <div style={{ background: '#f9fafb', borderRadius: 8, padding: 10, fontSize: 11, whiteSpace: 'pre-wrap', overflowY: 'auto', flex: 1, marginBottom: 12, border: '0.5px solid #e5e7eb', fontFamily: 'monospace', lineHeight: 1.5 }}>
            {teks}
          </div>

          {/* Instruksi iPhone */}
          <div style={{ background: '#fffbeb', borderRadius: 8, padding: '8px 10px', fontSize: 10, color: '#92400e', marginBottom: 10 }}>
            <strong>Cara kirim di iPhone:</strong> Tap "Copy Teks" → buka WhatsApp → pilih chat pelanggan → tahan area pesan → Paste → kirim
          </div>

          {/* Tombol aksi */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={doCopy}
              style={{ flex: 1, background: copied ? '#15803d' : '#f0fdf4', color: copied ? '#fff' : '#15803d', border: `1px solid ${copied?'#15803d':'#bbf7d0'}`, borderRadius: 8, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {copied ? '✓ Tersalin!' : '📋 Copy Teks'}
            </button>
            <button onClick={bukaWA}
              style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              💬 Buka WA
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── REKAP KAMAR POPUP ──────────────────────────────────────────────────────
  const RekapPopup = () => {
    if (!rekapPopup) return null
    const log = rekapPopup
    const rooms = Array.isArray(log.roomDetail) ? log.roomDetail : []
    const maxR = log.kd === 'A' ? 250 : 181

    // Hitung statistik per nilai
    const cnt = { 0: 0, 1: 0, 2: 0, 3: 0, mati: 0, kosong: 0 }
    rooms.forEach(v => {
      if (v === 'mati') cnt.mati++
      else if (v === null || v === undefined) cnt.kosong++
      else cnt[v] = (cnt[v] || 0) + 1
    })

    const colMap = { 0: '#6b7280', 1: '#0284c7', 2: '#15803d', 3: '#d97706', mati: '#dc2626' }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 60, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10px', overflowY: 'auto' }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 16, width: '100%', maxWidth: 420, marginTop: 8 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>📊 Rekap Kamar — Kandang {log.kd}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{log.tgl} · {log.tb} butir · HDP {f1(log.hdp)}%</div>
            </div>
            <button onClick={() => setRekapPopup(null)} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 12 }}>✕</button>
          </div>

          {/* Ringkasan */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 5, marginBottom: 10 }}>
            {[['0 butir', cnt[0], '#f9fafb', '#6b7280'], ['1 butir', cnt[1], '#dbeafe', '#1d4ed8'], ['2 butir', cnt[2], '#dcfce7', '#166534'], ['3 butir', cnt[3], '#fef3c7', '#92400e'], ['Mati/Ksg', (cnt.mati + cnt.kosong), '#fff1f2', '#dc2626']].map(([l, v, bg, c]) => (
              <div key={l} style={{ background: bg, borderRadius: 7, padding: '6px 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: c }}>{v}</div>
                <div style={{ fontSize: 8, color: '#6b7280' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Grid kamar */}
          <div style={{ fontSize: 10, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Detail per kamar:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3, maxHeight: 320, overflowY: 'auto' }}>
            {Array(maxR).fill(0).map((_, i) => {
              const v = rooms[i]
              const isMati = v === 'mati'
              const isNull = v === null || v === undefined
              const bg = isMati ? '#fff1f2' : isNull ? '#f9fafb' : v === 0 ? '#f9fafb' : v === 1 ? '#dbeafe' : v === 2 ? '#dcfce7' : '#fef3c7'
              const fc = isMati ? '#dc2626' : isNull ? '#d1d5db' : colMap[v] || '#374151'
              return (
                <div key={i} style={{ background: bg, borderRadius: 5, padding: '4px 2px', textAlign: 'center', border: `1px solid ${fc}22` }}>
                  <div style={{ fontSize: 8, color: '#9ca3af' }}>K{i+1}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: fc }}>{isMati ? '✕' : isNull ? '—' : v}</div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {[['—', '#d1d5db', 'Tidak diisi'], ['0', '#6b7280', '0 butir'], ['1', '#0284c7', '1 butir'], ['2', '#15803d', '2 butir'], ['3', '#d97706', '3 butir'], ['✕', '#dc2626', 'Mati']].map(([sym, c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#6b7280' }}>
                <span style={{ fontWeight: 700, color: c }}>{sym}</span> {l}
              </div>
            ))}
          </div>

          <button onClick={() => setRekapPopup(null)} style={{ ...S.btnGrn, marginTop: 10 }}>Tutup</button>
        </div>
      </div>
    )
  }
  const ReceiptModal = () => {
    if (!receipt) return null
    const pm = PAY_METHODS.find(p => p.id === receipt.metode)
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
        <div style={{ background: '#fff', borderRadius: 14, padding: 18, width: '100%', maxWidth: 320, maxHeight: '85vh', overflowY: 'auto' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #e5e7eb', paddingBottom: 10, marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>{cfg.nama_bumdes}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{cfg.desa}, {cfg.kecamatan}, {cfg.kabupaten}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Telur Ayam Petelur Segar</div>
          </div>
          <div style={{ fontSize: 11, marginBottom: 9 }}>
            {[['No. Transaksi', receipt.no], ['Tanggal', receipt.tgl], ['Kasir', receipt.by], ['Pelanggan', receipt.nama], ['Alamat', receipt.alamat || '-'], ['No. HP', receipt.hp || '-'], ['Metode', pm ? `${pm.ic} ${pm.label}` : receipt.metode]].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#6b7280' }}>{k}</span>
                <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '9px 11px', marginBottom: 10, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span>Telur Ayam</span><span>{receipt.kg} kg x {rp(receipt.harga)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, borderTop: '1px solid #bbf7d0', paddingTop: 5 }}><span>TOTAL</span><span style={{ color: '#15803d' }}>{rp(receipt.total)}</span></div>
            {receipt.lunas === false && <div style={{ color: '#d97706', fontSize: 10, marginTop: 4 }}>Status: BELUM LUNAS — JT {receipt.tempo}</div>}
          </div>
          <div style={{ borderTop: '1px dashed #e5e7eb', paddingTop: 10, marginBottom: 8 }}>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#6b7280', marginBottom: 13 }}>Tanda Tangan Kasir</div>
            <div style={{ height: 28, borderBottom: '1px solid #d1d5db', margin: '0 32px' }} />
            <div style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{receipt.by} — {cfg.nama_bumdes}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#9ca3af', marginBottom: 10 }}>Terima kasih atas kepercayaan Anda!</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <button onClick={() => printStruk(receipt)}
              style={{ flex: 1, background: '#f0fdf4', color: '#15803d', border: '0.5px solid #bbf7d0', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🖨 Print Termal</button>
            <button onClick={() => kirimWAStruk(receipt)}
              style={{ flex: 1, background: '#f0fdf4', color: '#16a34a', border: '0.5px solid #bbf7d0', borderRadius: 8, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>💬 Kirim WA</button>
          </div>
          <button style={S.btnGrn} onClick={() => setReceipt(null)}>Tutup Struk</button>
        </div>
      </div>
    )
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {notif && <div style={notif(notif.err)}>{notif.msg}</div>}
      <PrintPopup />
      <WAPopup />
      <RekapPopup />
      <ReceiptModal />

      <div style={S.topbar}>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{cfg.nama_bumdes}</div>
          <div style={{ color: '#bbf7d0', fontSize: 9 }}>{user.nama} · <span style={{ background: 'rgba(255,255,255,.18)', padding: '1px 5px', borderRadius: 3 }}>{role.label}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#bbf7d0', fontSize: 9 }}>Saldo kas</div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>{rp(cfg.modal_awal + totalIncome - totalExpense)}</div>
          </div>
          <button onClick={doLogout} style={{ background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#fff', fontSize: 9, cursor: 'pointer' }}>Keluar</button>
        </div>
      </div>

      <div style={S.page}>
        {tab === 'dash'    && renderDash()}
        {tab === 'input'   && renderInput()}
        {tab === 'kasir'   && renderKasir()}
        {tab === 'keluar'  && renderKeluar()}
        {tab === 'laporan' && renderLaporan()}
        {tab === 'hist'    && renderHist()}
        {tab === 'setting' && renderSetting()}
      </div>

      <nav style={S.botnav}>
        {tabDef.map(t => (
          <button key={t.k} style={S.nbtn(tab === t.k)} onClick={() => go(t.k)}>
            <span style={{ fontSize: 17 }}>{t.i}</span>{t.l}
          </button>
        ))}
      </nav>
    </div>
  )
}
