import { Command } from "commander";
import { writeFile } from "./common/file"
import { info, warning } from "./common/console";
import { ChargeEntry, getChargeData, lookupCode } from "./common/charge"
import { getSuspectByFile, updateSuspect } from "./common/suspect"
import { isEmpty } from "lodash"
import { convertDojName } from "./common/suspect";

const cmd = new Command().requiredOption("-f, --file <file>", "CSV file to use for import").option("-m, --map", "Build charge map");
cmd.parse(process.argv);

const buildChargeMap = async() => {
  info("Building charge map");
  const map = {}

  for (const entry of await getCharges()) {
    for (const charge of entry.charges) {
      map[charge.code] = map[charge.code] || charge
    }
  }

  const codes = Object.keys(map).sort()

  let yaml = ""

  for (const code of codes) {
    const entry = map[code]
    yaml += `- name: ${entry.name}\n`
    yaml += `  code: ${entry.code}\n`
    yaml += `  link: ${entry.link}\n`
  }

  writeFile("commands/common/chargesList.yml", yaml)
}

const importCharges = async() => {
  info("Importing list of charges");

  for (const entry of await getCharges()) {
    const filename = convertDojName(entry.name) + ".md"

    try {
      const suspect = getSuspectByFile(filename)
      if (!suspect) {
        continue
      } else {
        for (const charge of entry.charges) {
          suspect.charges[charge.code] = charge
        }
        updateSuspect(suspect)
      }
    } catch (ex) {
      warning(`Unable to load suspect with filename: ${filename}  `)
    }
  }
}

const getCharges = async() => {
  const sheet = getChargeData(cmd.file)
  const rowSet = new Set()
  const chargeEntries = []

  for (const [key, value] of Object.entries(sheet)) {
    if (key == "!ref") { continue }
    const [,col, row] = key.match(/([A-Z]*)(\d*)/)

    if (row == "1") {
      continue
    }

    rowSet.add(row)
  }

  for (const row of rowSet) {

    const entry:ChargeEntry = {
      name: sheet[`T${row}`]["v"].trim(),
      dojNumber: sheet[`U${row}`] ? sheet[`U${row}`]["v"].trim() : "",
      military: sheet[`Z${row}`] ? sheet[`Z${row}`]["v"].trim() : "",
      police: sheet[`AA${row}`] ? sheet[`AA${row}`]["v"].trim() : "",
      charges: []
    }

    if (sheet[`AB${row}`]) {
      const chargeCell = sheet[`AB${row}`]["v"]
      if (isEmpty(chargeCell)) {
        continue;
      }
      if (!/\S*,/.test(entry.name)) {
        warning(`Name is not in LASTNAME, First format: ${entry.name}`)
        continue;
      }

      const charges = chargeCell.split("\n")

      for (let charge of charges) {
        console.log({charge})
        charge = charge.replace("–", "-").replace("§", "")
        // ignore state charges
        if (/\d{1,2} DC.*/.test(charge)) {
          continue
        }

        const chargesRegEx = new RegExp(/((\d{2})\s*USC\s*(\d{1,4}))/)

        if (chargesRegEx.test(charge)) {
          let [,code, title, section, name] = charge.match(chargesRegEx)

          code = scrub(code)
          section = scrub(section)
          title = scrub(title)

          name = name || lookupCode(code)
          if(!name) {
            warning(`no name for ${code}`)
          }
          name = scrub(name)

          entry.charges.push({
            code,
            name,
            link: `https://www.law.cornell.edu/uscode/text/${title}/${section}`
          })
        } else {
          warning(`Unable to read charges for ${entry.name}`)
          console.log(charge)
          entry.charges = []
          break
        }
      }
    }

    if (entry.charges.length > 0) {
      chargeEntries.push(entry)
    }
  }

  return chargeEntries
}

const scrub = (input) => {
  return input.replace("  ", " ").trim()
}

if (cmd.map) {
  buildChargeMap();
} else {
  importCharges();
}
