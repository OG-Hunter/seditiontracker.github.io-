import { Command } from "commander";
import fs from "fs";
import { getSuspectByFile, updateSuspect } from "./common/suspect";
import { caseName } from "./common/suspect";

const migrate = new Command();
migrate.parse(process.argv);

const doMigrate = () => {
  const suspects = fs.readdirSync("./docs/_suspects");

  for (const filename of suspects) {
    const suspect = getSuspectByFile(filename);
    suspect.caseName = caseName(suspect);
    updateSuspect(suspect);
  }
};

doMigrate();
