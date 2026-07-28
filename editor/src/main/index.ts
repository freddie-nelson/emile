import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, shell, session } from "electron";
import { join } from "path";

import { env } from "../shared/env";

app.commandLine.appendSwitch("disable-blink-features", "BlockCredentialedSubresources");

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
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
