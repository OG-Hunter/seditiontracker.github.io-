import { Command } from "commander";
import { exitWithError, info } from "./common/console";
import fs from "fs";
import { readFile } from "./common/file";
import { getSuspectByFile, updateSuspect } from "./common/suspect";
const { execSync } = require('child_process')
import { isEmpty, update } from "lodash";

const verify = new Command()
verify.parse(process.argv);

const doVerify = () => {
  const suspects = fs.readdirSync('./docs/_suspects');

  for (const filename of suspects) {
    const suspect = getSuspectByFile(filename);

    if (suspect.date == "[date]" || isEmpty(suspect.date) || suspect.title.match(/title: .*\[longDate]/)) {
      exitWithError(`Missing date for ${suspect.name}`);
    }

    // ignore unpublished suspects
    if (!suspect.published) {
      continue;
    }

    // make sure there are no empty links
    const suspectText = readFile(`./docs/_suspects/${filename}`)
    if (suspect.published && /- \[.*]\(\)/.test(suspectText)) {
      exitWithError(`Empty link for ${suspect.name}`)
    }

    if (suspect.status == "Indicted" && !suspect.indicted) {
      if (!suspect.name.includes("Pruitt") &&  !suspect.name.includes("Ehrke") && !suspect.name.includes("Loftus")) {
        exitWithError(`Missing indictment date for ${suspect.name}`);
      }
    }

    if (suspect.status == "Convicted" && !suspect.convicted) {
      exitWithError(`Missing convicted date for ${suspect.name}`);
    }

    if (!suspect.charged) {
      suspect.charged = suspect.date
      updateSuspect(suspect)
      execSync(`git add docs/_suspects/${filename}`)
    }

    if (fs.existsSync(`docs/${suspect.image}`)) {
      continue;
    } else {
      // no preview found, let's try generating one
      info(`Generating preview for ${suspect.name}`)
      try {
        const previewImage = suspect.image.replace("/images/preview/", "")
        execSync(`yarn suspect preview -f ${previewImage} -s ${suspect.status}`)
        execSync(`git add docs/images/preview`)
      } catch (error) {
        exitWithError(`No preview exists for ${suspect.name}`)
      }
    }
  }
  return;
}

doVerify();
