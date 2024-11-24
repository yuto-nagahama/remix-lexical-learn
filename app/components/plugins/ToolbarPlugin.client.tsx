/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  insertList,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $wrapNodeInElement, mergeRegister } from "@lexical/utils";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useState } from "react";
import { MARKDOWN_EXPORT_COMMAND } from "../command/markdown";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import {
  ArrowDownTrayIcon,
  Bars3BottomLeftIcon,
  Bars3BottomRightIcon,
  Bars3CenterLeftIcon,
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  StrikethroughIcon,
  TableCellsIcon,
  UnderlineIcon,
} from "@heroicons/react/24/outline";
import { $createTableNodeWithDimensions } from "@lexical/table";
import { INSERT_NEW_TABLE_COMMAND } from "../command/table";
import { CUSTOM_TRANSFORMERS } from "../transformer/transformer";
import { $createImageNode } from "../nodes/ImageNode";
import { INSERT_IMAGE_COMMAND, InsertImagePayload } from "../command/image";
import ImageInput from "../ui/ImageInput";
import MarkdownIcon from "../icons/MarkdownIcon";
import ToolButton from "../ToolButton";

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isMarkdownEditor, setIsMarkdownEditor] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
    }
  }, []);

  const handleMarkdownToggle = useCallback(() => {
    editor.update(() => {
      const root = $getRoot();

      if (isMarkdownEditor) {
        $convertFromMarkdownString(
          root.getTextContent(),
          CUSTOM_TRANSFORMERS,
          undefined, // node
          true
        );
        setIsMarkdownEditor(false);
      } else {
        const markdown = $convertToMarkdownString(
          CUSTOM_TRANSFORMERS,
          undefined, //node
          true
        );

        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(markdown));
        root.clear().append(paragraph);
        paragraph.select();
        setIsMarkdownEditor(true);
      }
    });
  }, [editor, isMarkdownEditor]);

  const loadImage = (files: FileList | null) => {
    const reader = new FileReader();

    reader.onload = function () {
      if (typeof reader.result === "string") {
        editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
          altText: "",
          src: reader.result,
        });
      }
      return "";
    };

    if (files !== null) {
      reader.readAsDataURL(files[0]);
    }
  };

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        MARKDOWN_EXPORT_COMMAND,
        () => {
          editor.read(() => {
            const markdown = $convertToMarkdownString(TRANSFORMERS);
            const blob = new Blob([markdown], { type: "text/plain" });
            const link = document.createElement("a");

            link.href = URL.createObjectURL(blob);
            link.download = `${new Date().getTime()}.md`;
            link.click();
            link.remove();
          });
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => {
          insertList(editor, "bullet");
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_ORDERED_LIST_COMMAND,
        () => {
          insertList(editor, "number");
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_NEW_TABLE_COMMAND,
        ({ columns, rows, includeHeaders }) => {
          const tableNode = $createTableNodeWithDimensions(
            Number(rows),
            Number(columns),
            includeHeaders
          );
          $insertNodes([tableNode]);
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<InsertImagePayload>(
        INSERT_IMAGE_COMMAND,
        (payload) => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode]);
          if ($isRootOrShadowRoot(imageNode.getParentOrThrow())) {
            $wrapNodeInElement(imageNode, $createParagraphNode).selectEnd();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor, $updateToolbar]);

  return (
    <div className="flex items-center bg-base-200">
      <ToolButton
        disabled={!isMarkdownEditor}
        onClick={() => {
          editor.dispatchCommand(MARKDOWN_EXPORT_COMMAND, undefined);
        }}
      >
        <ArrowDownTrayIcon className="size-5" />
      </ToolButton>
      <ToolButton active={isMarkdownEditor} onClick={handleMarkdownToggle}>
        <MarkdownIcon className="size-5" />
      </ToolButton>
      <ToolButton
        active={isBold}
        aria-label="Format Bold"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
      >
        <BoldIcon className="size-5" />
      </ToolButton>
      <ToolButton
        active={isItalic}
        aria-label="Format Italics"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
      >
        <ItalicIcon className="size-5" />
      </ToolButton>
      <ToolButton
        active={isUnderline}
        aria-label="Format Underline"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
      >
        <UnderlineIcon className="size-5" />
      </ToolButton>
      <ToolButton
        active={isStrikethrough}
        aria-label="Format StrikeThrough"
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
      >
        <StrikethroughIcon className="size-5" />
      </ToolButton>
      <ToolButton
        onClick={() => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
      >
        <ListBulletIcon className="size-5" />
      </ToolButton>
      <ToolButton
        onClick={() => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
      >
        <NumberedListIcon className="size-5" />
      </ToolButton>
      <ImageInput onChange={loadImage} />
      <ToolButton
        onClick={() => {
          editor.dispatchCommand(INSERT_NEW_TABLE_COMMAND, {
            rows: "3",
            columns: "3",
            includeHeaders: true,
          });
        }}
      >
        <TableCellsIcon className="size-6" />
      </ToolButton>
      <ToolButton
        aria-label="Left Align"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        }}
      >
        <Bars3BottomLeftIcon className="size-5" />
      </ToolButton>
      <ToolButton
        aria-label="Center Align"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        }}
      >
        <Bars3CenterLeftIcon className="size-5" />
      </ToolButton>
      <ToolButton
        aria-label="Right Align"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        }}
      >
        <Bars3BottomRightIcon className="size-5" />
      </ToolButton>
    </div>
  );
}
