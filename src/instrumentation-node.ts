import { execFile } from "node:child_process";

export async function removeLegacyProductionWorker() {
  if (process.env.NODE_ENV !== "production") return;

  await new Promise<void>((resolve) => {
    execFile("pm2", ["delete", "omentir-green"], { timeout: 10_000 }, (error) => {
      if (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.toLowerCase().includes("not found")) {
          console.warn(`[startup] Could not remove legacy omentir-green worker: ${message}`);
        }
        resolve();
        return;
      }

      execFile("pm2", ["save"], { timeout: 10_000 }, (saveError) => {
        if (saveError) {
          const message = saveError instanceof Error ? saveError.message : String(saveError);
          console.warn(`[startup] Removed omentir-green but could not save PM2 state: ${message}`);
        } else {
          console.log("[startup] Removed legacy omentir-green worker and saved PM2 state.");
        }
        resolve();
      });
    });
  });
}
