import { isNull } from "lodash";
import { Command } from "commander";
import { info } from "./common/console";
import { getSuspects } from "./common/suspect";

const cmd = new Command("missing")
  .option("--news", "missing news report")
  .option("--conviction", "scheduled plea date but no conviction")
  .option("--sentence", "scheduled sentencing date but no sentencing info")
  .option("--sentencing_date", "convicted but no sentencing date")
  .option("--stalled", "show suspects charged more than six months ago but no conviction or trial date");

cmd.parse(process.argv);

const unpublished = async () => {
  info("Generating list of suspects with missing info");

  const todaysDate = new Date().getTime();

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
      const { convicted, links, plea_hearing } = suspect;
      if (links["Sentencing Memo"] && !convicted) {
        console.log(suspect.name);
        continue;
      }

      if (links["Judgement"] && !convicted) {
        console.log(`${suspect.name}: ${links["Judgement"]}`);
        continue;
      }

      if (plea_hearing) {
        const pleaDate = Date.parse(`${plea_hearing}T12:00`);
        if (pleaDate < todaysDate && !convicted) {
          console.log(suspect.name);
        }
      }
    }
  }

  if (cmd.sentence) {
    info("Missing Sentence");
    for (const suspect of suspects) {
      const { deceased, links, sentenced, sentencing } = suspect;
      if (links["Judgement"] && isNull(sentenced)) {
        console.log(`${suspect.name}: ${links["Judgement"]}`);
        continue;
      }

      if (sentencing) {
        const sentenceDate = Date.parse(`${sentencing}T12:00`);
        if (sentenceDate < todaysDate && !sentenced && !deceased) {
          console.log(suspect.name);
        }
      }
    }
  }

  if (cmd.sentencing_date) {
    info("Missing Sentencing Date");
    for (const suspect of suspects) {
      const { convicted, sentencing } = suspect;
      if (convicted && isNull(sentencing)) {
        console.log(suspect.name);
      }
    }
  }

  if (cmd.stalled) {
    info("Stalled suspects");
    for (const suspect of suspects) {
      const { charged, convicted, indicted, plea_hearing, trial_date } = suspect;
      if (convicted || indicted || plea_hearing || trial_date) {
        continue;
      }

      if (charged.includes("2021")) {
        console.log(suspect.name);
      }
    }
  }
};

unpublished();
