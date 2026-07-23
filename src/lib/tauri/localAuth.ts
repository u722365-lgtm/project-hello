// Local Tauri auth surface. Not re-exported from ./types to avoid duplicate definitions.

type Booleanish = boolean | Promise<boolean>;
type VoidPromise = Promise<void>;
type CredentialSignInResult = { success: boolean; error?: string };

export interface TauriLocalAuth {
  authenticateWithBiometric(reason?: string): Promise<boolean>;
  signInWithCredentials(payload: {
    email: string;
    password: string;
  }): Promise<CredentialSignInResult>;
  signOut(): VoidPromise;
  hasStoredCredentials(): Promise<boolean>;
}

function getInvoke(): ((cmd: string, args?: any) => Promise<any>) | null {
  const maybe =
    (typeof window !== "undefined" &&
      ((window as any).__TAURI_INVOKE_HANDLERS__ || (document as any)?.__TAURI_INVOKE_HANDLERS__)) ||
    null;

  if (!maybe) return null;
  if (typeof maybe.invoke === "function") return maybe.invoke;
  return null;
}

function asBool(value: unknown): boolean {
  return Boolean(value);
}

export async function buildLocalAuth(): Promise<TauriLocalAuth | null> {
  const invoke = getInvoke();
  if (!invoke) return null;

  return {
    async authenticateWithBiometric(reason?: string): Promise<boolean> {
      try {
        const result = await invoke("local_biometric", { reason: reason ?? null });
        return asBool(result);
      } catch {
        return false;
      }
    },

    async signInWithCredentials(payload) {
      try {
        const result = await invoke("local_sign_in", {
          email: payload.email,
          password: payload.password,
        });
        return { success: asBool(result) };
      } catch (e: any) {
        return { success: false, error: e?.message || "Local sign-in failed." };
      }
    },

    async signOut() {
      try {
        await invoke("local_sign_out");
      } catch {
        // best-effort
      }
    },

    async hasStoredCredentials() {
      try {
        const result = await invoke("local_has_credentials");
        return asBool(result);
      } catch {
        return false;
      }
    },
  };
}
