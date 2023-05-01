import { readFile, writeLines } from "./file";
import { isEmpty, padStart } from "lodash";
import YAML from "yaml";
import fs from "fs";
import { exitWithError, warning } from "./console";

export interface Charge {
  code: string;
  title: string;
  url: string;
  felony: boolean;
}

export interface Video {
  url: string;
  title: string;
}

export interface Suspect {
  published: boolean;
  status?: string;
  date?: string;
  sentenced?: string;
  status_conference?: string;
  charged?: string;
  indicted?: string;
  convicted?: string;
  acquitted?: string;
  dismissed?: string;
  deceased?: string;
  plea_hearing?: string;
  trial_date?: string;
  trial_type?: string;
  jury_selection?: string;
  sentencing?: string;
  name: string;
  lastName: string;
  hashtag?: string;
  links?: { [type: string]: string };
  age?: string;
  image?: string;
  suspect?: string;
  booking?: string;
  courtroom?: string;
  courthouse?: string;
  raid?: string;
  perpwalk?: string;
  occupation?: string;
  affiliations?: string;
  aka?: string;
  quote?: string;
  description?: string;
  title?: string;
  jurisdiction?: string;
  residence?: string;
  caseNumber?: string;
  caseName?: string;
  judge?: string;
  charges?: Charge[];
  sentence?: string[];
  videos?: Video[];
}

export const getFirstLastName = (nameText: string): { firstName: string; lastName: string } => {
  let firstName = "";

  nameText = nameText
    .replace("Updated", "")
    .replace("New", "")
    .replace("Jr.", "")
    .replace("Sr.", "")
    .replace("III", "")
    .replace("II", "")
    .replace("IV", "")
    .replace(", ", "")
    .replace(/\S\./, "")
    .trim();

  const names = nameText.split(" ").filter((n) => n !== "");

  if (names.length == 2) {
    return { firstName: names[0], lastName: names[1] };
  } else if (names.length == 3) {
    return { firstName: names[0], lastName: names[2] };
  } else {
    firstName = names.shift();
    names.shift();
    return { firstName, lastName: names.join(" ") };
  }
};

