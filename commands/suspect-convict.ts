import { Command } from "commander";
import { exitWithError, info } from "./common/console";
import { execSync } from "child_process";
import { Charge, getSuspectByFile, updateSuspect } from "./common/suspect";
import { Charges } from "./common/charge";

const cmd = new Command("convict")
  .requiredOption("-s, --slug [slug]", "filename slug")
  .requiredOption("-d, --date [date]", "date of guilty plea")
  .option("--parading", "suspect is pleading to the standard misdemeanor", true);
cmd.parse(process.argv);

const convict = async () => {
  const suspect = getSuspectByFile(`${cmd.slug}.md`);

  if (!suspect) {
    exitWithError("No such suspect");
  }

  info("Changing status to convicted");
  suspect.status = "Convicted";
  suspect.convicted = cmd.date;
  suspect.plea_hearing = cmd.date;

  if (cmd.parading) {
    const parading: Charge = Charges.find(({ code }) => code === "40 USC § 5104(e)(2)(G)");
    info("Adding parading charge");
    suspect.charges = [parading];
  }

  updateSuspect(suspect);

  info("Updating preview image");
  execSync(`yarn suspect preview -f ${suspect.suspect} -s Convicted`);
};

convict();
