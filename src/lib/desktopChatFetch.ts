import { getChatFetchHeaders } from "@/lib/supabaseEnv";
import { getDesktopAPI } from "@/lib/desktopBridge";

export type DesktopChatStreamEnd =
  | { ok: true }
  | { ok: false; status: number; body: string };

export function desktopChatStream(
  chatUrl: string,
  body: string,
  accessToken: string | null | undefined,
  signal: AbortSignal,
  onChunk: (text: string) => void,
): Promise<DesktopChatStreamEnd> {
  const api = getDesktopAPI();
  if (!api?.chatStream) {
    return Promise.reject(new Error("Desktop chat API is not available."));
  }

  const headers = getChatFetchHeaders(accessToken);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: DesktopChatStreamEnd) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    signal.addEventListener(
      "abort",
      () => finish({ ok: false, status: 0, body: "Aborted" }),
      { once: true },
    );

    void api
      .chatStream({ url: chatUrl, headers, body }, onChunk, finish)
      .catch((err: unknown) =>
        finish({
          ok: false,
          status: 0,
          body: err instanceof Error ? err.message : "Desktop chat failed",
        }),
      );
  });
}
