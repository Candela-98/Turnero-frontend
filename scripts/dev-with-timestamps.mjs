import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextCli = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextCli, "dev", ...process.argv.slice(2)], {
  stdio: ["inherit", "pipe", "pipe"],
});

function timestamp() {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function prefixStream(stream, output) {
  let pending = "";

  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";

    for (const line of lines) {
      output.write(`[${timestamp()}] ${line}\n`);
    }
  });

  return () => {
    if (pending) {
      output.write(`[${timestamp()}] ${pending}\n`);
    }
  };
}

const flushStdout = prefixStream(child.stdout, process.stdout);
const flushStderr = prefixStream(child.stderr, process.stderr);

child.on("exit", (code, signal) => {
  flushStdout();
  flushStderr();
  process.exitCode = code ?? (signal ? 1 : 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
