# AGENT.md — Campus Blockchain Community Chat
## Informatika Community Platform (ICP)

> **Project Type:** Web3 Q&A Community Platform for Teknik Informatika Students  
> **Mode:** Development Only (Zero Cost — Ethereum Sepolia Testnet)  
> **Token:** ERC-20 on Sepolia Testnet (no real monetary value)  
> **Last Updated:** 2026-06-09

---

## 📌 PROJECT OVERVIEW

Platform komunitas berbasis blockchain untuk mahasiswa Teknik Informatika. Mahasiswa bisa bertanya, menjawab, dan berinteraksi — setiap kontribusi (like, comment, share, best answer) akan mendapatkan reward berupa token ERC-20 di Ethereum **Sepolia Testnet** (gratis, tanpa biaya nyata).

---

## 🗂️ REPOSITORY STRUCTURE

```
campus-blockchain-chat/
├── AGENT.md                    ← File ini
├── .env.example                ← Template environment variables
├── .gitignore
├── README.md
│
├── contracts/                  ← Solidity Smart Contracts
│   ├── CampusCoin.sol          ← ERC-20 Token contract
│   ├── RewardManager.sol       ← Reward distribution logic
│   ├── Whitelist.sol           ← Mahasiswa wallet whitelist
│   └── interfaces/
│       ├── ICampusCoin.sol
│       └── IRewardManager.sol
│
├── hardhat/                    ← Hardhat config & scripts
│   ├── hardhat.config.ts
│   ├── scripts/
│   │   ├── deploy.ts           ← Deploy ke Sepolia testnet
│   │   ├── verify.ts           ← Verify contract di Etherscan
│   │   └── seed.ts             ← Seed whitelist mahasiswa
│   └── test/
│       ├── CampusCoin.test.ts
│       ├── RewardManager.test.ts
│       └── Whitelist.test.ts
│
├── backend/                    ← Node.js + Express API
│   ├── src/
│   │   ├── index.ts            ← Entry point
│   │   ├── config/
│   │   │   ├── database.ts     ← PostgreSQL / Prisma config
│   │   │   ├── redis.ts        ← Redis untuk session & cache
│   │   │   └── blockchain.ts   ← viem client config
│   │   ├── routes/
│   │   │   ├── auth.ts         ← SIWE authentication
│   │   │   ├── posts.ts        ← Q&A CRUD
│   │   │   ├── comments.ts     ← Comment endpoints
│   │   │   ├── rewards.ts      ← Reward history & balance
│   │   │   ├── leaderboard.ts  ← Ranking mahasiswa
│   │   │   └── admin.ts        ← Admin whitelist management
│   │   ├── middleware/
│   │   │   ├── auth.ts         ← JWT + wallet verification
│   │   │   ├── rateLimit.ts    ← Anti-spam middleware
│   │   │   └── whitelist.ts    ← Check mahasiswa TI only
│   │   ├── services/
│   │   │   ├── blockchain.ts   ← Contract interaction
│   │   │   ├── reward.ts       ← Reward calculation logic
│   │   │   └── notification.ts ← Push notifications
│   │   ├── events/
│   │   │   └── listener.ts     ← On-chain event listener
│   │   ├── socket/
│   │   │   └── chat.ts         ← Socket.io realtime chat
│   │   └── prisma/
│   │       └── schema.prisma   ← Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   ← Next.js 14 Web App
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx            ← Home / Q&A Feed
│   │   ├── ask/
│   │   │   └── page.tsx        ← Buat pertanyaan baru
│   │   ├── question/
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← Detail pertanyaan & jawaban
│   │   ├── chat/
│   │   │   └── page.tsx        ← Realtime community chat
│   │   ├── leaderboard/
│   │   │   └── page.tsx        ← Ranking mahasiswa
│   │   ├── profile/
│   │   │   └── [address]/
│   │   │       └── page.tsx    ← Profil mahasiswa
│   │   └── admin/
│   │       └── page.tsx        ← Admin panel
│   ├── components/
│   │   ├── ui/                 ← Shadcn/ui components
│   │   ├── web3/
│   │   │   ├── ConnectButton.tsx
│   │   │   ├── TokenBalance.tsx
│   │   │   └── TransactionStatus.tsx
│   │   ├── posts/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── AnswerCard.tsx
│   │   │   └── PostEditor.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       └── Sidebar.tsx
│   ├── lib/
│   │   ├── wagmi.ts            ← wagmi config (Sepolia only)
│   │   ├── contracts.ts        ← Contract ABI & address
│   │   └── api.ts              ← API client
│   ├── package.json
│   └── tsconfig.json
│
└── docs/
    ├── architecture.md
    ├── smart-contracts.md
    └── api-reference.md
```

