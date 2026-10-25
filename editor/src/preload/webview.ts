import { contextBridge, ipcRenderer, webFrame } from "electron";

type DialogKind = "alert" | "confirm" | "prompt";

// Blocks this page until the editor answers, matching the semantics of the native dialogs.
const ask = (kind: DialogKind, message: unknown, defaultValue?: unknown): unknown =>
  ipcRenderer.sendSync("guest-dialog", {
    kind,
    message: String(message ?? ""),
    defaultValue: defaultValue === undefined ? "" : String(defaultValue),
  });

try {
  contextBridge.exposeInMainWorld("__emileDialog", {
    alert: (message?: unknown) => {
      ask("alert", message);
    },
    confirm: (message?: unknown) => ask("confirm", message) === true,
    prompt: (message?: unknown, defaultValue?: unknown) => {
      const result = ask("prompt", message, defaultValue);
      return typeof result === "string" ? result : null;
    },
  });

  // The page's own world can't see this preload's globals, so swap the dialogs in from there.
  void webFrame.executeJavaScript(`
    (() => {
      const d = window.__emileDialog;
      window.alert = (m) => d.alert(m);
      window.confirm = (m) => d.confirm(m);
      window.prompt = (m, v) => d.prompt(m, v);
    })();
  `);
} catch (error) {
  console.error(error);
}
