import chalk from "chalk";
import inquirer from "inquirer";

export const error = (message: string) => {
  console.log(chalk.red("[ERROR]", message));
};

export const info = (message: string) => {
  console.log(chalk.blue("[INFO]", message));
};

export const line = (message: string) => {
  console.log(chalk.cyan(message));
};

export const danger = (message: string) => {
  console.log(chalk.red("[DANGER]", `***** ${message} *****`));
};

export const warning = (message: string) => {
  console.log(chalk.yellow("[WARNING]", `${message}`));
};

export const note = (text: string) => {
  console.log(chalk.grey(text));
};

export const exitWithError = (errorMsg: string) => {
  error(errorMsg);
  process.exit(1);
};

export const nameValue = (name: string, value: any) => {
  if (value == null) {
    console.log(chalk.white(name));
  } else {
    console.log(`${chalk.white(name)}: ${chalk.green(value)}`);
  }
};

export const header = (text: string) => {
  console.log(chalk.cyan(text));
};

export const timestampHeader = (time: number) => {
  const date = new Date(time);
  const timestamp = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  header(`${timestamp}\n`);
};

export const confirm = async (question: string): Promise<boolean> => {
  const questions = [
    {
      type: "confirm",
      name: "response",
      message: `${question}`,
    },
  ];
  const result = await inquirer.prompt(questions);
  return result.response;
};

export const confirmLive = async () => {
  danger("Live Account");
  const questions = [
    {
      type: "input",
      name: "confirmLive",
      message: "Type 'live' to confirm: ",
    },
  ];
  const answers = await inquirer.prompt(questions);

  if (answers.confirmLive !== "live") {
    process.exit();
  }
};

export const stringify = (value: any) => {
  JSON.stringify(value, null, 2);
};

export const showMap = (data: any) => {
  for (const [key, value] of Object.entries(data)) {
    nameValue(key, value);
  }
};