---

## 🔧 TECH STACK

### Smart Contract Layer
| Tool | Version | Purpose |
|------|---------|---------|
| Solidity | ^0.8.24 | Smart contract language |
| Hardhat | ^2.22 | Development framework |
| OpenZeppelin | ^5.0 | ERC-20 base contracts |
| ethers.js | ^6.0 | Contract interaction in scripts |
| @nomicfoundation/hardhat-toolbox | latest | Testing, coverage, verify |

### Backend Layer
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express | ^4.18 | HTTP server |
| TypeScript | ^5.4 | Type safety |
| Prisma | ^5.14 | ORM |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Session cache & rate limiting |
| Socket.io | ^4.7 | Realtime chat |
| viem | ^2.0 | Blockchain interaction |
| jose | ^5.0 | JWT handling |
| siwe | ^2.3 | Sign-In with Ethereum |

### Frontend Layer
| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 14 (App Router) | React framework |
| TypeScript | ^5.4 | Type safety |
| wagmi | ^2.0 | React Web3 hooks |
| viem | ^2.0 | Low-level Ethereum |
| RainbowKit | ^2.0 | Wallet connect UI |
| TailwindCSS | ^3.4 | Styling |
| shadcn/ui | latest | Component library |
| Zustand | ^4.5 | State management |
| React Query | ^5.0 | Server state / caching |

---

## 🌐 NETWORK CONFIGURATION

```
NETWORK:        Ethereum Sepolia Testnet
CHAIN_ID:       11155111
RPC_URL:        https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}
EXPLORER:       https://sepolia.etherscan.io
FAUCET:         https://sepoliafaucet.com  ← Gratis ETH untuk gas
COST:           $0 (testnet only, tidak ada uang nyata)
```

> ⚠️ **PENTING:** Seluruh development menggunakan Sepolia Testnet.
> ETH Sepolia didapat GRATIS dari faucet. Jangan deploy ke Mainnet.

---

## 📄 SMART CONTRACT SPECIFICATIONS

### 1. `CampusCoin.sol` (ERC-20 Token)

```
Name:           Campus Informatika Token
Symbol:         CSIT
Decimals:       18
Total Supply:   10,000,000 CSIT (hard cap)
Mintable:       Yes, hanya oleh RewardManager (role-based)
Burnable:       No
Pausable:       Yes (oleh owner/admin)
```

**Functions yang diekspos:**
```solidity
// State-changing
mint(address to, uint256 amount)         // Only RewardManager
burn(address from, uint256 amount)       // Only RewardManager
pause() / unpause()                      // Only owner

// View
balanceOf(address account) → uint256
totalSupply() → uint256
allowance(address owner, address spender) → uint256
```

---

### 2. `RewardManager.sol` (Reward Logic)

**Reward Matrix:**
```
ACTION                  REWARD      COOLDOWN        MAX/DAY
─────────────────────────────────────────────────────────
postQuestion()          5 CSIT      10 menit        5x/hari
postAnswer()            10 CSIT     10 menit        10x/hari
receiveLike()           2 CSIT      -               25x/hari
bestAnswerSelected()    20 CSIT     -               -
postComment()           1 CSIT      5 menit         20x/hari
sharePost()             1 CSIT      30 menit        5x/hari
```

