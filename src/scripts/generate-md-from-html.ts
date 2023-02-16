import { readdir, readFile, stat, writeFile } from "fs/promises";
import { join } from "path";
import TurndownService from "turndown";

async function walk(dir: string): Promise<string[]> {
  const immediateFiles = await readdir(dir);

  const recursiveFiles = await Promise.all(
    immediateFiles.map(async (file) => {
      const filePath = join(dir, file);
      const stats = await stat(filePath);
      if (stats.isDirectory()) {
        return walk(filePath);
      } else if (stats.isFile()) {
        return [filePath];
      } else {
        return [];
      }
    })
  );

  const flattenedFiles = recursiveFiles.reduce(
    (all, folderContents) => all.concat(folderContents),
    []
  );

  return flattenedFiles;
}

async function generateMarkdownFromHTML() {
  const htmlFiles = (await walk("src/docs/html")).filter((fileName) =>
    /\.html?$/.test(fileName)
  );

  console.log(`Discovered ${htmlFiles.length} pages`);

  for (const htmlFile of htmlFiles) {
    const path = htmlFile
      .replace(/^src\\docs\\html\\/, "")
      .replace(/\.html?$/, "");

    console.log(path);

    try {
      const contents = await readFile(htmlFile, "utf-8");

      let turndownService = new TurndownService();
      let markdown = turndownService.turndown(contents);

      await writeFile(`src/docs/md/${path}.md`, markdown, "utf-8");
    } catch (err) {
      console.error(`Page '${path}' failed to process.`);
      console.error(err);
    }
  }
}

async function main() {
  await generateMarkdownFromHTML();
}

main().catch((err) => console.error(err));
