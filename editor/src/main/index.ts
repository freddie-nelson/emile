import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, type IpcMainEvent,session, shell } from "electron";
import { join } from "path";

import { env } from "../shared/env";

app.commandLine.appendSwitch("disable-blink-features", "BlockCredentialedSubresources");

type DialogKind = "alert" | "confirm" | "prompt";

interface PendingDialog {
  event: IpcMainEvent;
  kind: DialogKind;
  contentsId: number;
}

const pendingDialogs = new Map<number, PendingDialog>();
let nextDialogId = 1;

/** What a dismissed dialog returns to the page. */
function cancelValue(kind: DialogKind): boolean | null | undefined {
  return kind === "confirm" ? false : kind === "prompt" ? null : undefined;
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      webviewTag: true,
      contextIsolation: true,
      devTools: env.NODE_ENV === "development",
      webSecurity: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  // Tabs are <webview>s, so lock down what the renderer may attach.
  mainWindow.webContents.on("will-attach-webview", (_e, webPreferences) => {
    delete webPreferences.preloadURL;
    webPreferences.preload = join(__dirname, "../preload/webview.js");
    webPreferences.contextIsolation = true;
    webPreferences.nodeIntegration = false;
    webPreferences.sandbox = true;
    // Match the main window, which the tabs previously inherited as iframes.
    webPreferences.webSecurity = false;
  });

  mainWindow.webContents.on("did-attach-webview", (_e, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      void shell.openExternal(url);
      return { action: "deny" };
    });

    // The page is blocked in sendSync while a dialog is open, so release it if it goes away
    // or navigates, and tell the renderer to drop the dialog.
    const releasePending = (): void => {
      for (const [requestId, pending] of pendingDialogs) {
        if (pending.contentsId !== contents.id) {
          continue;
        }
        pendingDialogs.delete(requestId);
        pending.event.returnValue = cancelValue(pending.kind);
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send("guest-dialog-cancel", requestId);
        }
      }
    };
    contents.on("did-start-navigation", (_e, _url, _inPlace, isMainFrame) => {
      if (isMainFrame) {
        releasePending();
      }
    });
    contents.on("destroyed", releasePending);
  });

  ipcMain.on("guest-dialog", (event, req: { kind: DialogKind; message: string; defaultValue: string }) => {
    if (mainWindow.isDestroyed()) {
      event.returnValue = cancelValue(req.kind);
      return;
    }

    // `event.returnValue` is assigned later, in `guest-dialog-result`, which keeps the guest blocked.
    const requestId = nextDialogId++;
    pendingDialogs.set(requestId, { event, kind: req.kind, contentsId: event.sender.id });
    mainWindow.webContents.send("guest-dialog", {
      requestId,
      webContentsId: event.sender.id,
      kind: req.kind,
      message: req.message,
      defaultValue: req.defaultValue,
    });
  });

  ipcMain.on("guest-dialog-result", (_e, requestId: number, value: unknown) => {
    const pending = pendingDialogs.get(requestId);
    if (!pending) {
      return;
    }
    pendingDialogs.delete(requestId);
    pending.event.returnValue = value;
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    void mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.emile.editor");

  // Strip X-Frame-Options and CSP frame-ancestors so external sites can be
  // embedded in iframes within the editor.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    delete headers["X-Frame-Options"];
    delete headers["x-frame-options"];
    delete headers["Content-Security-Policy"];
    delete headers["content-security-policy"];
    delete headers["Content-Security-Policy-Report-Only"];
    delete headers["content-security-policy-report-only"];
    callback({ responseHeaders: headers });
  });

  // Colyseus admin portal credentials
  const filter = { urls: ["http://localhost:2567/*"] };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    // Encode your credentials to Base64 for Basic Auth
    const credentials = Buffer.from("admin:password").toString("base64");

    // Inject the Authorization header
    details.requestHeaders["Authorization"] = `Basic ${credentials}`;

    callback({ requestHeaders: details.requestHeaders });
  });

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