export const getSuspectByFile = (filename: string) => {
  const data = readFile(`./docs/_suspects/${filename}`);
  const suspect: Suspect = { published: true, name: "", lastName: "" };

  if (/published: false/.test(data)) {
    suspect.published = false;
  }

  suspect.status = data.match(/status: (.*)/)[1];

  if (data.match(/date: (.*)/)) {
    suspect.date = data.match(/date: (.*)/)[1].trim();
  }

  if (data.match(/charged: (.*)/)) {
    suspect.charged = data.match(/charged: (.*)/)[1].trim();
  }

  if (data.match(/convicted: (.*)/)) {
    suspect.convicted = RegExp.$1.trim();
  }

  if (data.match(/acquitted: (.*)/)) {
    suspect.acquitted = RegExp.$1.trim();
  }

  if (data.match(/dismissed: (.*)/)) {
    suspect.dismissed = RegExp.$1.trim();
  }

  if (data.match(/indicted: (.*)/)) {
    suspect.indicted = data.match(/indicted: (.*)/)[1].trim();
  }

  if (data.match(/sentenced: (.*)/)) {
    suspect.sentenced = data.match(/sentenced: (.*)/)[1].trim();
  }

  if (data.match(/deceased: (.*)/)) {
    suspect.deceased = data.match(/deceased: (.*)/)[1].trim();
  }

  if (data.match(/plea_hearing: (.*)/)) {
    suspect.plea_hearing = RegExp.$1.trim();
  }

  if (data.match(/trial_date: (.*)/)) {
    suspect.trial_date = RegExp.$1.trim();
  }

  if (data.match(/jury_selection: (.*)/)) {
    suspect.jury_selection = RegExp.$1.trim();
  }

  if (data.match(/sentencing: (.*)/)) {
    suspect.sentencing = RegExp.$1.trim();
  }

  suspect.name = data.match(/name: (.*)/)[1];
  suspect.links = getLinks(data.split("---")[2].trim());
  suspect.lastName = suspect.name.split(" ").slice(1).join(" ");
  suspect.description = data.match(/description: (.*)/)[1];
  suspect.title = data.match(/title: (.*)/)[1];
  suspect.jurisdiction = data.match(/jurisdiction: (.*)/)[1];

  if (data.match(/caseNumber: (.*)/)) {
    suspect.caseNumber = RegExp.$1;
  }

  if (data.match(/residence: (.*)/)) {
    suspect.residence = RegExp.$1;
  }

  if (data.match(/hashtag: (.*)/)) {
    suspect.hashtag = RegExp.$1;
  }

  if (data.match(/age: (\d{1,2})/)) {
    suspect.age = RegExp.$1;
  }

  if (data.match(/image: (.*)/)) {
    suspect.image = RegExp.$1;
  }

  if (data.match(/suspect: (.*)/)) {
    suspect.suspect = RegExp.$1;
  }

  if (data.match(/booking: (.*)/)) {
    suspect.booking = RegExp.$1;
  }

  if (data.match(/courthouse: (.*)/)) {
    suspect.courthouse = RegExp.$1;
  }

  if (data.match(/courtroom: (.*)/)) {
    suspect.courtroom = RegExp.$1;
  }

  if (data.match(/raid: (.*)/)) {
    suspect.raid = RegExp.$1;
  }

  if (data.match(/perpwalk: (.*)/)) {
    suspect.perpwalk = RegExp.$1;
  }

  if (data.match(/occupation: (.*)/)) {
    suspect.occupation = RegExp.$1;
  }

  if (data.match(/affiliations: (.*)/)) {
    suspect.affiliations = RegExp.$1;
  }

  if (data.match(/aka: (.*)/)) {
    suspect.aka = RegExp.$1;
  }

  if (data.match(/quote: (.*)/)) {
    suspect.quote = RegExp.$1;
  }

  if (data.match(/trial_type: (.*)/)) {
    suspect.trial_type = RegExp.$1;
  }

  if (data.match(/caseName: (.*)/)) {
    suspect.caseName = RegExp.$1;
  }

  if (data.match(/judge: (.*)/)) {
    suspect.judge = RegExp.$1;
  }

  if (data.match(/status_conference: (.*)/)) {
    suspect.status_conference = RegExp.$1;
  }

  suspect.charges = getCharges(data.split("---")[1].trim());
  suspect.videos = getVideos(data.split("---")[1].trim());
  suspect.sentence = getSentence(data.split("---")[1].trim());

  return suspect;
};

export const formatCaseNumber = (text: string) => {
  if (/20\d{2}-CMD-\d{3}/.test(text)) {
    // don't mess with DC case numbers
    return text;
  }

  if (!/(1:)?(21|22|23)-(mj|cr)-0?(\d{1,4})/.test(text)) {
    exitWithError("Invalid case number: " + text);
  }
  const year = padStart(RegExp.$2);
  const number = padStart(RegExp.$4, 4, "0");
  return `${year}-${RegExp.$3}-${number}`;
};

type SuspectDate = {
  date: Date;
  label: string;
};

const verifyDates = (suspect: Suspect) => {
  const suspectDates: SuspectDate[] = [];

  const SEQUENCE = [
    "charged",
    "indicted",
    "trial_date",
    "status_conference",
    "plea_hearing",
    "convicted",
    "acquitted",
    "dismissed",
    "deceased",
    "sentencing_date",
    "sentenced",
  ];

  SEQUENCE.map((label) => {
    if (suspect[label]) {
      suspectDates.push({ label, date: new Date(`${suspect[label]}T00:00:00Z`) });
    }
  });

  let prevItem: SuspectDate = null;
  const remainingDates: SuspectDate[] = suspectDates;
  while (remainingDates.length > 0) {
    if (!prevItem) {
      prevItem = remainingDates.shift();
      continue;
    }

    const itemToCheck = remainingDates.shift();

    const diff = prevItem.date.getTime() - itemToCheck.date.getTime();
    if (diff > 0) {
      warning(`${prevItem.label} more recent than ${itemToCheck.label} for ${suspect.name}`);
      return false;
    }
  }
  return true;
};

