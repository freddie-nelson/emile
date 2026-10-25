/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    webview: import("react").DetailedHTMLProps<
      import("react").HTMLAttributes<Electron.WebviewTag>,
      Electron.WebviewTag
    > & {
      src?: string;
    };
  }
}
