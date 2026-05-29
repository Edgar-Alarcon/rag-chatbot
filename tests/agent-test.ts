import { query } from "@anthropic-ai/claude-agent-sdk";

const prompt =
  process.argv[2] ||
  "Que archivos hay en el directorio actual? Dame un resumen breve.";

console.log(`\n> Prompt: "${prompt}"\n`);

for await (const message of query({
  prompt,
  options: {
    maxTurns: 5,
    permissionMode: "bypassPermissions",
    allowedTools: ["Read", "Bash", "Glob"],
  },
})) {
  if (message.type === "assistant") {
    for (const block of message.message.content) {
      if (block.type === "text") {
        process.stdout.write(block.text);
      }
    }
  }

  if (message.type === "result" && message.subtype === "success") {
    console.log(
      `\n\n--- Costo: $${message.total_cost_usd.toFixed(4)} | Turnos: ${message.num_turns} ---`
    );
  }
}