**Key Functions:**
```solidity
rewardContribution(
    address recipient,
    ActionType action,
    bytes32 contentId
) external onlyBackend

claimDailyRewards(address user) external

getRewardBalance(address user) → uint256
getDailyStats(address user, uint date) → DailyStats
```

---

### 3. `Whitelist.sol` (Access Control)

```solidity
addToWhitelist(address wallet, string nim) external onlyAdmin
removeFromWhitelist(address wallet) external onlyAdmin
isWhitelisted(address wallet) → bool
getStudentInfo(address wallet) → StudentInfo
```

---

## 🗃️ DATABASE SCHEMA (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  nim           String    @unique
  name          String
  angkatan      Int
  isVerified    Boolean   @default(false)
  createdAt     DateTime  @default(now())
  
  posts         Post[]
  answers       Answer[]
  comments      Comment[]
  rewards       RewardHistory[]
}

model Post {
  id          String    @id @default(cuid())
  title       String
  body        String
  tags        String[]
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  answers     Answer[]
  comments    Comment[]
  likes       Like[]
  bestAnswer  String?   // Answer id
  txHash      String?   // On-chain transaction hash
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Answer {
  id          String    @id @default(cuid())
  body        String
  postId      String
  post        Post      @relation(fields: [postId], references: [id])
  authorId    String
  author      User      @relation(fields: [authorId], references: [id])
  comments    Comment[]
  likes       Like[]
  isBest      Boolean   @default(false)
  txHash      String?
  createdAt   DateTime  @default(now())
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  postId    String?
  answerId  String?
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String?
  answerId  String?
  createdAt DateTime @default(now())

  @@unique([userId, postId])
  @@unique([userId, answerId])
}

model RewardHistory {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  action      String
  amount      Int
  txHash      String
  contentId   String?
  createdAt   DateTime   @default(now())
}

model ChatMessage {
  id        String   @id @default(cuid())
  body      String
  authorId  String
  roomId    String   @default("general")
  createdAt DateTime @default(now())
}
```

---

## 🔌 API ENDPOINTS

### Auth
```
POST   /api/auth/nonce          → Get SIWE nonce
POST   /api/auth/verify         → Verify SIWE signature → JWT
POST   /api/auth/register       → Register NIM + wallet
DELETE /api/auth/logout
GET    /api/auth/me             → Current user info
```

### Posts (Q&A)
```
GET    /api/posts               → List semua pertanyaan (paginated)
POST   /api/posts               → Buat pertanyaan baru (+5 CSIT)
GET    /api/posts/:id           → Detail pertanyaan
DELETE /api/posts/:id           → Hapus (only author)
POST   /api/posts/:id/answers   → Jawab pertanyaan (+10 CSIT)
POST   /api/posts/:id/best      → Pilih best answer (+20 CSIT ke answerer)
POST   /api/posts/:id/like      → Like pertanyaan (+2 CSIT ke author)
POST   /api/posts/:id/share     → Share (+1 CSIT ke author)
```

### Comments
```
POST   /api/comments            → Buat comment (+1 CSIT)
DELETE /api/comments/:id        → Hapus comment
POST   /api/comments/:id/like   → Like comment
```

### Rewards
```
GET    /api/rewards/balance     → CSIT balance on-chain
GET    /api/rewards/history     → Riwayat reward
GET    /api/rewards/daily-stats → Statistik hari ini
```

### Leaderboard
```
GET    /api/leaderboard         → Top mahasiswa by CSIT
GET    /api/leaderboard/weekly  → Leaderboard mingguan
```

### Admin
```
POST   /api/admin/whitelist     → Tambah mahasiswa
DELETE /api/admin/whitelist/:nim → Hapus mahasiswa
GET    /api/admin/students      → List semua mahasiswa
GET    /api/admin/stats         → Platform statistics
```

---

## 🔐 AUTHENTICATION FLOW

```
1. User buka website → klik "Connect Wallet"
2. RainbowKit buka MetaMask popup
3. Frontend request nonce: GET /api/auth/nonce
4. User sign pesan SIWE dengan MetaMask (gratis, bukan transaksi)
5. Frontend kirim signature: POST /api/auth/verify
6. Backend verifikasi signature → cek whitelist contract
7. Jika verified → issue JWT token (7 hari)
8. Setiap request selanjutnya pakai JWT di header Authorization
```

**SIWE Message Format:**
```
campus-informatika.local wants you to sign in with your Ethereum account:
{walletAddress}

Sign in to Campus Informatika Community Platform

URI: http://localhost:3000
Version: 1
Chain ID: 11155111
Nonce: {random_nonce}
Issued At: {timestamp}
```

---

## ⚙️ ENVIRONMENT VARIABLES

### `contracts/.env`
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=0xYOUR_DEPLOYER_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

### `backend/.env`
```env
# Server
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/campus_blockchain

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# Blockchain (Sepolia)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BACKEND_WALLET_PRIVATE_KEY=0xYOUR_BACKEND_WALLET_PRIVATE_KEY
CAMPUS_COIN_ADDRESS=0xDEPLOYED_CAMPUS_COIN_ADDRESS
REWARD_MANAGER_ADDRESS=0xDEPLOYED_REWARD_MANAGER_ADDRESS
WHITELIST_ADDRESS=0xDEPLOYED_WHITELIST_ADDRESS
```

### `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CAMPUS_COIN_ADDRESS=0xDEPLOYED_CAMPUS_COIN_ADDRESS
NEXT_PUBLIC_REWARD_MANAGER_ADDRESS=0xDEPLOYED_REWARD_MANAGER_ADDRESS
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID
```

---

## 🚀 GETTING STARTED

### Prerequisites
```bash
node >= 20.0.0
npm >= 10.0.0
postgresql >= 16
redis >= 7
git
MetaMask browser extension
```

### 1. Clone & Install
```bash
git clone https://github.com/your-org/campus-blockchain-chat.git
cd campus-blockchain-chat

# Install semua dependencies
cd contracts && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

### 2. Setup Database
```bash
cd backend
cp .env.example .env
# Edit .env dengan credentials PostgreSQL kamu

npx prisma migrate dev --name init
npx prisma generate
```

### 3. Deploy Smart Contracts ke Sepolia
```bash
cd contracts
cp .env.example .env
# Isi SEPOLIA_RPC_URL dan PRIVATE_KEY

# Get free Sepolia ETH dulu di https://sepoliafaucet.com

npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia

# Catat contract addresses yang muncul di terminal
# Masukkan ke backend/.env dan frontend/.env.local
```

### 4. Run Backend
```bash
cd backend
npm run dev
# Server berjalan di http://localhost:4000
```

### 5. Run Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Isi contract addresses

npm run dev
# App berjalan di http://localhost:3000
```

---

## 🧪 TESTING

### Smart Contract Tests
```bash
cd contracts
npx hardhat test                    # Run semua test
npx hardhat coverage                # Coverage report
npx hardhat test --grep "Reward"    # Test spesifik
```

### Backend Tests
```bash
cd backend
npm run test           # Jest unit tests
npm run test:e2e       # E2E integration tests
npm run test:coverage  # Coverage report
```

### Manual Testing Flow
```
1. Buka http://localhost:3000
2. Connect MetaMask (pastikan network: Sepolia)
3. Register dengan NIM mahasiswa
4. Admin whitelist wallet kamu via /admin
5. Login ulang
6. Buat pertanyaan → cek CSIT balance bertambah
7. Jawab pertanyaan → cek reward masuk
8. Like jawaban → cek reward ke author jawaban
```

---

## 🛡️ SECURITY CONSIDERATIONS

```
✅ Smart Contract
   - ReentrancyGuard pada semua fungsi reward
   - OnlyRole access control (MINTER_ROLE, ADMIN_ROLE)
   - Daily cap reward untuk cegah farming
   - Cooldown per action per wallet

✅ Backend
   - SIWE signature verification
   - JWT dengan expiry
   - Rate limiting per IP (Redis)
   - Input validation (zod)
   - SQL injection prevention (Prisma ORM)
   - Whitelist check setiap request

✅ Frontend
   - Hanya connect ke Sepolia (chain validation)
   - No private key di frontend
   - CSP headers via Next.js
```

---

## 🤖 AI AGENT INSTRUCTIONS

Jika kamu adalah AI agent yang bekerja di project ini, ikuti instruksi berikut:

### PRINSIP UTAMA
1. **ZERO COST** — Selalu gunakan Sepolia Testnet. Jangan pernah menggunakan Ethereum Mainnet atau jaringan berbayar lainnya.
2. **TYPE SAFE** — Semua kode harus TypeScript dengan strict mode.
3. **TEST FIRST** — Setiap smart contract function harus punya unit test sebelum deploy.
4. **NO SECRETS** — Jangan pernah hardcode private key atau API key di source code.

### SAAT MEMBUAT SMART CONTRACT
- Selalu extend dari OpenZeppelin contracts
- Gunakan `AccessControl` bukan `Ownable` untuk multi-role
- Tambahkan event untuk setiap state change
- Tambahkan `NatSpec` comments pada setiap fungsi
- Verifikasi contract di Etherscan setelah deploy

### SAAT MEMBUAT API ENDPOINT
- Ikuti struktur folder yang sudah ada di `backend/src/routes/`
- Selalu validasi input dengan `zod`
- Selalu cek `isWhitelisted` sebelum reward action
- Return format konsisten: `{ success: bool, data: any, error?: string }`
- Log semua blockchain transactions dengan txHash

### SAAT MEMBUAT FRONTEND COMPONENT
- Gunakan `useAccount`, `useReadContract`, `useWriteContract` dari wagmi
- Handle loading, error, dan success states
- Tampilkan CSIT balance realtime menggunakan `useWatchContractEvent`
- Konfirmasi transaksi sebelum submit ke blockchain

### CODING CONVENTIONS
```
Files:           kebab-case     (reward-manager.ts)
Components:      PascalCase     (QuestionCard.tsx)
Functions:       camelCase      (getRewardBalance)
Constants:       UPPER_SNAKE    (MAX_DAILY_REWARD)
Contracts:       PascalCase     (RewardManager.sol)
DB Tables:       snake_case     (reward_history)
API Routes:      kebab-case     (/api/daily-stats)
```

### TASK CHECKLIST SEBELUM COMMIT
```
[ ] Smart contract: npx hardhat test → semua pass
[ ] Smart contract: npx hardhat compile → no warnings
[ ] Backend: npm run test → semua pass
[ ] Backend: npm run lint → no errors
[ ] Frontend: npm run build → no errors
[ ] Tidak ada private key / secret di code
[ ] Contract address update di semua .env
[ ] AGENT.md update jika ada perubahan arsitektur
```

---

## 📊 FITUR ROADMAP

> Setiap phase dikerjakan oleh **1 anggota tim** sebagai penanggung jawab utama.  
> Total tim: **5 anggota (Anggota 1 — Anggota 5)**.  
> Anggota lain boleh membantu, tapi PIC-nya tetap yang bertanggung jawab penuh.

---

### Phase 1 — Smart Contracts & Blockchain Layer
**👤 PIC: Anggota 1**

```
Tanggung Jawab:
  Menulis, menguji, dan men-deploy semua smart contract ke Sepolia Testnet.

Task List:
  [ ] Setup project Hardhat + konfigurasi Sepolia
  [ ] Install OpenZeppelin contracts v5
  [ ] Tulis CampusCoin.sol (ERC-20, mintable, pausable)
  [ ] Tulis RewardManager.sol (reward matrix + cooldown + daily cap)
  [ ] Tulis Whitelist.sol (akses kontrol mahasiswa TI)
  [ ] Tulis interfaces/ untuk semua contract
  [ ] Unit test: CampusCoin.test.ts (min. 10 test cases)
  [ ] Unit test: RewardManager.test.ts (min. 15 test cases)
  [ ] Unit test: Whitelist.test.ts (min. 8 test cases)
  [ ] Coverage report ≥ 90%
  [ ] Deploy ke Sepolia via scripts/deploy.ts
  [ ] Verify semua contract di Sepolia Etherscan
  [ ] Catat & update semua contract address ke AGENT.md
  [ ] Ekspor ABI ke frontend/lib/contracts.ts

Deliverable:
  ✅ 3 contract live di Sepolia + verified di Etherscan
  ✅ Contract addresses terdokumentasi di AGENT.md
  ✅ ABI tersedia untuk dipakai backend & frontend
```

---

### Phase 2 — Backend API & Database
**👤 PIC: Anggota 2**

```
Tanggung Jawab:
  Membangun REST API, database schema, autentikasi, dan integrasi blockchain.

Task List:
  [ ] Setup Express + TypeScript + folder structure
  [ ] Setup PostgreSQL + Prisma schema (semua model)
  [ ] Prisma migrate & generate
  [ ] Setup Redis untuk session & rate limiting
  [ ] Implementasi Auth: nonce, SIWE verify, JWT issue
  [ ] Middleware: auth guard, whitelist check, rate limiter
  [ ] Route: POST /posts, GET /posts, GET /posts/:id
  [ ] Route: POST /posts/:id/answers
  [ ] Route: POST /posts/:id/best (pilih best answer)
  [ ] Route: POST /posts/:id/like & /share
  [ ] Route: POST /comments, DELETE /comments/:id
  [ ] Route: GET /rewards/balance, GET /rewards/history
  [ ] Route: GET /leaderboard, GET /leaderboard/weekly
  [ ] Route: Admin whitelist management
  [ ] Service: blockchain.ts (viem client, contract calls)
  [ ] Service: reward.ts (hitung & distribute reward)
  [ ] Event listener: listen on-chain events → update DB
  [ ] Dokumentasi API endpoint (bisa Postman collection)

Deliverable:
  ✅ API berjalan di localhost:4000
  ✅ Semua endpoint tertes via Postman / curl
  ✅ Database schema teraplikasi
  ✅ Reward terdistribusi on-chain saat aksi terjadi
```

---

### Phase 3 — Realtime Chat & Notification System
**👤 PIC: Anggota 3**

```
Tanggung Jawab:
  Membangun sistem chat realtime dan notifikasi berbasis Socket.io.

Task List:
  [✅] Setup Socket.io di backend (socket/chat.ts)
  [✅] Definisi room: "general", per-pertanyaan, per-angkatan
  [✅] Event: join_room, leave_room, send_message, typing
  [✅] Event: new_question, new_answer, reward_received (broadcast)
  [✅] Persistensi: simpan ChatMessage ke PostgreSQL
  [✅] Anti-spam: max 1 pesan per 3 detik per user
  [✅] Komponen frontend: ChatWindow.tsx (realtime feed)
  [✅] Komponen frontend: ChatInput.tsx + typing indicator
  [✅] Komponen frontend: OnlineUsers.tsx (siapa yang online)
  [✅] Notifikasi: toast saat reward masuk (useWatchContractEvent)
  [✅] Notifikasi: badge counter pertanyaan belum dijawab
  [✅] Notifikasi: highlight jika jawaban kamu dipilih best
  [✅] Halaman /chat lengkap mobile-friendly
  [✅] Test load: simulasi 20 user concurrent

Deliverable:
  ✅ Chat realtime berjalan tanpa refresh
  ✅ Notifikasi reward muncul realtime di UI
  ✅ Halaman /chat responsive di mobile & desktop
```

---

### Phase 4 — Frontend UI & Web3 Integration
**👤 PIC: Anggota 4**

```
Tanggung Jawab:
  Membangun tampilan web lengkap, integrasi wallet, dan semua halaman utama.

Task List:
  [x] Setup Next.js 14 + TailwindCSS + shadcn/ui
  [x] Setup wagmi config (Sepolia only, tolak chain lain)
  [x] Integrasi RainbowKit: ConnectButton + modal
  [x] Halaman /: Q&A Feed + filter by tag + search
  [x] Halaman /ask: form buat pertanyaan + tag input
  [x] Halaman /question/[id]: detail pertanyaan + jawaban
  [x] Komponen: QuestionCard, AnswerCard, PostEditor
  [x] Komponen: LikeButton (trigger on-chain via wagmi)
  [x] Komponen: TokenBalance.tsx (realtime CSIT balance)
  [x] Komponen: TransactionStatus.tsx (pending/confirmed/failed)
  [x] Halaman /leaderboard: ranking + filter mingguan/all-time
  [x] Halaman /profile/[address]: profil + history reward + posts
  [x] Halaman /admin: whitelist management (only admin wallet)
  [x] Onboarding flow: cara install MetaMask + get Sepolia ETH
  [x] Responsive: mobile, tablet, desktop
  [x] Dark mode support

Deliverable:
  ✅ Semua halaman berjalan di localhost:3000
  ✅ Wallet connect, reward, dan transaksi berfungsi
  ✅ UI responsive di semua ukuran layar
```

---

### Phase 5 — Testing, Integrasi, & Demo Preparation
**👤 PIC: Anggota 5**

```
Tanggung Jawab:
  Memastikan semua komponen terintegrasi, bug-free, dan siap dipresentasikan.

Task List:
  [ ] End-to-end test flow lengkap (register → post → reward)
  [ ] Integration test: frontend ↔ backend ↔ smart contract
  [ ] Bug tracking: catat & koordinasi fix ke PIC masing-masing phase
  [ ] Test edge case: wallet tidak ter-whitelist, gas habis (simulasi)
  [ ] Test anti-spam: coba farming reward → pastikan cooldown jalan
  [ ] Performance: load test API dengan Artillery / k6
  [ ] Setup README.md lengkap (cara install, run, test)
  [ ] Buat docs/architecture.md (diagram sistem)
  [ ] Buat docs/smart-contracts.md (penjelasan per fungsi)
  [ ] Buat docs/api-reference.md (semua endpoint + contoh response)
  [ ] Seed data demo: 5 akun mahasiswa, 10 pertanyaan, 20 jawaban
  [ ] Rekam video demo (opsional, untuk laporan)
  [ ] Siapkan slide presentasi (arsitektur + demo flow)
  [ ] Final deploy check: semua contract address benar di semua .env

Deliverable:
  ✅ Aplikasi berjalan end-to-end tanpa error
  ✅ Dokumentasi lengkap (README + docs/)
  ✅ Demo siap dipresentasikan ke dosen
  ✅ Seed data tersedia untuk demo langsung
```

---

## 📚 REFERENSI & RESOURCES

```
OpenZeppelin Docs    : https://docs.openzeppelin.com/contracts/5.x
Hardhat Docs         : https://hardhat.org/docs
wagmi Docs           : https://wagmi.sh
RainbowKit Docs      : https://rainbowkit.com/docs
SIWE Spec            : https://eips.ethereum.org/EIPS/eip-4361
Sepolia Faucet       : https://sepoliafaucet.com
Sepolia Etherscan    : https://sepolia.etherscan.io
Infura (Free RPC)    : https://infura.io (free tier = 100k req/day)
Prisma Docs          : https://prisma.io/docs
Socket.io Docs       : https://socket.io/docs/v4
```

---

*AGENT.md ini adalah source of truth untuk AI agent yang mengerjakan project ini.*  
*Update file ini setiap kali ada perubahan arsitektur besar.*
