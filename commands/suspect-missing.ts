import { Command } from "commander";
import { info } from "./common/console";
import fs from "fs";
import { readFile, writeFile } from "./common/file";

const cmd = new Command("missing").option("--news", "identify suspects missing news report");
cmd.parse(process.argv);

const unpublished = async () => {
  info("Generating list of suspects with missing info");

  const suspectFiles = fs.readdirSync("./docs/_suspects");
  const nameSet: Set<string> = new Set();

  for (const suspectFile of suspectFiles) {
    const suspectPath = `./docs/_suspects/${suspectFile}`;
    const data = readFile(suspectPath);

    const name = data.match(/name:\s(.*)\n/)[1];
    const lastName = name.split(" ").slice(1).join(" ");
    nameSet.add(lastName.toUpperCase());

    if (cmd.news && !/\[News Report]/.test(data)) {
      console.log(name);
    }
  }
};

unpublished();
