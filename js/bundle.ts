import { readFile, readdir } from "fs/promises";
import type { BunPlugin } from "bun";
import { isolatedDeclaration } from "oxc-transform";
import path from "path";

const license =
  (await readFile("../LICENSE", "utf-8"))
    .trim()
    .split("\n")
    .map((line) => `// ${line}`)
    .join("\n") + "\n\n";

function getDtsBunPlugin(): BunPlugin {
  const wroteTrack = new Set<string>();
  return {
    name: "oxc-transform-dts",
    setup(builder) {
      if (builder.config.root && builder.config.outdir) {
        const rootPath = Bun.pathToFileURL(builder.config.root).pathname;
        const outPath = Bun.pathToFileURL(builder.config.outdir).pathname;
        builder.onStart(() => wroteTrack.clear());
        builder.onLoad({ filter: /\.ts$/ }, async (args) => {
          if (args.path.startsWith(rootPath) && !wroteTrack.has(args.path)) {
            wroteTrack.add(args.path);
            const { code } = isolatedDeclaration(
              args.path,
              await Bun.file(args.path).text()
            );
            await Bun.write(
              args.path
                .replace(new RegExp(`^${rootPath}`), outPath)
                .replace(/\.ts$/, ".d.ts"),
              license + code
            );
          }
          return undefined;
        });
      }
    },
  };
}

await Bun.build({
  entrypoints: ["./src/apple/receipt", "./src/apple/transaction"],
  outdir: "./build",
  packages: "external",
  root: "./src",
  splitting: true,
  minify: {
    syntax: true,
  },
  banner: license,
  plugins: [getDtsBunPlugin()],
});

// for each .js file in the build directory, write `// @ts-self-types="./filename.d.ts"` to the top
// of the file
const files = await readdir(path.join(import.meta.dirname, "build/"), {
  recursive: true,
});
for (const file of files) {
  if (file.endsWith(".js")) {
    const dtsFile = file.replace(/\.js$/, ".d.ts").split("/").pop()!;
    const jsFile = path.join(import.meta.dirname, "build", file);
    const jsContent = await readFile(jsFile, "utf-8");
    await Bun.write(jsFile, `// @ts-self-types="./${dtsFile}"\n${jsContent}`);
  }
}
