import XLSX = require('xlsx')

export interface Charge {
  code: string
  name: string
  link: string
}

export const getChargeData = (filename) => {
  const workbook = XLSX.readFile(filename)
  return workbook.Sheets["Arrested"]
}



