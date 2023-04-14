import { Command } from "commander";
import fs from "fs";
import { load } from "cheerio";
import { getSuspectByFile, pastDate, Suspect, updateSuspect } from "./common/suspect";
import { readFile } from "./common/file";
import { info } from "./common/console";

/**
 * Parse the results of the US District Court Dynamic Calendar
 * https://media.dcd.uscourts.gov/datepicker/index.html
 */

const cmd = new Command();
cmd.parse(process.argv);

type CaseMap = {
  [caseNumber: string]: Suspect[];
};

const getCaseMap = (): CaseMap => {
  const suspectFiles = fs.readdirSync("./docs/_suspects");
  const caseMap: CaseMap = {};

  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile);
    const { caseNumber } = suspect;
    if (caseNumber) {
      caseMap[caseNumber] ||= [];
      caseMap[caseNumber].push(suspect);
    }
  }
  return caseMap;
};

// Set to the earliest possible date that has not yet passed
const earliestDate = (suspect: Suspect, field: string, dateText: string) => {
  const oldValue = suspect[field];

  const newDate = new Date(`${dateText} GMT`);
  const newDateText = newDate.toISOString().split("T")[0];

  const dates = [newDateText];
  if (oldValue) {
    dates.push(oldValue);
  }

  const sortedDates = dates.sort();

  // we don't care about status conferences once the case is resolved
  const { acquitted, deceased, sentenced } = suspect;
  if ((field === "status_conference" && acquitted) || deceased || sentenced) {
    return null;
  }

  for (const dateText of sortedDates) {
    if (!pastDate(dateText)) {
      if (dateText !== oldValue) {
        console.log(`${suspect.name} ${field}: ${dateText}`);
      }
      return dateText;
    }
  }

  return null;
};

const latestDate = (suspect: Suspect, field: string, dateText: string) => {
  const oldValue = suspect[field];
  const oldDate = oldValue ? new Date(suspect[field]) : null;
  const newDate = new Date(`${dateText} GMT`);

  if (!oldDate || (oldDate && newDate > oldDate)) {
    const newDateString = newDate.toISOString().split("T")[0];
    console.log(`${suspect.name} ${field}: ${newDateString}`);
    return newDateString;
  }
  return suspect[field];
};

const parseSchedule = async () => {
  info("Parsing schedule");
  const caseMap = getCaseMap();

  const html = readFile("schedule.html");
  const $ = load(html);

  $("body > table#ts > tbody > tr").each((index, element) => {
    let judgeText = "";
    let dateText = "";
    let typeText = "";
    let caseText = "";

    $("td", element).each((index, element) => {
      switch (index) {
        case 0:
          caseText = $(element).text();
          break;
        case 1:
          judgeText = $(element).text();
          break;
        case 2:
          dateText = $(element).text().split(" ")[0];
          break;
        case 4:
          typeText = $(element).text();
          break;
      }
    });

    /(.*):(.*)/.test(caseText);
    const caseNumber = RegExp.$1;
    const parsedCaseName = RegExp.$2.trim();

    const suspects = caseMap[caseNumber] || [];

    for (const suspect of suspects) {
      const { caseName, trial_date, trial_type } = suspect;

      const IGNORE_NAMES = ["Virginia Spencer"];
      if (IGNORE_NAMES.includes(suspect.name)) {
        continue;
      }

      /Judge (.*)/.test(judgeText);
      const judge = RegExp.$1;

      // Do not replace case judge with magistrate judge. Judge Sullivan is retiring and his cases are being reassigned.
      if (/Mag\. Judge/.test(judgeText) || typeText === "Arraignment") {
        suspect.judge ||= judge;
      } else if (suspect.judge !== judge && judge !== "Emmet G. Sullivan") {
        suspect.judge = judge;
        console.log(`${suspect.name} judge: ${judge}`);
      }

      // Only update dates if the case name matches
      if (caseName && caseName === parsedCaseName) {
        switch (typeText) {
          case "Plea Agreement Hearing":
            suspect.plea_hearing = latestDate(suspect, "plea_hearing", dateText);
            break;
          case "Sentencing":
            suspect.sentencing = latestDate(suspect, "sentencing", dateText);
            break;
          case "Jury Selection":
            if (!isBlank(suspect.plea_hearing)) {
              break;
            }
            if (!trial_type) {
              console.log(`${suspect.name} jury trial: ${dateText}`);
              suspect.trial_type = "Jury Trial";
            }
            suspect.jury_selection = latestDate(suspect, "jury_selection", dateText);
            if (suspect.trial_date < suspect.jury_selection) {
              suspect.trial_date = suspect.jury_selection;
            }
            if (!trial_date) {
              suspect.trial_date = latestDate(suspect, "trial_date", dateText);
            }
            break;
          case "Jury Trial":
            // ignore trial dates if a plea hearing is scheduled
            if (!isBlank(suspect.plea_hearing)) {
              break;
            }
            if (!trial_type) {
              console.log(`${suspect.name} jury trial: ${dateText}`);
              suspect.trial_type = "Jury Trial";
            }
            if (!suspect.trial_date) {
              suspect.trial_date = latestDate(suspect, "trial_date", dateText);
            }
            break;
          case "Bench Trial":
            if (!isBlank(suspect.plea_hearing)) {
              break;
            }
            if (!trial_type || trial_type !== "Bench Trial") {
              console.log(`${suspect.name} bench trial: ${dateText}`);
              suspect.trial_type = "Bench Trial";
            }
            if (!suspect.trial_date) {
              suspect.trial_date = latestDate(suspect, "trial_date", dateText);
            }
            if (suspect.jury_selection) {
              suspect.jury_selection = null;
            }
            break;
          case "Status Conference":
            suspect.status_conference = earliestDate(suspect, "status_conference", dateText);
            break;
        }
      }

      updateSuspect(suspect);
    }
  });
};

export const isBlank = (text: string) => {
  if (!text || text == "") {
    return true;
  }
  return false;
};

parseSchedule();
