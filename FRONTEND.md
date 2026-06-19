# FRONTEND.md — Campus Blockchain Community Chat

> Dokumen acuan frontend: design system, UX pattern, dan checklist progress.
> Tujuan: setiap halaman terasa satu produk yang sama, bukan kumpulan komponen lepas.

---

## 1. Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| State (UI) | Zustand (`lib/store.ts`) — auth + transaction only |
| State (Server) | TanStack Query (`@tanstack/react-query`) |
| Web3 | wagmi + RainbowKit |
| Icons | lucide-react |
| Realtime | Socket.io client |

**Prinsip penting:** Zustand **bukan** tempat data API. Semua data dari backend (posts, answers, leaderboard) lewat React Query. Zustand hanya untuk state yang perlu persist lintas halaman: auth JWT, current user, transaction toast history.

---

## 2. Design System

### 2.1 Warna (sudah di `globals.css`, jangan diubah)

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `--primary` | `#10b981` | `#10b981` | CTA utama, reward, link aktif |
| `--accent` | `#3b82f6` | `#3b82f6` | Chat, info, blockchain badge |
| `--background` | `#fafafa` | `#09090b` | Base page |
| `--card` | `#ffffff` | `#121214` | Container, card |
| `--muted-foreground` | `#71717a` | `#a1a1aa` | Teks sekunder |
| `--destructive` | `#ef4444` | `#ef4444` | Error, hapus, revoke |

**Aturan:** jangan pernah pakai warna hex langsung di komponen. Selalu lewat Tailwind token (`bg-primary`, `text-muted-foreground`, dst) supaya dark mode otomatis ikut.

### 2.2 Tipografi

- Font: Outfit (sudah di-load di `layout.tsx` via `--font-outfit`)
- Heading: `font-extrabold` atau `font-bold`, `tracking-tight`
- Body: default weight, `leading-relaxed` untuk paragraf panjang
- Label kecil/meta: `text-xs` atau `text-[10px]`, `font-semibold`, `uppercase tracking-wider` kalau berupa kategori

### 2.3 Spacing & Radius

- Radius card: `rounded-2xl` (16px) — ini identitas visual utama produk
- Radius button/input: `rounded-xl` (12px)
- Radius badge/pill: `rounded-full` atau `rounded-lg`
- Gap antar section: `space-y-6`
- Padding card: `p-5` (mobile-friendly, tidak terlalu lega)

### 2.4 Komponen dasar yang HARUS dipakai ulang

Jangan tulis style berulang. Pakai class dari `globals.css`:

```
.icon-btn      → tombol icon bulat di navbar/toolbar
.badge         → status pill (verified, pending, dst)
.skeleton      → loading state, BUKAN spinner untuk list
.glass         → navbar / modal backdrop
.csit-amount   → semua angka token (tabular-nums, biar tidak "loncat")
```

### 2.5 Reward Token Visual Language

CSIT token punya identitas warna sendiri — **emerald + Coins icon**, konsisten di semua tempat:

```tsx
<span className="flex items-center gap-1 text-emerald-500 font-semibold">
  <Coins className="h-4 w-4" />
  +5 CSIT
</span>
```

Dipakai di: hero banner, TokenBalance navbar, notifikasi reward, riwayat transaksi, leaderboard.

### 2.6 Transaction / On-chain State Visual

Setiap aksi yang trigger transaksi on-chain (post, answer, like, best-answer) HARUS kasih feedback 3 tahap:

| Status | Visual |
|---|---|
| `pending` | Badge kuning, ikon `Loader2` animate-spin |
| `confirmed` | Badge emerald, ikon `CheckCircle2` |
| `failed` | Badge merah, ikon `XCircle`, ada tombol retry |

Jangan biarkan user menunggu tanpa indikator. Optimistic UI boleh, tapi status transaksi harus tetap terlihat (lihat `TransactionStatus.tsx`).

---

## 3. UX Principles

