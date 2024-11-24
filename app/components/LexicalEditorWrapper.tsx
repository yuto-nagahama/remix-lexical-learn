import { ClientOnly } from "remix-utils/client-only";
import LexicalEditorClient from "./LexicalEditorClient.client";

export default function LexicalEditorWrapper() {
  return <ClientOnly>{() => <LexicalEditorClient />}</ClientOnly>;
}
