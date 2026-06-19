import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Memulai pembersihan database...");
  // Hapus data lama dengan urutan yang benar (child table dahulu)
  await prisma.chatMessage.deleteMany({});
  await prisma.rewardHistory.deleteMany({});
  await prisma.like.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("🌱 Mulai melakukan seeding data dummy...");

  // 1. Buat Data Users (Mahasiswa)
  const alice = await prisma.user.create({
    data: {
      walletAddress: "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266".toLowerCase(), // Dummy Address Hardhat/MetaMask
      nim: "2201010001",
      name: "Alice Margatroid",
      angkatan: 2022,
      isVerified: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8".toLowerCase(),
      nim: "2301010042",
      name: "Budi Santoso",
      angkatan: 2023,
      isVerified: true,
    },
  });

  const charlie = await prisma.user.create({
    data: {
      walletAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc".toLowerCase(),
      nim: "2401010109",
      name: "Charlie Situmorang",
      angkatan: 204,
      isVerified: false, // Belum di-whitelist oleh admin
    },
  });

  console.log(`✅ ${[alice, bob, charlie].length} users berhasil dibuat.`);

  // 2. Buat Data Post (Pertanyaan) oleh Alice
  const post1 = await prisma.post.create({
    data: {
      title: "Mengapa deploy contract di Sepolia selalu fail out-of-gas?",
      body: "Halo semuanya, saya sedang mencoba mendeploy smart contract RewardManager menggunakan Hardhat ke Sepolia Testnet. Namun selalu memicu error 'Transaction ran out of gas'. Padahal saya sudah pasang gas limit yang cukup tinggi. Ada yang tahu solusinya?",
      tags: ["solidity", "hardhat", "sepolia", "error"],
      authorId: alice.id,
      txHash: "0x7a25a95b3b0d243292429ab9cf87f8ad62153c9f28c2eb5f2b8a02c89694ff8a",
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Rekomendasi library state management Next.js 15 selain Zustand",
      body: "Apakah di sini ada yang pakai Redux Toolkit atau Jotai untuk project skala besar di Next.js App Router? Bagaimana perbandingan performanya dibandingkan dengan Zustand?",
      tags: ["nextjs", "react", "frontend"],
      authorId: bob.id,
    },
  });

  console.log("✅ Pertanyaan forum berhasil di-seed.");

  // 3. Buat Data Answer (Jawaban) oleh Bob untuk post1 milik Alice
  const answer1 = await prisma.answer.create({
    data: {
      body: "Coba periksa konfigurasi compiler di `hardhat.config.ts` kamu. Pastikan versi optimizer-nya diaktifkan (enabled: true, runs: 200). Biasanya contract ukuran besar memakan gas berlebih kalau optimizernya mati.",
      postId: post1.id,
      authorId: bob.id,
      isBest: true, // Ditandai sebagai jawaban terbaik
      txHash: "0x4f36a4b189ff735c0d17d598e914582f34289cf1863eb5f2b8a02c89694ff8b",
    },
  });

  // Update field bestAnswer pada Post1 setelah mendapatkan ID jawaban terbaik
  await prisma.post.update({
    where: { id: post1.id },
    data: { bestAnswer: answer1.id },
  });

  console.log("✅ Jawaban forum berhasil di-seed.");

  // 4. Buat Data Likes & Comments
  await prisma.like.create({
    data: {
      userId: bob.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      body: "Wah terima kasih bang Budi, setelah dinyalain optimizernya langsung sukses deploy!",
      postId: post1.id,
      authorId: alice.id,
    },
  });

  // 5. Buat Data Reward History (Token Minting Log)
  await prisma.rewardHistory.createMany({
    data: [
      {
        userId: alice.id,
        action: "POST_QUESTION",
        amount: 5,
        txHash: post1.txHash!,
        contentId: post1.id,
      },
      {
        userId: bob.id,
        action: "BEST_ANSWER",
        amount: 15,
        txHash: answer1.txHash!,
        contentId: answer1.id,
      },
    ],
  });

  // 6. Buat Data Chat Message Global Room
  await prisma.chatMessage.createMany({
    data: [
      {
        body: "Halo kawan-kawan TI, salam kenal semuanya!",
        authorId: alice.id,
        roomId: "general",
      },
      {
        body: "Salam kenal juga Alice! Jangan lupa klaim token CSIT ya.",
        authorId: bob.id,
        roomId: "general",
      },
    ],
  });

  console.log("✅ Riwayat Reward & Chatroom berhasil di-seed.");
  console.log("🚀 Proses seeding SELESAI!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });