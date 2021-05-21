import { Command } from "commander";
import inquirer from 'inquirer';
import { updateSuspect } from "./common/suspect";


const cmd = new Command();
cmd.parse(process.argv);

const newSuspect = async() => {
  const questions = [
    {
      type: 'input',
      name: 'firstName',
      message: "First Name"
    },
    {
      type: 'input',
      name: 'lastName',
      message: "Last Name"
    },
    {
      type: 'number',
      name: 'age',
      message: "Age"
    },
    {
      type: "input",
      name: "residence",
      message: "Residence"
    },
    {
      type: "confirm",
      name: "arrested",
      message: "Arrested",
      default: true
    },
    {
      type: "input",
      name: "date",
      message: "Date (MM-DD)"
    },
    {
      type: "input",
      name: "story",
      message: "Link to News Story"
    }
  ]

  const result = await inquirer.prompt(questions)
  const name = `${result.firstName} ${result.lastName}`
  const dashedName = `${result.firstName}-${result.lastName}`.toLowerCase()
  const date = Date.parse(`2021-${result.date}T05:00`);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateFormat = new Intl.DateTimeFormat('en-US', options).format(date)

  updateSuspect({
    name,
    lastName: result.lastName,
    residence: result.residence,
    age: result.age,
    status: "Charged",
    date: `2021-${result.date}`,
    charged: `2021-${result.date}`,
    image: `/images/preview/${dashedName}.jpg`,
    suspect: `${dashedName}.jpg`,
    links: {
      "News Story": result.story
    },
    title: `${name} arrested on ${dateFormat}`,
    published: result.arrested ? true : false
  })
}

newSuspect();
