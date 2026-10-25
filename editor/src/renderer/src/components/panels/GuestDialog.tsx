import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Input } from "../ui/input";

export interface GuestDialogRequest {
  requestId: number;
  webContentsId: number;
  kind: "alert" | "confirm" | "prompt";
  message: string;
  defaultValue: string;
}

export type GuestDialogResult = boolean | string | null | undefined;

interface GuestDialogProps {
  request: GuestDialogRequest;
  /** Name of the tab that opened the dialog. */
  tabName: string;
  onResult: (result: GuestDialogResult) => void;
}

/** Renders a page's `alert`, `confirm` or `prompt` in the editor, returning what the page expects. */
export function GuestDialog({ request, tabName, onResult }: GuestDialogProps) {
  const [value, setValue] = useState(request.defaultValue);

  const cancelResult = request.kind === "confirm" ? false : request.kind === "prompt" ? null : undefined;
  const acceptResult = request.kind === "confirm" ? true : request.kind === "prompt" ? value : undefined;

  return (
    <AlertDialog open onOpenChange={(open) => !open && onResult(cancelResult)}>
      <AlertDialogContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onResult(acceptResult);
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{tabName} says</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap break-words">
              {request.message}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {request.kind === "prompt" && (
            <Input autoFocus autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} />
          )}

          <AlertDialogFooter>
            {request.kind !== "alert" && <AlertDialogCancel type="button">Cancel</AlertDialogCancel>}
            <AlertDialogAction type="submit">OK</AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
