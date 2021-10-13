import { Command } from "commander";
import { dasherizeName, getSuspects, Suspect } from "./common/suspect";
import { readLines } from "./common/file";
import { info } from "./common/console";
import { listWanted, updateWanted } from "./common/wanted";

const cmd = new Command();
cmd.parse(process.argv);

const doMerge = () => {
  info("Merging FBI data");
  console.log("hashtags");
  const lines = readLines("./data/hashtags.csv");
  const tagMap = {};

  for (const line of lines) {
    const matches = line.match(/#(\w*),(\d{1,3})/);
    if (matches) {
      const hashtag = matches[1];
      const id = matches[2];

      tagMap[id] = hashtag;
    }
  }

  const suspectMap: { [key: string]: Suspect } = {};
  for (const suspect of getSuspects()) {
    if (suspect.hashtag) {
      suspectMap[suspect.hashtag] = suspect;
    }
  }

  for (const wanted of listWanted()) {
    wanted.hashtag ||= tagMap[wanted.id] || "";

    if (wanted.hashtag) {
      const suspect = suspectMap[wanted.hashtag];
      if (suspect) {
        wanted.charged = suspect.charged;
        wanted.mugshot = suspect.booking;
        wanted.name = suspect.name;
        wanted.sedition_link = suspect.name
          ? `https://seditiontracker.com/suspects/${dasherizeName(suspect.name)}`
          : null;
      }
    }

    updateWanted(wanted);
  }
};

doMerge();
