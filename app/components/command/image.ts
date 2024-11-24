import { createCommand, LexicalCommand } from "lexical";
import { ImagePayload } from "../nodes/ImageNode";

export type InsertImagePayload = Readonly<ImagePayload>;

export const INSERT_IMAGE_COMMAND: LexicalCommand<Readonly<ImagePayload>> =
  createCommand("INSERT_IMAGE_COMMAND");
