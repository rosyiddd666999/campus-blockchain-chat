import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  walletAddress: string;
  nim: string;
  name: string;
  angkatan: number;
  isVerified: boolean;
  balance: number;
  reputation: number; // contribution score
}

export interface Post {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorId: string; // walletAddress
  authorName: string;
  likes: string[]; // walletAddresses
  answersCount: number;
  bestAnswerId: string | null;
  txHash: string | null;
  createdAt: string;
}

export interface Answer {
  id: string;
  postId: string;
  body: string;
  authorId: string; // walletAddress
  authorName: string;
  likes: string[]; // walletAddresses
  isBest: boolean;
  txHash: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string | null;
  answerId: string | null;
  body: string;
  authorId: string; // walletAddress
  authorName: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  channel: string; // "general", "2021", "2022", "question-id", etc.
  body: string;
  authorId: string; // walletAddress
  authorName: string;
  createdAt: string;
}

export interface Web3Tx {
  id: string;
  txHash: string;
  status: "pending" | "confirmed" | "failed";
  description: string;
  timestamp: string;
}

export interface WhitelistItem {
  walletAddress: string;
  nim: string;
  name: string;
  angkatan: number;
  addedAt: string;
}

interface AppState {
  users: Record<string, UserProfile>;
  posts: Post[];
  answers: Answer[];
  comments: Comment[];
  chatMessages: ChatMessage[];
  whitelist: WhitelistItem[];
  transactions: Web3Tx[];
  currentUserAddress: string | null;

  // Actions
  setCurrentUser: (address: string | null) => void;
  registerOrUpdateUser: (address: string, details: Partial<UserProfile>) => UserProfile;
  addQuestion: (title: string, body: string, tags: string[], address: string) => void;
  addAnswer: (postId: string, body: string, address: string) => void;
  addComment: (postId: string | null, answerId: string | null, body: string, address: string) => void;
  likePost: (postId: string, address: string) => void;
  likeAnswer: (answerId: string, address: string) => void;
  selectBestAnswer: (postId: string, answerId: string, address: string) => void;
  sendChatMessage: (channel: string, body: string, address: string) => boolean;
  addToWhitelist: (wallet: string, nim: string, name: string, angkatan: number) => void;
  removeFromWhitelist: (wallet: string) => void;
  addTransaction: (description: string) => string;
  confirmTransaction: (txHash: string) => void;
}

// Initial Mock Seed Data
const initialUsers: Record<string, UserProfile> = {
  "0x1111111111111111111111111111111111111111": {
    walletAddress: "0x1111111111111111111111111111111111111111",
    nim: "21.11.4321",
    name: "Ahmad Rosyid",
    angkatan: 2021,
    isVerified: true,
    balance: 150,
    reputation: 85,
  },
  "0x2222222222222222222222222222222222222222": {
    walletAddress: "0x2222222222222222222222222222222222222222",
    nim: "22.11.9876",
    name: "Budi Santoso",
    angkatan: 2022,
    isVerified: true,
    balance: 75,
    reputation: 40,
  },
  "0x3333333333333333333333333333333333333333": {
    walletAddress: "0x3333333333333333333333333333333333333333",
    nim: "23.11.1234",
    name: "Citra Lestari",
    angkatan: 2023,
    isVerified: true,
    balance: 10,
    reputation: 5,
  },
};

