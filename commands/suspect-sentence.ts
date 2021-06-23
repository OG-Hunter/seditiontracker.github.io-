import { Command } from "commander";
import { exitWithError, info } from "./common/console";
import fs from "fs";
import { readFile, writeFile } from "./common/file";
import { exit } from "process";
import { execSync } from 'child_process'

const cmd = new Command('sentence')
  .requiredOption("-s, --slug [slug]", "filename slug")
  .requiredOption("-d, --date [date]", "date of sentencing");
cmd.parse(process.argv);

const sentence = async() => {
  const suspectFiles = fs.readdirSync('./docs/_suspects');
  const nameSet:Set<string> = new Set();
  let maxId = 0;

  for (const suspectFile of suspectFiles) {
    if (suspectFile.replace(".md", "") == cmd.slug) {
      info("Changing status to sentenced");

      const suspectPath = `./docs/_suspects/${suspectFile}`
      let data = readFile(suspectPath)

      data = data.replace(/status: .*\n/, "status: Sentenced\n")
      if (/sentenced:.*\n/.test(data)) {
        data = data.replace(/sentenced:.*\n/, `sentenced: ${cmd.date}\n`)
      } else {
        data.match(/(convicted:.*\n)/)
        data = data.replace(/(convicted:.*\n)/, `${RegExp.$1}sentenced: ${cmd.date}\n`)
      }

      writeFile(suspectPath, data)
      data.match(/\/images\/preview\/(.*)\n/)
      execSync(`yarn suspect preview -f ${RegExp.$1} -s Sentenced`)

      exit()
    }
  }
  exitWithError(`No such file ${cmd.slug}.md`)
}

sentence();