1. **Tidak ada dead-end state.** Setiap empty state (belum ada posts, belum connect wallet, belum verified) harus punya CTA jelas — bukan cuma teks "kosong".
2. **Wallet-gated actions selalu jelas alasannya.** Kalau user belum connect wallet dan klik "Like" atau "Jawab", jangan `alert()` browser — pakai toast/modal yang konsisten dengan design system.
3. **Loading state pakai skeleton, bukan spinner**, khusus untuk list/card. Spinner hanya untuk aksi tombol (submit, like, refresh).
4. **Optimistic update untuk aksi ringan** (like), tapi **konfirmasi eksplisit untuk aksi berat** (pilih best answer — ini final dan tidak bisa dibatalkan).
5. **Reward harus terasa "hidup".** Saat user dapat CSIT, tampilkan toast notification real-time (lewat Socket.io `broadcastRewardReceived`), bukan cuma update balance diam-diam.
6. **Mobile-first untuk navigasi.** Sidebar desktop → bottom nav di mobile (sudah benar di `Sidebar.tsx`, pertahankan pattern ini di semua halaman baru).
7. **Verified badge terlihat di mana pun nama user muncul** — post card, jawaban, leaderboard, chat. Konsistensi ini penting karena ini platform akademik.

---

## 4. Status Saat Ini (Baseline)

✅ Sudah selesai & terintegrasi API:
- `globals.css` — design token lengkap
- `lib/api.ts` — API client + types
- `lib/store.ts` — auth & transaction state
- `Navbar.tsx` — theme toggle, wallet connect, token balance, backend status
- `Sidebar.tsx` — navigasi responsive, admin check via env
- `TokenBalance.tsx` — fetch real balance, auto-refresh
- `app/page.tsx` (Home/Feed) — fetch posts, search, sort, tag filter
- `QuestionCard.tsx` — like via API dengan optimistic update
- `app/layout.tsx` — struktur lengkap dengan Navbar + Sidebar

⚠️ Belum dikerjakan — lihat checklist di bawah.

---

## 5. Checklist Per Halaman

### 5.1 Home / Forum Feed (`app/page.tsx`)
**Status: ✅ Selesai**

- [x] Hero banner dengan reward matrix
- [x] Sort tabs (Terbaru / Populer / Belum Terjawab)
- [x] Search dengan debounce
- [x] Tag filter sidebar
- [x] Skeleton loading
- [x] Error state dengan retry
- [x] Empty state dengan CTA

---

### 5.2 Ask / Buat Pertanyaan (`app/ask/page.tsx`)
**Status: ❌ Belum ada**

**Requirement fungsional:**
- [ ] Form: title (required, max 150 char), body (required, markdown-capable textarea, min 20 char), tags (multi-input, max 5 tags)
- [ ] Validasi client-side sebelum submit (jangan andalkan backend saja)
- [ ] Cek wallet connected — kalau belum, tampilkan prompt connect, bukan disable form diam-diam
- [ ] Cek `isVerified` dari `currentUser` — kalau belum whitelist, tampilkan banner "Hubungi admin untuk verifikasi" dan disable submit
- [ ] Submit → `postsApi.create()` → tampilkan transaction pending state → redirect ke `/question/[id]` setelah confirmed
- [ ] Preview mode untuk body (toggle Tulis/Preview) kalau body support markdown

**UX detail:**
- [ ] Karakter counter untuk title & body
- [ ] Tag input: ketik lalu Enter/koma untuk menambah, klik X untuk hapus
- [ ] Reward reminder kecil di dekat submit button: "Anda akan mendapat +5 CSIT setelah posting"
- [ ] Tombol submit disabled selama transaksi pending, dengan loading spinner di dalam tombol

**Komponen yang dipakai:** `PostEditor.tsx` (sudah ada filenya, isi sesuai requirement ini)

---

### 5.3 Question Detail (`app/question/[id]/page.tsx`)
**Status: ❌ Belum ada**

