export const CAMPUS_COIN_ADDRESS =
  (process.env.NEXT_PUBLIC_CAMPUS_COIN_ADDRESS as `0x${string}`) ??
  "0x0000000000000000000000000000000000000000";

export const campusCoinAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { name: "from", type: "address", indexed: true },
      { name: "to", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export const REWARD_ACTION_LABELS: Record<string, string> = {
  postQuestion: "Buat Pertanyaan",
  postAnswer: "Jawab Pertanyaan",
  receiveLike: "Menerima Like",
  bestAnswerSelected: "Best Answer",
  postComment: "Komentar",
  sharePost: "Share Post",
};
