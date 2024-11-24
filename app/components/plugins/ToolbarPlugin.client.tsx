/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
  $isListItemNode,
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
  KEY_ENTER_COMMAND,
  RangeSelection,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import { MARKDOWN_EXPORT_COMMAND } from "../command/markdown";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
} from "@lexical/markdown";
import {
  ListBulletIcon,
  NumberedListIcon,
  PhotoIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { $createTableNodeWithDimensions } from "@lexical/table";
import { INSERT_NEW_TABLE_COMMAND } from "../command/table";
import { CUSTOM_TRANSFORMERS } from "../transformer/transformer";
import { $createImageNode } from "../nodes/ImageNode";
import ImageInput from "../ui/ImageInput";
import { INSERT_IMAGE_COMMAND, InsertImagePayload } from "../command/image";

const LowPriority = 1;

function Divider() {
  return <div className="divider" />;
}

const shouldPreventDefaultEnter = (selection: RangeSelection) => {
  const anchorNode = selection.anchor.getNode();
  if (!$isListItemNode(anchorNode)) return false;
  // リストアイテムノードで、テキストが0以上で最後の子ではない場合にtrueを返す
  return anchorNode.getTextContentSize() === 0 && anchorNode.isLastChild();
};

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
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
          false
        );
        setIsMarkdownEditor(false);
      } else {
        const markdown = $convertToMarkdownString(
          CUSTOM_TRANSFORMERS,
          undefined, //node
          false
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
        LowPriority
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (payload) => {
          if (!payload) return true;

          const event: KeyboardEvent = payload;
          const selection = $getSelection();

          if (!selection) return false;
          if (!$isRangeSelection(selection)) return false;

          if (shouldPreventDefaultEnter(selection)) {
            event.preventDefault();
            editor.update(() => {
              selection.insertNodes([$createParagraphNode()]);
            });
          }
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        MARKDOWN_EXPORT_COMMAND,
        () => {
          editor.read(() => {
            const markdown = $convertToMarkdownString(TRANSFORMERS);
            console.log(markdown);
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
          console.log(123);
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
    <div className="toolbar" ref={toolbarRef}>
      <button
        onClick={() => {
          editor.dispatchCommand(MARKDOWN_EXPORT_COMMAND, undefined);
        }}
        className="btn btn-sm"
        disabled={!isMarkdownEditor}
      >
        Export
      </button>
      <button onClick={handleMarkdownToggle} className="btn btn-sm">
        {!isMarkdownEditor ? "Markdown" : "WYSIWYG"}
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
        }}
        className={"toolbar-item spaced " + (isBold ? "active" : "")}
        aria-label="Format Bold"
      >
        <i className="format bold" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
        }}
        className={"toolbar-item spaced " + (isItalic ? "active" : "")}
        aria-label="Format Italics"
      >
        <i className="format italic" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
        }}
        className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
        aria-label="Format Underline"
      >
        <i className="format underline" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
        }}
        className={"toolbar-item spaced " + (isStrikethrough ? "active" : "")}
        aria-label="Format Strikethrough"
      >
        <i className="format strikethrough" />
      </button>
      <Divider />
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
        }}
        className="toolbar-item spaced"
        aria-label="Left Align"
      >
        <i className="format left-align" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
        }}
        className="toolbar-item spaced"
        aria-label="Center Align"
      >
        <i className="format center-align" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
        }}
        className="toolbar-item spaced"
        aria-label="Right Align"
      >
        <i className="format right-align" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify");
        }}
        className="toolbar-item"
        aria-label="Justify Align"
      >
        <i className="format justify-align" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Justify Align"
      >
        <ListBulletIcon className="size-6" />
      </button>
      <button
        onClick={() => {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
        }}
        className="toolbar-item"
        aria-label="Justify Align"
      >
        <NumberedListIcon className="size-6" />
      </button>
      <ImageInput onChange={loadImage} />
      <button
        onClick={() => {
          editor.dispatchCommand(INSERT_NEW_TABLE_COMMAND, {
            rows: "3",
            columns: "3",
            includeHeaders: true,
          });
        }}
        className="toolbar-item"
        aria-label="Justify Align"
      >
        <TableCellsIcon className="size-6" />
      </button>
    </div>
  );
}
