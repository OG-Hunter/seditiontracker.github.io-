import { Command } from "commander";
import { head, includes, map } from "lodash";
import { error } from "./common/console";

const command = new Command()
  .command("publish", "updates the online spreadsheet")

command.parse(process.argv);

const subCmd = head(command.args);
const cmds = map(command.commands, "_name");

if (!includes(cmds, subCmd)) {
  error("unknown command");
  command.help();
}