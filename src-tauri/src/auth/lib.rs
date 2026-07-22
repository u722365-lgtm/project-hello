use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CredentialPayload {
  pub email: String,
  pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResult {
  pub success: bool,
  pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PreferredLoginResponse {
  pub preferred: String,
  pub available: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HasStoredCredentialsResponse {
  pub has_credentials: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocalUserSession {
  pub email: String,
  pub display_name: String,
  pub created_unix: u64,
}

const CURRENT_USER_KEY: &str = "shadowtalk_current_user";
const PASSWORD_TAG: &str = "shadowtalk_password";

#[derive(Debug, Clone)]
pub struct AuthStore {
  _priv: (),
}

impl AuthStore {
  pub fn init() -> Self {
    let _ = keyring::Entry::new(PASSWORD_TAG, CURRENT_USER_KEY)
      .and_then(|entry| entry.get_credential())
      .is_ok();
    Self { _priv: () }
  }
}

impl AuthStore {
  fn entry_for_user(email: &str) -> keyring::Result<keyring::Entry> {
    keyring::Entry::new(PASSWORD_TAG, email)
  }
}

static AUTH_STORE: Mutex<AuthStore> = Mutex::new(AuthStore { _priv: () });

#[tauri::command]
pub async fn sign_in_with_credentials(payload: CredentialPayload) -> AuthResult {
  if payload.email.trim().is_empty() || payload.password.is_empty() {
    return AuthResult { success: false, error: Some("Email and password are required.".into()) };
  }
  let ret = AUTH_STORE.lock().ok();
  if let Some(_store) = ret {
    match AuthStore::entry_for_user(&payload.email)
      .and_then(|entry| entry.set_password(&payload.password))
    {
      Ok(_) => {
        let _ = AUTH_STORE.lock().ok().and_then(|_| {
          let session = LocalUserSession {
            email: payload.email.clone(),
            display_name: payload.email.clone(),
            created_unix: SystemTime::now().duration_since(UNIX_EPOCH).ok()?.as_secs,
          };
          if let Ok(entry) = keyring::Entry::new("shadowtalk_session", CURRENT_USER_KEY) {
            let payload = serde_json::to_vec(&session).ok()?;
            let _ = entry.set(&String::from_utf8_lossy(&payload));
          }
          Some(())
        });
        AuthResult { success: true, error: None }
      }
      Err(err) => AuthResult { success: false, error: Some(err.to_string()) },
    }
  } else {
    AuthResult { success: false, error: Some("Secure storage is unavailable.".into()) }
  }
}

#[tauri::command]
pub async fn sign_out() -> AuthResult {
  let store = AUTH_STORE.lock().ok();
  if let Some(_store) = store {
    // best-effort: try to read back to clear the credential; not strictly supported on all backends.
    let _ = keyring::Entry::new("shadowtalk_session", CURRENT_USER_KEY)
      .and_then(|entry| entry.delete_credential());
  }
  AuthResult { success: true, error: None }
}

#[tauri::command]
pub async fn preferred_login() -> PreferredLoginResponse {
  PreferredLoginResponse { preferred: "credentials".into(), available: true }
}

#[tauri::command]
pub async fn has_stored_credentials() -> HasStoredCredentialsResponse {
  let mut present = false;
  if let Ok(entry) = keyring::Entry::new("shadowtalk_session", CURRENT_USER_KEY) {
    if let Ok(cred) = entry.get_credential() {
      present = !cred.is_empty();
    }
  }
  HasStoredCredentialsResponse { has_credentials: present }
}

#[tauri::command]
pub async fn biometric_auth(reason: Option<String>) -> Result<bool, String> {
  let _ = reason;
  Ok(false)
}

#[tauri::command]
pub async fn authenticate_with_biometric(reason: Option<String>) -> Result<bool, String> {
  let _ = reason;
  Ok(false)
}

pub mod shadowtalk_backends {
  use serde_json::Value;

  pub fn install_local_auth(window: &tauri::Window) {
    let _ = window;
  }

  pub fn enrich_backends_payload() -> Value {
    serde_json::json!({
      "localAuth": {
        "signInWithCredentials": true,
        "signOut": true,
        "hasStoredCredentials": true,
        "preferredLogin": true,
        "biometric": false,
        "backend": "keyring"
      }
    })
  }
}
