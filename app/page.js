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
  })

  // ── DATA LOGS ──
  const [users,   setUsers]   = useState([])
  const [hlog,    setHlog]    = useState([])   // panen
  const [slog,    setSlog]    = useState([])   // penjualan
  const [elog,    setElog]    = useState([])   // pengeluaran
  const [piutang, setPiutang] = useState([])

  // ── FORM DRAFTS ──
  const [hd, setHd] = useState({ kg: '', km: '', pakanA: '', pakanB: '' })
  const [td, setTd] = useState({ kg: '', harga: '25000', nama: '', alamat: '', hp: '', metode: 'tunai', bank: '', norek: '', tempo: '' })
  const [ed, setEd] = useState({ kat: 'pakan', tgl: tod(), jml: '', ket: '', qty: '', kdPakan: 'A' })
  const [nu, setNu] = useState({ nama: '', username: '', password: '', role: 'abk' })

  // ── UI STATE ──
  const [notif,       setNotif]       = useState(null)
  const [receipt,     setReceipt]     = useState(null)
  const [rooms,       setRooms]       = useState({ A: new Array(250).fill(null), B: new Array(181).fill(null) })
  const [loading,     setLoading]     = useState(true)
  const [hf,          setHf]          = useState('all')
  const [ef,          setEf]          = useState('all')
  const [localCfg,    setLocalCfg]    = useState(null)

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
          hdp: p.hdp, km: p.kematian, pakanA: p.pakan_a || 0, pakanB: p.pakan_b || 0,
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
    } catch (err) {
      notify('Gagal memuat data. Cek koneksi internet.', true)
    }
    setLoading(false)
  }

  // ── UPDATE CONFIG KE SUPABASE ──
  async function saveCfg(key, value) {
    await supabase.from('config').upsert({ key, value: String(value) }, { onConflict: 'key' })
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

  const curRooms  = rooms[kd]
  const popK      = kd === 'A' ? cfg.pop_a : cfg.pop_b
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

  // ── SIMPAN PANEN ──
  async function simpanPanen() {
    const kgV = parseFloat(hd.kg) || 0
    if (kgV <= 0) { notify('Total kg panen wajib diisi!', true); return }
    const pkA = parseFloat(hd.pakanA) || 0
    const pkB = parseFloat(hd.pakanB) || 0
    if (pkA > cfg.pakan_a) { notify(`Pakan A melebihi stok (${f1(cfg.pakan_a)} kg)!`, true); return }
    if (pkB > cfg.pakan_b) { notify(`Pakan B melebihi stok (${f1(cfg.pakan_b)} kg)!`, true); return }

    const kmV = parseInt(hd.km) || matiCnt
    const popKey = kd === 'A' ? 'pop_a' : 'pop_b'
    const newPop = Math.max(0, cfg[popKey] - kmV)
    const hdp = newPop > 0 ? (totBtr / newPop) * 100 : 0
    const newPakanA = Math.max(0, cfg.pakan_a - pkA)
    const newPakanB = Math.max(0, cfg.pakan_b - pkB)
    const newStokKg = cfg.stok_kg + kgV
    const newStokBtr = cfg.stok_butir + totBtr

    try {
      const { error } = await supabase.from('panen').insert({
        kandang: kd, total_butir: totBtr, total_kg: kgV, hdp,
        kematian: kmV, pakan_a: pkA, pakan_b: pkB,
        dicatat_oleh: user.nama, tanggal: tod(),
      })
      if (error) throw error

      // update config
      await saveCfg(popKey, newPop)
      await saveCfg('pakan_a', newPakanA)
      await saveCfg('pakan_b', newPakanB)
      await saveCfg('stok_kg', newStokKg)
      await saveCfg('stok_butir', newStokBtr)

      setCfg(prev => ({ ...prev, [popKey]: newPop, pakan_a: newPakanA, pakan_b: newPakanB, stok_kg: newStokKg, stok_butir: newStokBtr }))
      const tgl = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      setHlog(prev => [{ id: Date.now(), tgl, tgl2: tod(), kd, tb: totBtr, kg: kgV, hdp, km: kmV, pakanA: pkA, pakanB: pkB, by: user.nama }, ...prev])
      setRooms(prev => ({ ...prev, [kd]: new Array(kd === 'A' ? 250 : 181).fill(null) }))
      setFocR(0)
      setHd({ kg: '', km: '', pakanA: '', pakanB: '' })
      notify(`Panen disimpan: ${totBtr} butir | ${kgV} kg | HDP ${f1(hdp)}%`)
    } catch (err) {
      notify('Gagal simpan panen: ' + err.message, true)
    }
  }

  // ── PROSES JUAL ──
  async function prosesJual() {
    const kgV = parseFloat(td.kg) || 0, hV = parseFloat(td.harga) || 0
    if (kgV <= 0 || hV <= 0) { notify('Isi jumlah & harga!', true); return }
    if (!td.nama.trim()) { notify('Nama pelanggan wajib!', true); return }
    if (td.metode === 'tempo' && !td.tempo) { notify('Tanggal jatuh tempo wajib!', true); return }
    if (td.metode === 'transfer' && (!td.bank.trim() || !td.norek.trim())) { notify('Bank & no. rekening wajib!', true); return }
    if (td.metode !== 'tempo' && kgV > cfg.stok_kg) { notify('Stok Telur Tidak Mencukupi!', true); return }

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
      notify(lunas ? 'Transaksi berhasil!' : `Tempo tercatat — JT: ${td.tempo}`)
    } catch (err) {
      notify('Gagal simpan transaksi: ' + err.message, true)
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
      notify('Gagal lunasi: ' + err.message, true)
    }
  }

  // ── SIMPAN PENGELUARAN ──
  async function simpanKeluar() {
    const jmlV = parseFloat(ed.jml) || 0
    if (jmlV <= 0) { notify('Jumlah pengeluaran wajib!', true); return }
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
      notify(`Pengeluaran ${katOf(ed.kat).label}: ${rp(jmlV)}`)
    } catch (err) {
      notify('Gagal simpan pengeluaran: ' + err.message, true)
    }
  }

  // ── TAMBAH USER ──
  async function addUser() {
    if (!nu.nama || !nu.username || !nu.password) { notify('Semua field wajib!', true); return }
    if (users.find(u => u.username === nu.username)) { notify('Username sudah ada!', true); return }
    try {
      const { data, error } = await supabase.from('users').insert({
        nama: nu.nama, username: nu.username, password: nu.password,
        role: nu.role, avatar: nu.nama.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2),
      }).select().single()
      if (error) throw error
      setUsers(prev => [...prev, data])
      setNu({ nama: '', username: '', password: '', role: 'abk' })
      notify('User berhasil ditambahkan!')
    } catch (err) {
      notify('Gagal tambah user: ' + err.message, true)
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
    try {
      for (const [k, v] of Object.entries(vals)) await saveCfg(k, v)
      setCfg(prev => ({ ...prev, ...Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, isNaN(v) ? v : +v])) }))
      notify('Pengaturan disimpan!')
    } catch(err) {
      notify('Gagal simpan: ' + err.message, true)
    }
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

  const renderDash = () => (
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

      <div style={S.card}>
        <div style={S.sec}>Alokasi SHU tahunan</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 7 }}>Dari laba bersih <strong style={{ color: '#111' }}>{rp(laba)}</strong></div>
        {SHU.map(x => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 11 }}>{x.l}</div>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{x.p}%</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: x.c, minWidth: 80, textAlign: 'right' }}>{rp(laba * x.p / 100)}</span>
          </div>
        ))}
      </div>
    </>
  )

  const renderInput = () => (
    <>
      <div style={{ ...S.card, display: 'flex', padding: 3, marginBottom: 7 }}>
        {['A', 'B'].map(k => (
          <button key={k} onClick={() => { setKd(k); setFocR(0) }}
            style={{ flex: 1, padding: 9, borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: kd === k ? (k === 'A' ? '#15803d' : '#0284c7') : 'transparent', color: kd === k ? '#fff' : '#6b7280', fontFamily: 'inherit' }}>
            Kandang {k} ({k === 'A' ? cfg.pop_a : cfg.pop_b} ekor)
          </button>
        ))}
      </div>

      <div style={{ ...S.stat, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
        <div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>HDP Live — Kandang {kd}</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: hdpLive >= 78 ? '#15803d' : '#d97706' }}>{f1(hdpLive)}%</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 10, color: '#6b7280' }}>
          <div>{totBtr} butir | {filledCnt}/{kd === 'A' ? 250 : 181} kamar</div>
          {matiCnt > 0 && <div style={{ color: '#dc2626' }}>{matiCnt} kamar mati</div>}
        </div>
      </div>
      <div style={{ ...S.bar, height: 6, marginBottom: 8 }}>
        <div style={{ background: hdpLive >= 78 ? '#15803d' : '#d97706', width: `${Math.min(hdpLive, 100)}%`, height: '100%', borderRadius: 99 }} />
      </div>

      <div style={{ ...S.card, padding: '9px 7px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={S.sec}>Input per kamar</div>
          <button style={S.btnSm} onClick={resetRooms}>Reset</button>
        </div>
        <div style={S.rg}>
          {curRooms.map((v, i) => {
            const iD = v === 'mati', iF = v !== null, iC = focR === i
            const col = kd === 'A' ? '#15803d' : '#0284c7'
            return (
              <div key={i} id={`rm-${i}`} style={{ borderRadius: 8, padding: '7px 6px', border: `1.5px solid ${iC ? col : iD ? '#fca5a5' : iF ? '#86efac' : '#e5e7eb'}`, background: iD ? '#fff1f2' : iF ? '#f0fdf4' : '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: iD ? '#dc2626' : iF ? '#15803d' : '#9ca3af' }}>K-{String(i + 1).padStart(3, '0')} {iD ? 'X' : iF ? '✓' + v : ''}</span>
                  <button onClick={() => setRoom(kd, i, 'mati')} style={{ background: 'none', border: 'none', fontSize: 8, color: '#dc2626', cursor: 'pointer' }}>Mati</button>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[0, 1, 2].map(n => (
                    <button key={n} onClick={() => setRoom(kd, i, n)}
                      style={{ flex: 1, border: `1.5px solid ${v === n ? col : '#e5e7eb'}`, borderRadius: 5, padding: '5px 0', fontWeight: 600, fontSize: 12, cursor: 'pointer', background: v === n ? col : 'transparent', color: v === n ? '#fff' : '#111', fontFamily: 'inherit' }}>{n}</button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.sec}>Data panen & konsumsi pakan</div>
        <label style={{ ...S.lbl, marginTop: 0 }}>Total berat panen (kg) *</label>
        <input style={S.inp} type="number" placeholder="Total kg dipanen" value={hd.kg} onChange={e => setHd(p => ({ ...p, kg: e.target.value }))} />
        <label style={S.lbl}>Kematian ayam (ekor)</label>
        <input style={S.inp} type="number" placeholder="Atau tandai di kamar" value={hd.km} onChange={e => setHd(p => ({ ...p, km: e.target.value }))} />

        <div style={{ height: 1, background: '#f3f4f6', margin: '12px 0' }} />

        <div style={S.pakanBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>🌾</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>Konsumsi Pakan Hari Ini</span>
            <span style={{ fontSize: 10, color: '#92400e', background: '#fef3c7', borderRadius: 4, padding: '1px 6px' }}>otomatis kurangi stok</span>
          </div>
          <div style={S.g2}>
            {[['A', hd.pakanA, cfg.pakan_a, 'pakanA'], ['B', hd.pakanB, cfg.pakan_b, 'pakanB']].map(([k, val, stok, field]) => {
              const sisa = stok - (parseFloat(val) || 0)
              return (
                <div key={k}>
                  <label style={{ ...S.lbl, marginTop: 0 }}>Pakan Kandang {k} (kg)</label>
                  <input style={S.inp} type="number" placeholder="0" value={val}
                    onChange={e => setHd(p => ({ ...p, [field]: e.target.value }))} />
                  <div style={{ fontSize: 10, marginTop: 3, color: sisa < 0 ? '#dc2626' : sisa < 50 ? '#d97706' : '#15803d' }}>
                    Stok {k}: {f1(stok)} kg → sisa {f1(Math.max(0, sisa))} kg{sisa < 0 ? ' ⚠' : ''}
                  </div>
                </div>
              )
            })}
          </div>
          {((parseFloat(hd.pakanA) || 0) + (parseFloat(hd.pakanB) || 0)) > 0 && (
            <div style={{ marginTop: 8, padding: '6px 8px', background: '#fffbeb', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
              Total konsumsi: <strong>{f1((parseFloat(hd.pakanA) || 0) + (parseFloat(hd.pakanB) || 0))} kg</strong>
            </div>
          )}
        </div>

        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', marginBottom: 6, fontSize: 11 }}>
          <div style={{ fontWeight: 600, color: '#15803d', marginBottom: 2 }}>{totBtr} butir dari {filledCnt} kamar — HDP {f1(hdpLive)}%</div>
          <div style={{ color: '#6b7280' }}>Pembelian pakan baru? Catat di menu Pengeluaran</div>
        </div>
        <button style={S.btnGrn} onClick={simpanPanen}>💾 Simpan panen & catat konsumsi pakan</button>
      </div>
    </>
  )

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
          {[['Nama pelanggan *', 'nama', 'text', 'Nama lengkap'], ['Alamat', 'alamat', 'text', 'Alamat'], ['No. HP', 'hp', 'tel', '08xx']].map(([l, f, t, ph]) => (
            <div key={f}><label style={{ ...S.lbl, marginTop: 0 }}>{l}</label><input style={{ ...S.inp, marginBottom: 6 }} type={t} placeholder={ph} value={td[f] || ''} onChange={e => setTd(p => ({ ...p, [f]: e.target.value }))} /></div>
          ))}

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
                    <button onClick={() => setReceipt(t)} style={{ background: 'none', border: 'none', fontSize: 10, color: '#0284c7', cursor: 'pointer' }}>Struk</button>
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
                <div style={{ fontWeight: 600, fontSize: 12, color: '#dc2626' }}>{rp(e.jml)}</div>
              </div>
            )
          })}
      </div>
    </>
  )

  const renderLaporan = () => {
    const rows = monthlyRows()
    const tot = rows.reduce((a, r) => ({ kg: a.kg + r.kg, btr: a.btr + r.btr, inc: a.inc + r.inc, exp: a.exp + r.exp, mati: a.mati + r.mati, pkA: a.pkA + r.pkA, pkB: a.pkB + r.pkB }), { kg: 0, btr: 0, inc: 0, exp: 0, mati: 0, pkA: 0, pkB: 0 })
    return (
      <>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Laporan pertanggungjawaban</div>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>Ringkasan tahunan {cfg.nama_bumdes} — 2026</div>
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
                  <td style={{ padding: '5px 6px', color: k.c, fontWeight: 600 }}>{ec[k.id] ? rp(ec[k.id]) : '-'}</td>
                  <td style={{ padding: '5px 6px' }}>{totalExpense > 0 ? f1((ec[k.id] || 0) / totalExpense * 100) + '%' : '0%'}</td>
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
    return (
      <>
        <div style={{ display: 'flex', gap: 3, marginBottom: 8, background: '#f9fafb', padding: 3, borderRadius: 8 }}>
          {[['all','Semua'],['panen','Panen'],['jual','Penjualan'],['keluar','Pengeluaran']].map(([k, v]) => (
            <button key={k} onClick={() => setHf(k)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer', background: hf === k ? '#15803d' : 'transparent', color: hf === k ? '#fff' : '#6b7280', fontFamily: 'inherit' }}>{v}</button>
          ))}
        </div>
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
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{log.by}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af' }}>{log.tgl}</div>
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
      pop_a: cfg.pop_a || 500,
      pop_b: cfg.pop_b || 362,
      pakan_a: cfg.pakan_a || 200,
      pakan_b: cfg.pakan_b || 150,
    })
    const [saving, setSaving] = useState(false)

    async function handleSimpan() {
      setSaving(true)
      try {
        for (const [k, v] of Object.entries(sv)) {
          await saveCfg(k, v)
        }
        setCfg(prev => ({ ...prev, ...sv,
          kas: +sv.kas, pop_a: +sv.pop_a, pop_b: +sv.pop_b,
          pakan_a: +sv.pakan_a, pakan_b: +sv.pakan_b,
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
          <label style={{ ...S.lbl, marginTop: 0 }}>Set saldo kas (Rp)</label>
          <input style={S.inp} type="number" value={sv.kas} onChange={e => setSv(p => ({ ...p, kas: e.target.value }))} />
          <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>Saldo saat ini: <strong>{rp(cfg.kas)}</strong></div>
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
        <button style={{ ...S.btnGrn, opacity: saving ? 0.7 : 1 }} onClick={handleSimpan} disabled={saving}>
          {saving ? '⏳ Menyimpan...' : '💾 Simpan semua pengaturan'}
        </button>
      </>
    )
  }

  const renderSetting = () => <SettingPage />

  // ─── RECEIPT MODAL ──────────────────────────────────────────────────────────
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
          <button style={S.btnGrn} onClick={() => setReceipt(null)}>Tutup Struk</button>
        </div>
      </div>
    )
  }

  // ─── MAIN RENDER ────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {notif && <div style={notif(notif.err)}>{notif.msg}</div>}
      <ReceiptModal />

      <div style={S.topbar}>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{cfg.nama_bumdes}</div>
          <div style={{ color: '#bbf7d0', fontSize: 9 }}>{user.nama} · <span style={{ background: 'rgba(255,255,255,.18)', padding: '1px 5px', borderRadius: 3 }}>{role.label}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#bbf7d0', fontSize: 9 }}>Saldo kas</div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 12 }}>{rp(cfg.kas)}</div>
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
