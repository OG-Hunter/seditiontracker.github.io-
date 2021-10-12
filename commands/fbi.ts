import { Command } from "commander";
import { head, includes, map } from "lodash";
import { error } from "./common/console";

const command = new Command().command("scrape", "scrape the fbi website for wanted suspects");

command.parse(process.argv);

const subCmd = head(command.args);
const cmds = map(command.commands, "_name");

if (!includes(cmds, subCmd)) {
  error("unknown command");
  command.help();
}