**Requirement fungsional:**
- [ ] Fetch post detail via `postsApi.get(id)` — termasuk answers & comments
- [ ] Tampilkan full body, tags, author, like button (sama pattern dengan `QuestionCard`)
- [ ] List jawaban, sorted: best answer di atas, lalu by likes
- [ ] Form jawaban baru di bawah (pakai `AnswerCard.tsx` + editor terpisah)
- [ ] Tombol "Pilih sebagai jawaban terbaik" — **hanya muncul untuk author pertanyaan**, dan minta konfirmasi modal sebelum submit (aksi ini final)
- [ ] Comment section per jawaban (collapsible, tidak default terbuka semua kalau jawaban banyak)
- [ ] Like button di tiap jawaban

**UX detail:**
- [ ] Breadcrumb / tombol back ke feed
- [ ] Sticky "Tulis Jawaban" button di mobile (scroll ke form)
- [ ] Best answer punya visual berbeda — border emerald, badge "✓ Jawaban Terbaik" di pojok atas
- [ ] Skeleton loading untuk seluruh halaman saat fetch detail

---

### 5.4 Chat Realtime (`app/chat/page.tsx`)
**Status: ❌ Belum ada — backend Socket.io sudah siap**

**Requirement fungsional:**
- [ ] Room selector: `general`, per-angkatan (`angkatan:2021` dst), per-pertanyaan kalau datang dari context post
- [ ] Connect ke Socket.io pakai JWT dari `useJwt()` — bukan random userId
- [ ] Fetch history awal via `GET /api/chat/:roomId/messages`
- [ ] Real-time append pesan baru dari socket event
- [ ] Online users list per room (`OnlineUsers.tsx`)
- [ ] Rate limit UX: kalau backend tolak (rate limited), tampilkan pesan kecil "Tunggu sebentar sebelum kirim lagi" — jangan diam saja

**UX detail:**
- [ ] Auto-scroll ke bawah saat pesan baru masuk, KECUALI user sedang scroll ke atas baca history lama
- [ ] Avatar/inisial warna konsisten per wallet address (hash address → warna)
- [ ] Pesan dari diri sendiri rata kanan, orang lain rata kiri (pattern chat app standar)
- [ ] Timestamp relatif ("2 menit lalu") dengan tooltip waktu lengkap saat hover
- [ ] Input disabled + placeholder jelas kalau wallet belum connect

**Komponen yang dipakai:** `ChatWindow.tsx`, `ChatInput.tsx`, `OnlineUsers.tsx` (sudah ada, sambungkan ke socket asli)

---

### 5.5 Leaderboard (`app/leaderboard/page.tsx`)
**Status: ❌ Belum ada**

**Requirement fungsional:**
- [ ] Tab: All-time vs Weekly (`leaderboardApi.allTime()` / `.weekly()`)
- [ ] Tabel/list ranked: rank, nama, NIM, total CSIT, reputation
- [ ] Highlight row milik user yang sedang login

**UX detail:**
- [ ] Top 3 dapat visual spesial (badge emas/perak/perunggu atau crown icon), bukan cuma nomor urut
- [ ] Skeleton loading untuk 10 row dummy saat fetch
- [ ] Empty state kalau belum ada data sama sekali

---

### 5.6 Profile (`app/profile/[address]/page.tsx`)
**Status: ❌ Belum ada**

**Requirement fungsional:**
- [ ] Tampilkan info user: nama, NIM, angkatan, verified badge, total CSIT, reputation
- [ ] History reward (`rewardsApi.getHistory()`) — list transaksi dengan link ke Etherscan
- [ ] List pertanyaan & jawaban yang pernah dibuat user ini
- [ ] Kalau melihat profile sendiri: tombol edit (kalau ada endpoint update profile di backend — cek dulu)

**UX detail:**
- [ ] Avatar generated dari address (pakai library blockie atau gradient hash-based)
- [ ] Tab switcher: Aktivitas / Riwayat Reward
- [ ] Kalau address tidak ditemukan di DB, tampilkan "User belum terdaftar" — bukan crash

---

### 5.7 Admin Panel (`app/admin/page.tsx`)
**Status: ❌ Belum ada — akses dibatasi ke admin wallet saja**

