import { Command } from "commander";
import fs from "fs";
import { getSuspectByFile, updateSuspect } from "./common/suspect";

const migrate = new Command();
migrate.parse(process.argv);

const doMigrate = () => {
  const suspects = fs.readdirSync("./docs/_suspects");

  for (const filename of suspects) {
    const suspect = getSuspectByFile(filename);

    const MONTH_NAMES = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    if (suspect.convicted) {
      const convictedDate = new Date(Date.parse(`${suspect.convicted}T12:00:00`));
      const month = MONTH_NAMES[convictedDate.getMonth()];
      const day = convictedDate.getDate();
      const year = convictedDate.getFullYear();
      suspect.description = `Convicted on ${month} ${day}, ${year}. Click for latest case details.`;
    }
    updateSuspect(suspect);
  }
};

doMigrate();
