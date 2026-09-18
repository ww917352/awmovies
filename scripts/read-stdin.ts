// Reads one line from stdin — used when the caller passes "-" as the
// password argument instead of typing/pasting it directly on the command
// line, where it would sit in shell history and be visible to anyone else
// on the machine via `ps`. Works for both `echo "pw" | npx tsx script.ts -`
// and typing it interactively (visibly — this reads raw stdin, not a
// hidden-echo prompt) when stdin is a TTY.
//
// Deliberately not `readline`/`readline/promises`: this project's tsconfig
// includes the DOM lib for the frontend code, which shadows the global
// `ReadableStream` name those modules' types reference, making them
// unusable here without an unrelated tsconfig split. Reading process.stdin
// directly avoids that.
export function readLineFromStdin(prompt: string): Promise<string> {
  if (process.stdin.isTTY) {
    process.stderr.write(prompt);
  }
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data.split('\n')[0].trim());
    });
  });
}