**Requirement fungsional:**
- [ ] Guard halaman: redirect ke `/` kalau bukan admin (cek di client DAN biarkan backend tetap jadi source of truth via 403)
- [ ] Tab "Statistik": tampilkan data dari `GET /api/admin/stats` (total users, posts, answers, comments, total token distributed) dalam bentuk stat cards
- [ ] Tab "Mahasiswa": list dari `GET /api/admin/students`, dengan aksi whitelist/revoke
- [ ] Form tambah whitelist: input wallet address + NIM → `POST /api/admin/whitelist`
- [ ] Tombol revoke per row → `DELETE /api/admin/whitelist/:nim` dengan modal konfirmasi (aksi sensitif)

**UX detail:**
- [ ] Stat cards pakai icon berbeda per metric, angka besar dan jelas
- [ ] Search/filter di tabel mahasiswa kalau datanya banyak
- [ ] Setiap aksi on-chain (whitelist/revoke) tampilkan transaction pending state — ini transaksi blockchain sungguhan, butuh waktu beberapa detik
- [ ] Konfirmasi modal untuk revoke: "Yakin hapus akses [Nama]? Mereka tidak akan bisa posting sampai didaftarkan ulang."

---

### 5.8 Auth Flow — SIWE Login
**Status: ⚠️ Fallback mode aktif, perlu diselesaikan**

**Requirement fungsional:**
- [ ] Saat wallet connect & belum ada JWT tersimpan: trigger flow `authApi.getNonce()` → `useSignMessage()` (wagmi) → `authApi.verify()`
- [ ] Kalau `verify` return `registered: false`: tampilkan `OnboardingModal` untuk isi NIM, nama, angkatan → `authApi.register()`
- [ ] Simpan JWT dari hasil verify via `setAuth()` di store
- [ ] Auto re-verify kalau JWT expired (response 401 dari API manapun → clear auth → minta sign ulang)

**UX detail:**
- [ ] Loading state jelas selama proses sign message (wallet popup bisa terasa "macet" kalau tidak ada indikator)
- [ ] Pesan error jelas kalau user reject signature: "Login dibatalkan. Klik wallet untuk coba lagi."
- [ ] Modal onboarding tidak bisa ditutup paksa sebelum isi data (atau kalau ditutup, tetap dalam status unregistered, bukan stuck)

---

## 6. Komponen Shared yang Perlu Dibuat

| Komponen | Lokasi | Kebutuhan |
|---|---|---|
| `Toast.tsx` / notifikasi sistem | `components/ui/` | Pengganti `alert()` browser — dipakai di semua wallet-gate check |
| `ConfirmModal.tsx` | `components/ui/` | Dipakai untuk best-answer select, revoke whitelist |
| `EmptyState.tsx` | `components/ui/` | Reusable empty state (icon + title + desc + CTA), dipakai di Home, Leaderboard, Profile |
| `Avatar.tsx` | `components/ui/` | Generate avatar dari wallet address, dipakai di semua tempat nama user muncul |

---

## 7. Urutan Pengerjaan yang Disarankan

1. **SIWE Auth flow** — semua fitur lain butuh user yang sudah login
2. **Ask page** — entry point utama, paling sering dipakai
3. **Question Detail** — pasangan langsung dari Ask & Home
4. **Shared components** (Toast, ConfirmModal, EmptyState, Avatar) — supaya halaman berikutnya tidak duplikasi kode
5. **Leaderboard & Profile** — read-only, lebih simpel
6. **Chat Realtime** — butuh socket setup terpisah, kerjakan setelah core flow stabil
7. **Admin Panel** — paling sedikit penggunanya, kerjakan terakhir

---

## 8. Definition of Done (per halaman)

Sebelum centang checklist di atas sebagai selesai, pastikan:

- [ ] Tidak ada data mock/hardcode tersisa
- [ ] Loading state (skeleton) ada
- [ ] Error state ada, dengan retry kalau relevan
- [ ] Empty state ada, dengan CTA kalau relevan
- [ ] Wallet-gated action tidak pakai `alert()` browser
- [ ] Responsive — dicek di mobile width (375px) dan desktop
- [ ] Dark mode dicek — tidak ada warna hardcode yang pecah di dark mode
- [ ] Transaksi on-chain (kalau ada) punya status pending/confirmed/failed yang terlihat