export const updateSuspect = (suspect: Suspect) => {
  const { caseNumber } = suspect;
  // do some cleanup first
  suspect.caseNumber = caseNumber ? formatCaseNumber(caseNumber) : "";
  if (suspect.trial_type === "Jury") {
    suspect.trial_type = "Jury Trial";
  }
  suspect.caseName = getCaseName(suspect);

  if (suspect.status_conference && (suspect.acquitted || suspect.deceased || suspect.sentenced)) {
    suspect.status_conference = null;
  }
  if (pastDate(suspect.status_conference)) {
    suspect.status_conference = null;
  }

  if (suspect.plea_hearing) {
    suspect.trial_date = null;
    suspect.trial_type = null;
  }

  if (suspect.sentencing && !suspect.convicted) {
    if (suspect.lastName !== "Lollar") {
      warning(`Sentencing date without conviction: ${suspect.name}`);
    }
  }

  const newSentence = [];

  for (let line of suspect.sentence || []) {
    line = line.replace("home confinement", "home detention");
    line = line.replace("intermittent incarceration", "intermittent confinement");
    line = line.replace("months of", "months");
    newSentence.push(line);
  }
  suspect.sentence = newSentence;

  const { jury_selection, trial_date } = suspect;
  if (trial_date && jury_selection && jury_selection > trial_date) {
    suspect.trial_date = jury_selection;
  }

  // make sure dates make sense
  verifyDates(suspect);

  // update the description when applicable
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

  const lines: string[] = [];

  lines.push("---");
  lines.push(`name: ${suspect.name}`);
  lines.push(`lastName: ${suspect.lastName}`);
  lines.push(`hashtag: ${suspect.hashtag}`);
  lines.push(`aka: ${suspect.aka}`);
  lines.push(`residence: ${suspect.residence}`);
  lines.push(`status: ${suspect.status}`);
  lines.push(`date: ${suspect.date}`);
  lines.push(`charged: ${suspect.charged}`);
  lines.push(`indicted: ${suspect.indicted}`);
  lines.push(`convicted: ${suspect.convicted}`);
  lines.push(`acquitted: ${suspect.acquitted}`);
  lines.push(`sentenced: ${suspect.sentenced}`);
  lines.push(`dismissed: ${suspect.dismissed}`);
  lines.push(`deceased: ${suspect.deceased}`);
  lines.push(`plea_hearing: ${suspect.plea_hearing}`);
  lines.push(`trial_date: ${suspect.trial_date}`);
  lines.push(`trial_type: ${suspect.trial_type}`);
  lines.push(`jury_selection: ${suspect.jury_selection}`);
  lines.push(`sentencing: ${suspect.sentencing}`);
  lines.push(`status_conference: ${suspect.status_conference}`);
  lines.push(`age: ${suspect.age}`);
  lines.push(`occupation: ${suspect.occupation}`);
  lines.push(`affiliations: ${suspect.affiliations}`);
  lines.push(`jurisdiction: ${suspect.jurisdiction || "Federal"}`);
  lines.push(`image: ${suspect.image}`);
  lines.push(`suspect: ${suspect.suspect}`);
  lines.push(`booking: ${suspect.booking}`);
  lines.push(`courtroom: ${suspect.courtroom}`);
  lines.push(`courthouse: ${suspect.courthouse}`);
  lines.push(`raid: ${suspect.raid}`);
  lines.push(`perpwalk: ${suspect.perpwalk}`);
  lines.push(`quote: ${suspect.quote}`);
  lines.push(`title: ${suspect.title}`);
  lines.push(
    `description: ${suspect.description || "Click for latest case details. Suspects innocent until proven guilty."}`,
  );
  lines.push(`author: ${"seditiontrack"}`);
  lines.push(`layout: ${"suspect"}`);
  lines.push(`published: ${suspect.published.toString()}`);
  lines.push(`caseNumber: ${suspect.caseNumber}`);
  lines.push(`caseName: ${suspect.caseName}`);
  lines.push(`judge: ${suspect.judge}`);
  lines.push(`videos:`);
  if (suspect.videos) {
    for (const { title, url } of Object.values(suspect.videos)) {
      lines.push(`- title: ${title}`);
      lines.push(`  url: ${url}`);
    }
  }
  lines.push("charges:");
  if (suspect.charges) {
    for (const { code, title, url, felony } of Object.values(suspect.charges)) {
      lines.push(`- code: ${code}`);
      lines.push(`  title: ${title}`);
      lines.push(`  url: ${url}`);
      lines.push(`  felony: ${felony}`);
    }
  }
  lines.push("sentence:");
  if (suspect.sentence) {
    for (const line of suspect.sentence) {
      lines.push(`  - ${line}`);
    }
  }
  lines.push("---");

  for (const [type, url] of Object.entries(suspect.links)) {
    lines.push(`- [${type}](${url})`);
  }

  writeLines(`docs/_suspects/${dasherizeName(suspect.name, "")}.md`, lines);
};

