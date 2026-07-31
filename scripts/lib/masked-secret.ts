import { emitKeypressEvents } from "node:readline";

export async function readMaskedSecret({
  environmentVariable,
  prompt,
}: {
  environmentVariable: string;
  prompt: string;
}): Promise<string> {
  const supplied = process.env[environmentVariable];
  if (supplied) return supplied;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      `No interactive terminal. Supply ${environmentVariable} through a non-committed environment variable.`,
    );
  }

  emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdout.write(`${prompt} (input hidden): `);
  let secret = "";

  return new Promise((resolve, reject) => {
    const onKeypress = (
      character: string,
      key: { name?: string; ctrl?: boolean },
    ) => {
      if (key.ctrl && key.name === "c") {
        cleanup();
        reject(new Error("Operator action cancelled."));
        return;
      }
      if (key.name === "return") {
        process.stdout.write("\n");
        cleanup();
        resolve(secret);
        return;
      }
      if (key.name === "backspace") {
        secret = secret.slice(0, -1);
        return;
      }
      if (character && !key.ctrl) secret += character;
    };
    const cleanup = () => {
      process.stdin.off("keypress", onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    process.stdin.on("keypress", onKeypress);
  });
}
