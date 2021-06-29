import { Command } from "commander";
import fs from "fs";
import { getSuspectByFile, updateSuspect } from "./common/suspect";
const { execSync } = require('child_process')

const migrate = new Command()
migrate.parse(process.argv);

const doMigrate = () => {
  const suspects = fs.readdirSync('./docs/_suspects');

  for (const filename of suspects) {
    const suspect = getSuspectByFile(filename);

    if (!suspect.convicted) {
      suspect.convicted = ""
    }

    if (!suspect.sentenced) {
      suspect.sentenced = ""
    }

    if (!suspect.dismissed) {
      suspect.dismissed = ""
    }

    updateSuspect(suspect)
  }

}

doMigrate();
