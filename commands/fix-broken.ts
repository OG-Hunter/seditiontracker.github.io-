import { Command } from "commander";
import { fileExists, readFile } from "./common/file";
import { execSync } from "child_process";
import { warning } from "./common/console";

const migrate = new Command();
migrate.parse(process.argv);

const doBroken = () => {
  const fileList = readFile("./missing.txt");
  const files = fileList.split("\n");

  for (const file of files) {
    const oldFile = file.replace(".jpg", ".png");

    if (fileExists(oldFile)) {
      execSync(`convert ${oldFile} ${file}`, {
        stdio: "inherit",
      });
    } else {
      warning("Missing file: " + oldFile);
    }

    execSync(`rm -rf ${oldFile}`);
  }
};

doBroken();
