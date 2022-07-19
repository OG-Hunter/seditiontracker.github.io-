import { Command } from "commander";
import { info } from "./common/console";
import { getSuspects } from "./common/suspect";

const cmd = new Command("missing")
  .option("--news", "missing news report")
  .option("--conviction", "scheduled plea date but no conviction")
  .option("--sentence", "scheduled sentencing date but no sentencing info");

cmd.parse(process.argv);

const unpublished = async () => {
  info("Generating list of suspects with missing info");

  const suspects = getSuspects();
  if (cmd.news) {
    info("Missing News");
    for (const suspect of suspects) {
      let newsLinks = false;
      for (const key of Object.keys(suspect.links)) {
        if (key === "News Report") {
          newsLinks = true;
          break;
        }
      }
      if (!newsLinks) {
        console.log(suspect.name);
      }
    }
  }

  if (cmd.conviction) {
    info("Missing Conviction");
    for (const suspect of suspects) {
      const { convicted, plea_hearing } = suspect;
      if (plea_hearing) {
        const pleaDate = Date.parse(`${plea_hearing}T05:00`);
        if (pleaDate > new Date().getMilliseconds() && !convicted) {
          console.log(suspect.name);
        }
      }
    }
  }

  if (cmd.sentence) {
    info("Missing Sentence");
    for (const suspect of suspects) {
      const { sentenced, sentencing } = suspect;
      if (sentencing) {
        const sentenceDate = Date.parse(`${sentencing}T05:00`);
        if (sentenceDate > new Date().getMilliseconds() && !sentenced) {
          console.log(suspect.name);
        }
      }
    }
  }
};

unpublished();
