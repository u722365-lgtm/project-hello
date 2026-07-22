#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      ollama_status,
      ollama_pull,
      ollama_chat,
      secure_get,
      secure_set,
      secure_remove,
      open_external_url,
      whatsapp_status,
      media_tts_speak
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaChatRequest {
  pub model: String,
  pub prompt: String,
  pub stream: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
  pub role: String,
  pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaChatResponse {
  pub model: String,
  pub message: ChatMessage,
  pub done: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullProgress {
  pub status: String,
  pub digest: Option<String>,
  pub total: Option<u64>,
  pub completed: Option<u64>,
}

#[tauri::command]
fn ollama_status() -> serde_json::Value {
  serde_json::json!({
    "endpoint": "http://127.0.0.1:11434",
    "ready": false,
    "default_model": "qwen2.5:7b",
    "fallback_model": "phi3:mini",
    "note": "Wire to Ollama HTTP API from Rust or call local relay in a follow-up migration."
  })
}

#[tauri::command]
fn ollama_pull(model: String) -> Result<PullProgress, String> {
  Ok(PullProgress {
    status: format!("pending pull for {}", model),
    digest: None,
    total: None,
    completed: None,
  })
}

#[tauri::command]
fn ollama_chat(req: OllamaChatRequest) -> Result<OllamaChatResponse, String> {
  Err(format!(
    "Ollama chat not wired yet. Requested model: {}, prompt length: {}",
    req.model,
    req.prompt.len()
  ))
}

#[tauri::command]
fn secure_get(key: String) -> Result<Option<String>, String> {
  Err(format!("Secure get not implemented yet for key: {}", key))
}

#[tauri::command]
fn secure_set(key: String, value: String) -> Result<(), String> {
  Err(format!("Secure set not implemented yet for key: {}", key))
}

#[tauri::command]
fn secure_remove(key: String) -> Result<(), String> {
  Err(format!("Secure remove not implemented yet for key: {}", key))
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
  open::that_detached(url).map_err(|e| e.to_string())
}

#[tauri::command]
fn whatsapp_status() -> serde_json::Value {
  serde_json::json!({
    "status": "unavailable",
    "mode": "local",
    "message": "Local WhatsApp bridge is not implemented in the Tauri skeleton yet."
  })
}

#[tauri::command]
fn media_tts_speak(text: String) -> Result<(), String> {
  Err(format!("Local TTS not wired yet for {} characters", text.len()))
}
