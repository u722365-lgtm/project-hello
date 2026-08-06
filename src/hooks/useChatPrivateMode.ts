import { useCallback, useState } from "react";
import { backend } from "@/integrations/local/client";
import { useToast } from "@/hooks/use-toast";
import type { useE2EE } from "@/hooks/useE2EE";
import {
  isChatAnonymousUiActive,
  isChatPrivateModeActive,
  setChatAnonymousUiActive,
  setChatPrivateModeActive,
} from "@/lib/chatPrivateSession";

type E2EEApi = Pick<
  ReturnType<typeof useE2EE>,
  | "isUnlocked"
  | "isEncrypted"
  | "unwrapEncrypted"
  | "decryptData"
  | "encryptData"
  | "wrapEncrypted"
  | "engageSessionEncryption"
  | "lock"
>;

export function useChatPrivateMode(e2ee: E2EEApi) {
  const { toast } = useToast();
  const [active, setActive] = useState(() => isChatPrivateModeActive());
  const [anonymousUi, setAnonymousUi] = useState(() => isChatAnonymousUiActive());
  const [busy, setBusy] = useState(false);

  const resolveDisplayText = useCallback(
    async (raw: string): Promise<string> => {
      if (!e2ee.isEncrypted(raw)) return raw;
      if (!e2ee.isUnlocked) return "[Encrypted message]";
      const parts = e2ee.unwrapEncrypted(raw);
      if (!parts) return "[Encrypted message]";
      const plain = await e2ee.decryptData(parts.data, parts.iv);
      return plain ?? "[Encrypted message]";
    },
    [e2ee],
  );

  const wrapForStorage = useCallback(
    async (plaintext: string): Promise<string> => {
      if (!active || !e2ee.isUnlocked) return plaintext;
      const encrypted = await e2ee.encryptData(plaintext);
      if (encrypted) return e2ee.wrapEncrypted(encrypted.data, encrypted.iv);
      return plaintext;
    },
    [active, e2ee],
  );

  const encryptConversationInDb = useCallback(
    async (
      conversationId: string,
      rows: { id: string; content: string }[],
      titlePlain = "Private Chat",
    ) => {
      for (const row of rows) {
        if (row.id === "welcome") continue;
        const contentToSave = e2ee.isEncrypted(row.content)
          ? row.content
          : await wrapForStorage(row.content);
        if (contentToSave !== row.content) {
          await backend.from("messages").update({ content: contentToSave }).eq("id", row.id);
        }
      }

      const titleToSave = await wrapForStorage(titlePlain);
      await backend
        .from("conversations")
        .update({ title: titleToSave, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    [wrapForStorage, e2ee],
  );

  const enablePrivateMode = useCallback(
    async (options: {
      conversationId: string | null;
      messages: { id: string; content: string }[];
      isGuest: boolean;
    }) => {
      setBusy(true);
      try {
        const engaged = await e2ee.engageSessionEncryption();
        if (!engaged) {
          toast({
            title: "Encryption failed",
            description: "Could not start the security engine. Try again.",
            variant: "destructive",
          });
          return false;
        }

        setChatPrivateModeActive(true);
        setChatAnonymousUiActive(true);
        setActive(true);
        setAnonymousUi(true);

        if (options.conversationId && !options.isGuest) {
          await encryptConversationInDb(options.conversationId, options.messages);
        }

        toast({
          title: "Chat secured",
          description:
            "This conversation is encrypted end-to-end. Your identity is hidden in the UI for this session.",
        });
        return true;
      } catch (err) {
        console.error("[ChatPrivate] enable failed:", err);
        toast({
          title: "Could not secure chat",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [e2ee, encryptConversationInDb, toast],
  );

  const disablePrivateMode = useCallback(() => {
    setChatPrivateModeActive(false);
    setChatAnonymousUiActive(false);
    setActive(false);
    setAnonymousUi(false);
    e2ee.lock();
    toast({
      title: "Private mode off",
      description: "New messages are no longer encrypted. Existing ciphertext stays locked until you re-enable.",
    });
  }, [e2ee, toast]);

  const encryptLocalMessages = useCallback(
    async (messages: { id: string; content: string }[]) => {
      const out: { id: string; content: string }[] = [];
      for (const m of messages) {
        if (m.id === "welcome") {
          out.push(m);
          continue;
        }
        out.push({
          id: m.id,
          content: e2ee.isEncrypted(m.content) ? m.content : await wrapForStorage(m.content),
        });
      }
      return out;
    },
    [wrapForStorage, e2ee],
  );

  return {
    active,
    anonymousUi,
    busy,
    resolveDisplayText,
    wrapForStorage,
    enablePrivateMode,
    disablePrivateMode,
    encryptLocalMessages,
  };
}
