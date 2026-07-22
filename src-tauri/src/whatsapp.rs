use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::command;

#[derive(Debug, Serialize)]
pub struct StatusResponse {
  pub status: String,
  pub mode: String,
  pub phone: Option<String>,
  pub last_error: Option<String>,
  pub session_dir: String,
  pub note: String,
}

#[derive(Debug, Serialize)]
pub struct OpenStatusResponse {
  pub ok: bool,
  pub path: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PairResponse {
  pub ok: bool,
  pub pid: Option<u64>,
  pub error: Option<String>,
}

fn default_session_dir() -> String {
  std::env::home_dir()
    .map(|h| h.join(".hermes").join("whatsapp").join("session").to_string_lossy().into_owned())
    .unwrap_or_else(|| String::from("/tmp/whatsapp_session"))
}

fn session_dir() -> PathBuf {
  PathBuf::from(default_session_dir())
}

#[command]
pub fn whatsapp_status() -> StatusResponse {
  let dir = session_dir();

  if !dir.exists() {
    return StatusResponse {
      status: String::from("unavailable"),
      mode: String::from("local"),
      phone: None,
      last_error: None,
      session_dir: dir.to_string_lossy().into_owned(),
      note: String::from(
        "No local WhatsApp session directory at ~/.hermes/whatsapp/session yet.",
      ),
    };
  }

  let mut creds_exists = false;
  let mut qr_exists = false;
  let mut session_exists = false;

  if let Ok(entries) = std::fs::read_dir(&dir) {
    for entry in entries.flatten() {
      let name = entry.file_name().to_string_lossy().to_lowercase();
      if name.contains("creds") {
        creds_exists = true;
      }
      if name.contains("qr") {
        qr_exists = true;
      }
      if name.contains("session") || name.contains("wa") {
        session_exists = true;
      }
    }
  }

  if creds_exists || session_exists {
    StatusResponse {
      status: String::from("ready"),
      mode: String::from("local"),
      phone: None,
      last_error: None,
      session_dir: dir.to_string_lossy().into_owned(),
      note: String::from(
        "Session artifacts found on disk. Wire this to Baileys/Raspberry state to resolve phone.",
      ),
    }
  } else if qr_exists {
    StatusResponse {
      status: String::from("awaiting_qr"),
      mode: String::from("local"),
      phone: None,
      last_error: None,
      session_dir: dir.to_string_lossy().into_owned(),
      note: String::from("QR session artifacts exist, but scan is not confirmed yet."),
    }
  } else {
    StatusResponse {
      status: String::from("unavailable"),
      mode: String::from("local"),
      phone: None,
      last_error: None,
      session_dir: dir.to_string_lossy().into_owned(),
      note: String::from("Session directory exists without recognizable credential or QR files."),
    }
  }
}

#[command]
pub fn whatsapp_open_status() -> OpenStatusResponse {
  let dir = session_dir();

  if let Err(e) = std::fs::create_dir_all(&dir) {
    return OpenStatusResponse {
      ok: false,
      path: None,
      error: Some(format!("Failed to create session dir: {e}")),
    };
  }

  let path = dir.to_string_lossy().into_owned();

  let opened = open_shell(&path);

  OpenStatusResponse {
    ok: opened,
    path: Some(path),
    error: if opened {
      None
    } else {
      Some(String::from("Unable to open session directory."))
    },
  }
}

#[command]
pub fn whatsapp_pair(command: Option<String>, args: Vec<String>) -> PairResponse {
  let dir = session_dir();

  if let Err(e) = std::fs::create_dir_all(&dir) {
    return PairResponse {
      ok: false,
      pid: None,
      error: Some(format!("Failed to create session dir: {e}")),
    };
  }

  let cmd = command.unwrap_or_else(|| {
    let cwd = std::env::current_dir().unwrap_or_default();
    let candidates = [
      cwd.join("whatsapp-bridge.js").to_string_lossy().into_owned(),
      cwd.join("bin").join("whatsapp").to_string_lossy().into_owned(),
    ];
    if Path::new(&candidates[0]).exists() {
      candidates[0].clone()
    } else if Path::new(&candidates[1]).exists() {
      candidates[1].clone()
    } else {
      String::from("echo")
    }
  });

  let mut child = match Command::new(&cmd)
    .args(&args)
    .current_dir(&dir)
    .stdout(Stdio::inherit())
    .stderr(Stdio::inherit())
    .spawn()
  {
    Ok(child) => child,
    Err(e) => {
      return PairResponse {
        ok: false,
        pid: None,
        error: Some(format!("Failed to spawn pairing command `{}`: {e}", cmd)),
      }
    }
  };

  let pid = child.id();

  let _ = child;

  PairResponse {
    ok: true,
    pid: Some(pid.into()),
    error: None,
  }
}

#[cfg(target_os = "windows")]
fn open_shell(path: &str) -> bool {
  Command::new("explorer.exe").arg(path).spawn().is_ok()
}

#[cfg(target_os = "macos")]
fn open_shell(path: &str) -> bool {
  Command::new("open").arg(path).spawn().is_ok()
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
fn open_shell(path: &str) -> bool {
  Command::new("xdg-open").arg(path).spawn().is_ok()
}
