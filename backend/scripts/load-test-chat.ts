/**
 * Load test: simulasi 20 user concurrent di room general.
 * Jalankan: npm run load-test (backend harus sudah running)
 */
import { io as ioClient, Socket } from "socket.io-client";

const API_URL = process.env.API_URL ?? "http://localhost:4000";
const USER_COUNT = 20;
const MESSAGES_PER_USER = 3;
const ROOM_ID = "general";

interface TestResult {
  connected: number;
  messagesSent: number;
  errors: string[];
  durationMs: number;
}

async function createUser(index: number): Promise<{
  socket: Socket;
  messagesSent: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let messagesSent = 0;

  return new Promise((resolve, reject) => {
    const socket = ioClient(API_URL, {
      auth: {
        userId: `loadtest-user-${index}`,
        name: `LoadTest User ${index}`,
        angkatan: 2022 + (index % 3),
      },
      transports: ["websocket"],
      reconnection: false,
    });

    const timeout = setTimeout(() => {
      errors.push(`User ${index}: connection timeout`);
      socket.disconnect();
      resolve({ socket, messagesSent, errors });
    }, 15000);

    socket.on("connect_error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`User ${index} connect error: ${err.message}`));
    });

    socket.on("connect", () => {
      socket.emit("join_room", { roomId: ROOM_ID }, async (joinRes: { success: boolean; error?: string }) => {
        if (!joinRes?.success) {
          errors.push(`User ${index}: join_room failed - ${joinRes?.error}`);
          clearTimeout(timeout);
          socket.disconnect();
          resolve({ socket, messagesSent, errors });
          return;
        }

        for (let m = 0; m < MESSAGES_PER_USER; m++) {
          await new Promise((r) => setTimeout(r, 3100));

          await new Promise<void>((msgResolve) => {
            socket.emit(
              "send_message",
              { roomId: ROOM_ID, body: `[User ${index}] Pesan ke-${m + 1} dari load test` },
              (res: { success: boolean; error?: string }) => {
                if (res?.success) {
                  messagesSent++;
                } else {
                  errors.push(`User ${index} msg ${m + 1}: ${res?.error ?? "unknown"}`);
                }
                msgResolve();
              }
            );
          });
        }

        clearTimeout(timeout);
        socket.disconnect();
        resolve({ socket, messagesSent, errors });
      });
    });
  });
}

async function runLoadTest(): Promise<TestResult> {
  console.log(`Starting load test: ${USER_COUNT} concurrent users → ${API_URL}`);
  const start = Date.now();
  const errors: string[] = [];
  let connected = 0;
  let messagesSent = 0;

  const promises = Array.from({ length: USER_COUNT }, (_, i) =>
    createUser(i + 1)
      .then((result) => {
        connected++;
        messagesSent += result.messagesSent;
        errors.push(...result.errors);
        console.log(`User ${i + 1}: ${result.messagesSent}/${MESSAGES_PER_USER} messages sent`);
      })
      .catch((err: Error) => {
        errors.push(err.message);
        console.error(err.message);
      })
  );

  await Promise.all(promises);

  const durationMs = Date.now() - start;
  const result: TestResult = { connected, messagesSent, errors, durationMs };

  console.log("\n--- Load Test Results ---");
  console.log(`Connected users: ${connected}/${USER_COUNT}`);
  console.log(`Messages sent:   ${messagesSent}/${USER_COUNT * MESSAGES_PER_USER}`);
  console.log(`Duration:        ${(durationMs / 1000).toFixed(1)}s`);
  console.log(`Errors:          ${errors.length}`);

  if (errors.length > 0) {
    console.log("\nErrors:");
    errors.slice(0, 10).forEach((e) => console.log(`  - ${e}`));
    if (errors.length > 10) console.log(`  ... and ${errors.length - 10} more`);
  }

  const success = connected === USER_COUNT && messagesSent === USER_COUNT * MESSAGES_PER_USER;
  console.log(success ? "\n✅ Load test PASSED" : "\n❌ Load test FAILED");
  process.exit(success ? 0 : 1);
}

runLoadTest();
