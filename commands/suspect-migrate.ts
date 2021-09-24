import { Command } from "commander";
import fs from "fs";
import { getSuspectByFile, updateSuspect } from "./common/suspect";
const { execSync } = require("child_process");

const migrate = new Command();
migrate.parse(process.argv);

const doMigrate = () => {
  const suspects = fs.readdirSync("./docs/_suspects");

  for (const filename of suspects) {
    const suspect = getSuspectByFile(filename);
    const newLinks = {};

    for (const [type, url] of Object.entries(suspect?.links)) {
      let newType: string;
      if (type == "Complaint") {
        if (suspect?.links["Statement of Facts"]) {
          continue; // duplicate - ignore
        } else {
          newType = "Statement of Facts";
        }
      }
      newType ||= type;
      newLinks[newType] = url;
    }
    suspect.links = newLinks;
    updateSuspect(suspect);
  }
};

doMigrate();
