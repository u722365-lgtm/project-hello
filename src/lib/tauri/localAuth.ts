export interface TauriLocalAuth {
  /** Biometric result from Rust backend */
  authenticateWithBiometric(reason?: string): Promise<boolean>;
  signInWithCredentials(payload: {
    email: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<void>;
  /** Check whether native credential store has saved credentials */
  hasStoredCredentials(): Promise<boolean>;
}
