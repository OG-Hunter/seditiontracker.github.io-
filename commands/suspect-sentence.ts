import { Command } from "commander";
import { exitWithError, info } from "./common/console";
import fs from "fs";
import { readFile, writeFile } from "./common/file";
import { exit } from "process";
import { execSync } from "child_process";
import { getSuspectByFile, updateSuspect } from "./common/suspect";
import { update } from "lodash";

const cmd = new Command("sentence")
  .requiredOption("-s, --slug [slug]", "filename slug")
  .requiredOption("-d, --date [date]", "date of sentencing");
cmd.parse(process.argv);

const sentence = async () => {
  const suspect = getSuspectByFile(`${cmd.slug}.md`);

  if (!suspect) {
    exitWithError("No such suspect");
  }
  info("Changing status to Sentenced");

  suspect.status = "Sentenced";
  suspect.sentencing = cmd.date;
  suspect.sentenced = cmd.date;

  updateSuspect(suspect);

  info("Updating preview image");
  execSync(`yarn suspect preview -f ${suspect.suspect} -s Sentenced`);
};

sentence();
