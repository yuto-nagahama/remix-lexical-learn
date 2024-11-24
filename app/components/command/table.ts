import { InsertTableCommandPayload } from "@lexical/table";
import { createCommand, LexicalCommand } from "lexical";

export const INSERT_NEW_TABLE_COMMAND: LexicalCommand<InsertTableCommandPayload> =
  createCommand("INSERT_NEW_TABLE_COMMAND");
