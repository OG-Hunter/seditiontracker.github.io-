import { Command } from "commander";
import { exitWithError, info } from "./common/console";
import fs from "fs";
import { readFile, writeFile } from "./common/file";
import { exit } from "process";
import { execSync } from 'child_process'

const cmd = new Command('indict')
  .requiredOption("-s, --slug [slug]", "filename slug")
  .requiredOption("-d, --date [date]", "date of guilty plea");
cmd.parse(process.argv);

const indict = async() => {
  const suspectFiles = fs.readdirSync('./docs/_suspects');
  const nameSet:Set<string> = new Set();
  let maxId = 0;

  for (const suspectFile of suspectFiles) {
    if (suspectFile.replace(".md", "") == cmd.slug) {
      info("Changing status to indicted");

      const suspectPath = `./docs/_suspects/${suspectFile}`
      let data = readFile(suspectPath)

      data = data.replace(/status: .*\n/, "status: Indicted\n")
      if (/indicted:.*\n/.test(data)) {
        data = data.replace(/indicted:.*\n/, `indicted: ${cmd.date}\n`)
      } else {
        data.match(/(charged:.*\n)/)
        data = data.replace(/(charged:.*\n)/, `${RegExp.$1}indicted: ${cmd.date}\n`)
      }

      writeFile(suspectPath, data)
      execSync(`yarn suspect preview -f ${RegExp.$1} -s Indicted`)

      exit()
    }
  }
  exitWithError(`No such file ${cmd.slug}.md`)
}

indict();