export const getSuspect = (firstName: string, lastName: string) => {
  const dashedName = dasherizeName(firstName, lastName).replace("'", "");
  return getSuspectByFile(`${dashedName}.md`);
};

export const dasherizeName = (firstName: string, lastName?: string) => {
  const name = lastName ? `${firstName} ${lastName}` : firstName;
  return name.replace(/\s/g, "-").replace(/'/g, "").toLowerCase();
};

export const getSuspectsByCase = (caseNumber: string) => {
  const suspectFiles = fs.readdirSync("./docs/_suspects");
  const suspects = [];

  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile);
    if (suspect.caseNumber == caseNumber) {
      suspects.push(suspect);
    }
  }

  return suspects;
};

export const getSuspects = () => {
  const suspectFiles = fs.readdirSync("./docs/_suspects");
  const suspects: Suspect[] = [];

  for (const suspectFile of suspectFiles) {
    suspects.push(getSuspectByFile(suspectFile));
  }

  return suspects;
};

export const getVideoUrls = () => {
  const urls = new Set();
  const suspectFiles = fs.readdirSync("./docs/_suspects");
  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile);
    for (const video of suspect.videos) {
      urls.add(video.url);
    }
  }
  return urls;
};

const getLinks = (data: string) => {
  const links = {};
  for (const link of data.split("- ")) {
    if (isEmpty(link.trim())) {
      continue;
    }
    const [, name, url] = link.match(/\[(.*)]\((.*)\)/);
    links[name] = url;
  }
  return links;
};

/**
 * Gets suspect filename based on DOJ style name entry
 * Ex. WILLIAMS, Troy Dylan
 * @param name
 */
export const convertDojName = (name: string) => {
  // the @seditiondata spreadsheet has some of the old misspelled names
  name = name.replace("COURTWRIGHT", "COURTRIGHT");
  name = name.replace("Mathew", "Matthew");
  name = name.replace("FICHETT", "FITCHETT");
  name = name.replace("Christoper", "Christopher");
  name = name.replace("GUNDERSON", "GUNDERSEN");
  name = name.replace("Dominick", "Dominic");
  name = name.replace("Christpher", "Christopher");
  name = name.replace("PEPE, Williams", "PEPE, William");
  name = name.replace("RODEAN, Nicolas", "RODEAN, Nicholas");
  name = name.replace("SHIVLEY", "SHIVELY");
  name = name.replace("Nathan", "Nathaniel");
  name = name.replace("MCCAUGHEY III", "MCCAUGHEY");

  const names = name
    .replace("Jr.", "")
    .split(",")
    .map((name) => {
      return name.trim();
    });
  const lastName = names[0].toLowerCase();
  const firstName = names[1].split(" ")[0].toLowerCase();

  return dasherizeName(`${firstName} ${lastName}`);
};

const getVideos = (data: string) => {
  const result = YAML.parse(data);
  return result.videos || [];
};

const getCharges = (data: string) => {
  const result = YAML.parse(data);
  return result.charges || [];
};

const getSentence = (data: string) => {
  const result = YAML.parse(data);
  return result.sentence || [];
};

const zeroPad = (value: number, places = 2) => {
  return padStart(value.toString(), places, "0");
};

export const pastDate = (date: string): boolean => {
  const now = new Date();
  const currentDate = new Date(`${now.getFullYear()}-${zeroPad(now.getMonth() + 1)}-${zeroPad(now.getDate())}`);
  const dateToCheck = new Date(`${date}`);

  return dateToCheck < currentDate;
};

export const getCaseName = (suspect: Suspect): string => {
  const { caseName } = suspect;
  if (caseName) {
    return caseName;
  }
  const { lastName } = suspect;
  return `USA v. ${lastName.toUpperCase().replace(" ", "-")}`;
};
