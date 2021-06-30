import { Command } from "commander";
import { exitWithError, info } from "./common/console";
import fs from "fs";
import { readFile, writeFile } from "./common/file";
import { exit } from "process";
import { execSync } from 'child_process'

const cmd = new Command('convict')
  .requiredOption("-s, --slug [slug]", "filename slug")
  .requiredOption("-d, --date [date]", "date of guilty plea");
cmd.parse(process.argv);

const convict = async() => {
  const suspectFiles = fs.readdirSync('./docs/_suspects');
  const nameSet:Set<string> = new Set();
  let maxId = 0;

  for (const suspectFile of suspectFiles) {
    if (suspectFile.replace(".md", "") == cmd.slug) {
      info("Changing status to guilty");

      const suspectPath = `./docs/_suspects/${suspectFile}`
      let data = readFile(suspectPath)

      data = data.replace(/status: .*\n/, "status: Convicted\n")
      if (/convicted:.*\n/.test(data)) {
        data = data.replace(/convicted:.*\n/, `convicted: ${cmd.date}\n`)
      } else {
        data.match(/(indicted:.*\n)/)
        data = data.replace(/(indicted:.*\n)/, `${RegExp.$1}convicted: ${cmd.date}\n`)
      }

      writeFile(suspectPath, data)
      data.match(/\/images\/preview\/(.*)\n/)

      execSync(`yarn suspect preview -f ${RegExp.$1} -s Convicted`)

      exit()
    }
  }
  exitWithError(`No such file ${cmd.slug}.md`)
}

convict();
