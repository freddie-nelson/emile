import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

interface TabWebviewProps {
  id: string;
  url: string;
  onLoadStart: () => void;
  onLoadStop: () => void;
  onNavigate: (url: string) => void;
  onError: (message: string) => void;
  /** Called once the webview's webContents id is known, so main-process events can be matched to the tab. */
  onAttach: (webContentsId: number) => void;
}

/** A tab's page, wired up to report loading, navigation and failures. */
export const TabWebview = forwardRef<Electron.WebviewTag | null, TabWebviewProps>(
  function TabWebview({ id, url, onLoadStart, onLoadStop, onNavigate, onError, onAttach }, ref) {
    const webviewRef = useRef<Electron.WebviewTag>(null);
    useImperativeHandle(ref, () => webviewRef.current as Electron.WebviewTag);

    // Keep the latest callbacks without re-subscribing to the webview's events.
    const handlers = useRef({ onLoadStart, onLoadStop, onNavigate, onError, onAttach });
    handlers.current = { onLoadStart, onLoadStop, onNavigate, onError, onAttach };

    useEffect(() => {
      const webview = webviewRef.current;
      if (!webview) {
        return;
      }

      const reportAttach = (): void => {
        try {
          handlers.current.onAttach(webview.getWebContentsId());
        } catch {
          // not attached yet, a later event will retry
        }
      };

      const onNav = (e: Electron.DidNavigateEvent): void => handlers.current.onNavigate(e.url);
      const onNavInPage = (e: Electron.DidNavigateInPageEvent): void => {
        if (e.isMainFrame) {
          handlers.current.onNavigate(e.url);
        }
      };
      const onFail = (e: Electron.DidFailLoadEvent): void => {
        // -3 is a navigation that was aborted by a newer one
        if (!e.isMainFrame || e.errorCode === -3) {
          return;
        }
        handlers.current.onError(`Failed to load "${e.validatedURL}" (${e.errorDescription})`);
      };
      const onStart = (): void => handlers.current.onLoadStart();
      const onStop = (): void => handlers.current.onLoadStop();

      webview.addEventListener("did-attach", reportAttach);
      webview.addEventListener("dom-ready", reportAttach);
      webview.addEventListener("did-start-loading", onStart);
      webview.addEventListener("did-stop-loading", onStop);
      webview.addEventListener("did-navigate", onNav);
      webview.addEventListener("did-navigate-in-page", onNavInPage);
      webview.addEventListener("did-fail-load", onFail);

      return () => {
        webview.removeEventListener("did-attach", reportAttach);
        webview.removeEventListener("dom-ready", reportAttach);
        webview.removeEventListener("did-start-loading", onStart);
        webview.removeEventListener("did-stop-loading", onStop);
        webview.removeEventListener("did-navigate", onNav);
        webview.removeEventListener("did-navigate-in-page", onNavInPage);
        webview.removeEventListener("did-fail-load", onFail);
      };
    }, []);

    return <webview ref={webviewRef} id={`webview-${id}`} className="w-full flex-1" src={url} />;
  },
);
