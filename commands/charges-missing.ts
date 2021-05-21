import { Command } from "commander";
import { getSuspectByFile } from "./common/suspect"
import fs from "fs";
import { info, warning } from "./common/console";
import { isEmpty } from "lodash"

const cmd = new Command();
cmd.parse(process.argv);

const doMissing = () => {
  info("Looking for suspects with missing charges")
  const suspectFiles = fs.readdirSync('./docs/_suspects');
  const nameSet:Set<string> = new Set();

  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile)

    if (isEmpty(suspect.charges)) {
      console.log(suspect.name)
    }
  }

}

doMissing()