const initialWhitelist: WhitelistItem[] = [
  {
    walletAddress: "0x1111111111111111111111111111111111111111",
    nim: "21.11.4321",
    name: "Ahmad Rosyid",
    angkatan: 2021,
    addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    walletAddress: "0x2222222222222222222222222222222222222222",
    nim: "22.11.9876",
    name: "Budi Santoso",
    angkatan: 2022,
    addedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    walletAddress: "0x3333333333333333333333333333333333333333",
    nim: "23.11.1234",
    name: "Citra Lestari",
    angkatan: 2023,
    addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialPosts: Post[] = [
  {
    id: "post-1",
    title: "Bagaimana cara deploy smart contract ERC-20 di Sepolia?",
    body: "Halo semuanya, saya sedang belajar membuat token ERC-20 menggunakan Solidity dan OpenZeppelin. Saya bingung cara deploy-nya ke Sepolia menggunakan Hardhat. Ada yang punya boilerplate config `hardhat.config.ts` untuk Sepolia?",
    tags: ["solidity", "hardhat", "sepolia", "erc20"],
    authorId: "0x2222222222222222222222222222222222222222",
    authorName: "Budi Santoso",
    likes: ["0x1111111111111111111111111111111111111111"],
    answersCount: 1,
    bestAnswerId: "ans-1",
    txHash: "0x123f...ab99",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "post-2",
    title: "Error hydration Next.js 15 dengan RainbowKit",
    body: "Apakah ada yang mengalami error `Hydration failed because the initial UI does not match what was rendered from the server` saat menggunakan RainbowKit di Next.js 15 App Router? Bagaimana cara mengatasinya secara bersih?",
    tags: ["nextjs", "rainbowkit", "hydration"],
    authorId: "0x3333333333333333333333333333333333333333",
    authorName: "Citra Lestari",
    likes: [],
    answersCount: 0,
    bestAnswerId: null,
    txHash: "0x789a...de32",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
];

const initialAnswers: Answer[] = [
  {
    id: "ans-1",
    postId: "post-1",
    body: "Kamu bisa menggunakan config berikut. Pastikan sudah install `@nomicfoundation/hardhat-toolbox` dan setup `.env` file dengan `INFURA_API_KEY` dan `SEPOLIA_PRIVATE_KEY` kamu:\n\n```typescript\nimport { HardhatUserConfig } from \"hardhat/config\";\nimport \"@nomicfoundation/hardhat-toolbox\";\nimport * as dotenv from \"dotenv\";\ndotenv.config();\n\nconst config: HardhatUserConfig = {\n  solidity: \"0.8.24\",\n  networks: {\n    sepolia: {\n      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,\n      accounts: [process.env.SEPOLIA_PRIVATE_KEY || \"\"],\n    }\n  }\n};\nexport default config;\n```",
    authorId: "0x1111111111111111111111111111111111111111",
    authorName: "Ahmad Rosyid",
    likes: ["0x2222222222222222222222222222222222222222"],
    isBest: true,
    txHash: "0xabcd...1234",
    createdAt: new Date(Date.now() - 1.8 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialComments: Comment[] = [
  {
    id: "c-1",
    postId: "post-1",
    answerId: null,
    body: "Wah pas sekali, saya juga butuh ini. Terima kasih pertanyaannya Budi!",
    authorId: "0x3333333333333333333333333333333333333333",
    authorName: "Citra Lestari",
    createdAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialMessages: ChatMessage[] = [
  {
    id: "m-1",
    channel: "general",
    body: "Halo semuanya, selamat datang di chat Informatika Community Platform!",
    authorId: "0x1111111111111111111111111111111111111111",
    authorName: "Ahmad Rosyid",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "m-2",
    channel: "general",
    body: "Halo bang Rosyid! Keren banget platformnya 👍",
    authorId: "0x2222222222222222222222222222222222222222",
    authorName: "Budi Santoso",
    createdAt: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to generate tx hash
const makeTxHash = () => "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: initialUsers,
      posts: initialPosts,
      answers: initialAnswers,
      comments: initialComments,
      chatMessages: initialMessages,
      whitelist: initialWhitelist,
      transactions: [],
      currentUserAddress: null,

      setCurrentUser: (address) => {
        set({ currentUserAddress: address });
        if (address) {
          get().registerOrUpdateUser(address, {});
        }
      },

      registerOrUpdateUser: (address, details) => {
        const key = address.toLowerCase();
        const existing = get().users[key];
        const isWhitelisted = get().whitelist.some(w => w.walletAddress.toLowerCase() === key);
        const whitelistInfo = get().whitelist.find(w => w.walletAddress.toLowerCase() === key);

        const updated: UserProfile = {
          walletAddress: address,
          nim: details.nim || whitelistInfo?.nim || existing?.nim || "",
          name: details.name || whitelistInfo?.name || existing?.name || `Mahasiswa_${address.slice(2, 6)}`,
          angkatan: details.angkatan || whitelistInfo?.angkatan || existing?.angkatan || 2024,
          isVerified: isWhitelisted,
          balance: existing ? existing.balance : (isWhitelisted ? 10 : 0), // starter pack
          reputation: existing ? existing.reputation : 0,
        };

        set((state) => ({
          users: { ...state.users, [key]: updated },
        }));
        return updated;
      },

      addQuestion: (title, body, tags, address) => {
        const key = address.toLowerCase();
        const txHash = makeTxHash();

        // 1. Register transaction
        const txId = get().addTransaction(`Deploy Question & Mint 5 CSIT reward: "${title}"`);

        // 2. Add post
        const newPost: Post = {
          id: `post-${Date.now()}`,
          title,
          body,
          tags: tags.map(t => t.trim().toLowerCase()).filter(Boolean),
          authorId: address,
          authorName: get().users[key]?.name || `Mahasiswa_${address.slice(2, 6)}`,
          likes: [],
          answersCount: 0,
          bestAnswerId: null,
          txHash,
          createdAt: new Date().toISOString(),
        };

        // 3. Update User Balance (Matrix: postQuestion = 5 CSIT, +5 reputation)
        const updatedUsers = { ...get().users };
        if (updatedUsers[key]) {
          updatedUsers[key].balance += 5;
          updatedUsers[key].reputation += 5;
        }

        set((state) => ({
          posts: [newPost, ...state.posts],
          users: updatedUsers,
        }));

        // 4. Confirm Tx in 2s
        setTimeout(() => {
          get().confirmTransaction(txHash);
        }, 2000);
      },

      addAnswer: (postId, body, address) => {
        const key = address.toLowerCase();
        const txHash = makeTxHash();

        const txId = get().addTransaction(`Post Answer & Mint 10 CSIT reward`);

        const newAnswer: Answer = {
          id: `ans-${Date.now()}`,
          postId,
          body,
          authorId: address,
          authorName: get().users[key]?.name || `Mahasiswa_${address.slice(2, 6)}`,
          likes: [],
          isBest: false,
          txHash,
          createdAt: new Date().toISOString(),
        };

        const updatedUsers = { ...get().users };
        if (updatedUsers[key]) {
          updatedUsers[key].balance += 10;
          updatedUsers[key].reputation += 10;
        }

        set((state) => ({
          answers: [...state.answers, newAnswer],
          posts: state.posts.map(p => p.id === postId ? { ...p, answersCount: p.answersCount + 1 } : p),
          users: updatedUsers,
        }));

        setTimeout(() => {
          get().confirmTransaction(txHash);
        }, 2000);
      },

      addComment: (postId, answerId, body, address) => {
        const key = address.toLowerCase();
        const newComment: Comment = {
          id: `comment-${Date.now()}`,
          postId,
          answerId,
          body,
          authorId: address,
          authorName: get().users[key]?.name || `Mahasiswa_${address.slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };

        const updatedUsers = { ...get().users };
        if (updatedUsers[key]) {
          updatedUsers[key].balance += 1; // Comment matrix = 1 CSIT
          updatedUsers[key].reputation += 1;
        }

        set((state) => ({
          comments: [...state.comments, newComment],
          users: updatedUsers,
        }));
      },

      likePost: (postId, address) => {
        const targetPost = get().posts.find(p => p.id === postId);
        if (!targetPost) return;

        const isLiking = !targetPost.likes.includes(address);
        const authorKey = targetPost.authorId.toLowerCase();

        const updatedPosts = get().posts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: isLiking ? [...p.likes, address] : p.likes.filter(a => a !== address),
            };
          }
          return p;
        });

        // Matrix: receiveLike = 2 CSIT to the author
        const updatedUsers = { ...get().users };
        if (isLiking && updatedUsers[authorKey]) {
          updatedUsers[authorKey].balance += 2;
          updatedUsers[authorKey].reputation += 2;
          get().addTransaction(`Mint 2 CSIT reward for Like received on question`);
        }

        set({
          posts: updatedPosts,
          users: updatedUsers,
        });
      },

      likeAnswer: (answerId, address) => {
        const targetAns = get().answers.find(a => a.id === answerId);
        if (!targetAns) return;

        const isLiking = !targetAns.likes.includes(address);
        const authorKey = targetAns.authorId.toLowerCase();

        const updatedAnswers = get().answers.map(a => {
          if (a.id === answerId) {
            return {
              ...a,
              likes: isLiking ? [...a.likes, address] : a.likes.filter(x => x !== address),
            };
          }
          return a;
        });

        // Matrix: receiveLike = 2 CSIT to the author
        const updatedUsers = { ...get().users };
        if (isLiking && updatedUsers[authorKey]) {
          updatedUsers[authorKey].balance += 2;
          updatedUsers[authorKey].reputation += 2;
          get().addTransaction(`Mint 2 CSIT reward for Like received on answer`);
        }

        set({
          answers: updatedAnswers,
          users: updatedUsers,
        });
      },

      selectBestAnswer: (postId, answerId, address) => {
        const targetAns = get().answers.find(a => a.id === answerId);
        if (!targetAns) return;

        const txHash = makeTxHash();
        get().addTransaction(`Select Best Answer & Mint 20 CSIT reward to ${targetAns.authorName}`);

        const updatedAnswers = get().answers.map(a => {
          if (a.postId === postId) {
            return { ...a, isBest: a.id === answerId };
          }
          return a;
        });

        const updatedPosts = get().posts.map(p => {
          if (p.id === postId) {
            return { ...p, bestAnswerId: answerId };
          }
          return p;
        });

        // Matrix: bestAnswerSelected = 20 CSIT to answer author
        const authorKey = targetAns.authorId.toLowerCase();
        const updatedUsers = { ...get().users };
        if (updatedUsers[authorKey]) {
          updatedUsers[authorKey].balance += 20;
          updatedUsers[authorKey].reputation += 20;
        }

        set({
          answers: updatedAnswers,
          posts: updatedPosts,
          users: updatedUsers,
        });

        setTimeout(() => {
          get().confirmTransaction(txHash);
        }, 2000);
      },

      sendChatMessage: (channel, body, address) => {
        // Anti spam: check if user sent a message in the last 3 seconds
        const userMessages = get().chatMessages.filter(
          m => m.authorId.toLowerCase() === address.toLowerCase()
        );
        if (userMessages.length > 0) {
          const lastMsgTime = new Date(userMessages[userMessages.length - 1].createdAt).getTime();
          if (Date.now() - lastMsgTime < 3000) {
            return false; // rate limited!
          }
        }

        const key = address.toLowerCase();
        const newMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          channel,
          body,
          authorId: address,
          authorName: get().users[key]?.name || `Mahasiswa_${address.slice(2, 6)}`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          chatMessages: [...state.chatMessages, newMsg],
        }));

        // Simulate a helper response if it's general chat and contains a question
        if (channel === "general" && body.includes("?")) {
          setTimeout(() => {
            const replyMsg: ChatMessage = {
              id: `msg-reply-${Date.now()}`,
              channel: "general",
              body: `Halo @${newMsg.authorName}, untuk kendala tersebut bisa ditanyakan langsung di Forum Q&A agar mahasiswa lain yang tahu bisa memberikan jawaban terbaik dan mendapatkan reward token CSIT!`,
              authorId: "0x1111111111111111111111111111111111111111",
              authorName: "Ahmad Rosyid (Admin)",
              createdAt: new Date().toISOString(),
            };
            set((state) => ({
              chatMessages: [...state.chatMessages, replyMsg],
            }));
          }, 2500);
        }

        return true;
      },

      addToWhitelist: (wallet, nim, name, angkatan) => {
        const newWhitelistItem: WhitelistItem = {
          walletAddress: wallet,
          nim,
          name,
          angkatan,
          addedAt: new Date().toISOString(),
        };

        const key = wallet.toLowerCase();
        const updatedUsers = { ...get().users };
        if (updatedUsers[key]) {
          updatedUsers[key].isVerified = true;
          updatedUsers[key].nim = nim;
          updatedUsers[key].name = name;
          updatedUsers[key].angkatan = angkatan;
        }

        set((state) => ({
          whitelist: [...state.whitelist.filter(w => w.walletAddress.toLowerCase() !== key), newWhitelistItem],
          users: updatedUsers,
        }));

        get().addTransaction(`Admin: Add ${name} (${nim}) to Whitelist registry`);
      },

      removeFromWhitelist: (wallet) => {
        const key = wallet.toLowerCase();
        const updatedUsers = { ...get().users };
        if (updatedUsers[key]) {
          updatedUsers[key].isVerified = false;
        }

        set((state) => ({
          whitelist: state.whitelist.filter(w => w.walletAddress.toLowerCase() !== key),
          users: updatedUsers,
        }));

        get().addTransaction(`Admin: Revoke whitelist status for ${wallet.slice(0, 6)}...${wallet.slice(-4)}`);
      },

      addTransaction: (description) => {
        const txHash = makeTxHash();
        const newTx: Web3Tx = {
          id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          txHash,
          status: "pending",
          description,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          transactions: [newTx, ...state.transactions].slice(0, 15), // keep last 15
        }));

        return txHash;
      },

      confirmTransaction: (txHash) => {
        set((state) => ({
          transactions: state.transactions.map(t =>
            t.txHash === txHash ? { ...t, status: "confirmed" } : t
          ),
        }));
      },
    }),
    {
      name: "icp-blockchain-chat-store",
    }
  )
);
