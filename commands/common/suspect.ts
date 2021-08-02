import { readFile, writeLines } from "./file";
import { Charge } from "./charge";
import { defaultsDeep, isEmpty} from 'lodash';
import fm from 'front-matter';

export interface Suspect {
  published: boolean
  status?: string
  date?: string
  sentenced?: string
  charged?: string
  indicted?: string
  convicted?: string
  dismissed?: string
  deceased?: string
  name?: string
  lastName?: string
  links?: { [type:string]: string }
  charges?: {[code:string]: Charge }
  age?: string
  image?: string
  suspect?: string
  booking?: string
  courtroom?: string
  courthouse?: string
  raid?: string
  perpwalk?: string
  occupation?: string
  affiliations?: string
  aka?: string
  quote?: string
  description?: string
  title?: string
  jurisdiction?: string
  residence?: string
  caseNumber?: string
}

export const getSuspectByFile = (filename:string) => {
  const data = readFile(`./docs/_suspects/${filename}`)
  const suspect: Suspect = { published: true }

  if (/published: false/.test(data)) {
    suspect.published = false
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

  suspect.name = data.match(/name: (.*)/)[1];
  suspect.links = getLinks(data.split("---")[2].trim());
  suspect.charges = getCharges(data);
  suspect.lastName = suspect.name.split(" ").slice(1).join(" ");
  suspect.description = data.match(/description: (.*)/)[1];
  suspect.title = data.match(/title: (.*)/)[1];
  suspect.jurisdiction = data.match(/jurisdiction: (.*)/)[1];

  if (data.match(/caseNumber: (.*)/)) {
    suspect.caseNumber = RegExp.$1
  }

  if (data.match(/residence: (.*)/)) {
    suspect.residence = RegExp.$1;
  }

  if (data.match(/age: (\d{1,2})/)) {
    suspect.age = RegExp.$1
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
    suspect.aka= RegExp.$1;
  }

  if (data.match(/quote: (.*)/)) {
    suspect.quote= RegExp.$1;
  }

  return suspect
}

const getCharges = (data: string) => {
  const charges: {[code:string]: Charge } = {}
  const content = fm(data)
  if (content.attributes["charges"]) {
    for (const charge of content.attributes["charges"]) {
      charges[charge.code] = charge
    }
  }
  return charges;
}

export const updateSuspect = (suspect: Suspect) => {
  const lines: string[] = []

  lines.push('---')
  lines.push(`name: ${suspect.name}`)
  lines.push(`lastName: ${suspect.lastName}`)
  lines.push(`aka: ${suspect.aka}`)
  lines.push(`residence: ${suspect.residence}`)
  lines.push(`status: ${suspect.status}`)
  lines.push(`date: ${suspect.date}`)
  lines.push(`charged: ${suspect.charged}`)
  lines.push(`indicted: ${suspect.indicted}`)
  lines.push(`convicted: ${suspect.convicted}`)
  lines.push(`sentenced: ${suspect.sentenced}`)
  lines.push(`dismissed: ${suspect.dismissed}`)
  lines.push(`deceased: ${suspect.deceased}`)
  lines.push(`age: ${suspect.age}`)
  lines.push(`occupation: ${suspect.occupation}`)
  lines.push(`affiliations: ${suspect.affiliations}`)
  lines.push(`jurisdiction: ${suspect.jurisdiction || "Federal"}`)
  lines.push(`image: ${suspect.image}`)
  lines.push(`suspect: ${suspect.suspect}`)
  lines.push(`booking: ${suspect.booking}`)
  lines.push(`courtroom: ${suspect.courtroom}`)
  lines.push(`courthouse: ${suspect.courthouse}`)
  lines.push(`raid: ${suspect.raid}`)
  lines.push(`perpwalk: ${suspect.perpwalk}`)
  lines.push(`quote: ${suspect.quote}`)
  lines.push(`title: ${suspect.title}`)
  lines.push(`description: ${suspect.description || "Click for latest case details. Suspects innocent until proven guilty."}`)
  lines.push(`author: ${"seditiontrack"}`)
  lines.push(`layout: ${"suspect"}`)
  lines.push(`published: ${suspect.published.toString()}`)
  lines.push(`caseNumber: ${suspect.caseNumber}`)
  lines.push('---')

  for (const [type, url] of Object.entries(suspect.links)) {
    lines.push(`- [${type}](${url})`)
  }

  if (suspect.name.includes("Malley")) {
    console.log(suspect.name)
  }

  writeLines(`docs/_suspects/${dasherizeName(suspect.name, '')}.md`, lines)
}

export const getSuspect = (firstName: string, lastName: string) => {
  const dashedName = dasherizeName(firstName, lastName).replace("'", '')
  return getSuspectByFile(`${dashedName}.md`)
}

export const dasherizeName = (firstName: string, lastName?: string) => {
  const name = lastName ? `${firstName} ${lastName}` : firstName
  return name.replace(/\s/g, "-").replace(/'/g, "").toLowerCase();
}

const getLinks = (data: string) => {
  const links = {}
  for (const link of data.split("- ")) {
    if (isEmpty(link.trim())) {
      continue;
    }
    const [,name, url] = link.match(/\[(.*)]\((.*)\)/)
    links[name] = url
  }
  return links
}

/**
 * Gets suspect filename based on DOJ style name entry
 * Ex. WILLIAMS, Troy Dylan
 * @param name
 */
export const convertDojName = (name: string) => {
  // the @seditiondata spreadsheet has some of the old misspelled names
  name = name.replace("COURTWRIGHT", "COURTRIGHT")
  name = name.replace("Mathew", "Matthew")
  name = name.replace("FICHETT", "FITCHETT")
  name = name.replace("Christoper", "Christopher")
  name = name.replace("GUNDERSON", "GUNDERSEN")
  name = name.replace("Dominick", "Dominic")
  name = name.replace("Christpher", "Christopher")
  name = name.replace("PEPE, Williams", "PEPE, William")
  name = name.replace("RODEAN, Nicolas", "RODEAN, Nicholas")
  name = name.replace("SHIVLEY", "SHIVELY")
  name = name.replace("Nathan", "Nathaniel")
  name = name.replace("MCCAUGHEY III", "MCCAUGHEY")

  const names = name.replace("Jr.", "").split(",").map((name) => { return name.trim()})
  const lastName = names[0].toLowerCase()
  const firstName = names[1].split(" ")[0].toLowerCase()

  return dasherizeName(`${firstName} ${lastName}`)
}