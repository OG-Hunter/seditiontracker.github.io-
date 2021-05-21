import XLSX = require('xlsx')

export interface Charge {
  code: string
  name: string
  link: string
}

export interface ChargeEntry {
  name: string,
  charges: Charge[],
  military: string,
  police: string,
  dojNumber: string
}

export const getChargeData = (filename) => {
  const workbook = XLSX.readFile(filename)
  return workbook.Sheets["Arrested"]
}

export const lookupCode = (code) => {
  const codeMap = {
    "18 USC 1752": "Unlawful entry on restricted building or grounds",
    "18 USC 111": "Assaulting, resisting, or impeding certain officers or employees",
    "18 USC 1361": "Destruction of government property",
    "18 USC 1511": "Obstruction of State or local law enforcement",
    "18 USC 1512": "Obstruction of an official proceeding",
    "18 USC 2": "Aiding and abetting (2 counts)",
    "18 USC 2112": "Robbery of personal property of the United States",
    "18 USC 231": "Civil disorder",
    "18 USC 371": "Conspiracy",
    "18 USC 641": "Theft of government property",
    "18 USC 875": "Transmitting a threat in interstate commerce",
    "26 USC 5861": "Possession of an unregistered firearm",
    "40 USC 5104": "Violent entry or disorderly conduct on Capitol grounds",
  }

  return codeMap[code]
}


