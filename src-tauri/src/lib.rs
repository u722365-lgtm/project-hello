// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use reqwest::{header, Client, StatusCode};
use serde::{Deserialize, Serialize};
use std::time::Duration;

mod secure_store;
mod whatsapp;

use secure_store::{
  secure_clear, secure_get, secure_get_all_keys, secure_remove, secure_set,
};

static OLLAMA_BASE_URL: &str = "http://127.0.0.1:11434";
static DEFAULT_MODEL: &str = "qwen2.5:7b";
static FALLBACK_MODEL: &str = "phi3:mini";

fn http_client() -> Client {
  Client::builder()
    .timeout(Duration::from_secs(60))
    .user_agent("shadowtalk-ai/1.0")
    .build()
    .expect("failed to build reqwest client")
}

fn ollama_url(path: &str) -> String {
  format!("{}{}", OLLAMA_BASE_URL.trim_end_matches('/'), path)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatMessage {
  pub role: String,
  pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaChatRequest {
  pub model: String,
  pub prompt: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub stream: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaChatResponse {
  pub model: String,
  pub message: ChatMessage,
  pub done: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PullProgress {
  pub status: String,
  pub digest: Option<String>,
  pub total: Option<u64>,
  pub completed: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaTagsResponse {
  models: Vec<OllamaTag>,
}
#[derive(Debug, Serialize, Deserialize)]
struct OllamaTag {
  name: String,
  #[serde(default)]
  digest: String,
  #[serde(default)]
  size: u64,
  #[serde(default)]
  modified_at: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        let _ = app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        );
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      ollama_status,
      ollama_pull,
      ollama_stream,
      ollama_chat,
      secure_get,
      secure_set,
      secure_remove,
      secure_get_all_keys,
      secure_clear,
      open_external_url,
      whatsapp_status,
      whatsapp_open_status,
      whatsapp_pair,
      media_tts_speak,
      local_sign_in,
      local_sign_out,
      local_has_credentials,
      local_preferred_login,
      local_biometric
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn ollama_status() -> Result<serde_json::Value, String> {
  let client = http_client();
  let health_url = ollama_url("/api/health");
  let tags_url = ollama_url("/api/tags");

  let health = client
    .get(&health_url)
    .header(header::ACCEPT, "application/json")
    .send()
    .await
    .map(|r| r.status() == StatusCode::OK)
    .unwrap_or(false);

  let mut models: Vec<String> = vec![];
  let mut version: Option<String> = None;

  if health {
    if let Ok(res) = client.get(&tags_url).send().await {
      if res.status() == StatusCode::OK {
        if let Ok(parsed) = res.json::<OllamaTagsResponse>().await {
          models = parsed.models.into_iter().map(|m| m.name).collect();
        }
      }
    }

    if let Ok(res) = client.get(ollama_url("/api/version")).send().await {
      if let Ok(parsed) = res.json::<std::collections::HashMap<String, String>>().await {
        version = parsed.get("version").cloned();
      }
    }
  }

  let active_model = models
    .iter()
    .find(|m| *m == DEFAULT_MODEL || m.starts_with(&format!("{}:", DEFAULT_MODEL)))
    .cloned()
    .unwrap_or_else(|| DEFAULT_MODEL.to_owned());

  Ok(serde_json::json!({
    "endpoint": ollama_url(""),
    "ready": health,
    "version": version,
    "models": models,
    "default_model": DEFAULT_MODEL,
    "fallback_model": FALLBACK_MODEL,
    "active_model": active_model,
  }))
}

#[tauri::command]
async fn ollama_pull(model: String) -> Result<PullProgress, String> {
  if model.trim().is_empty() {
    return Err("model name is required".to_owned());
  }
  let client = http_client();
  let url = ollama_url("/api/pull");
  let payload = serde_json::json!({ "name": model, "stream": true });

  let res = client
    .post(&url)
    .header(header::CONTENT_TYPE, "application/json")
    .json(&payload)
    .send()
    .await
    .map_err(|e| format!("failed to start pull: {:?}", e))?;

  if !res.status().is_success() {
    return Err(format!("pull failed with status {}", res.status()));
  }

  Ok(PullProgress {
    status: format!("completed pull for {}", model),
    digest: None,
    total: None,
    completed: None,
  })
}

#[tauri::command]
async fn ollama_chat(req: OllamaChatRequest) -> Result<OllamaChatResponse, String> {
  let model = if req.model.trim().is_empty() {
    DEFAULT_MODEL.to_owned()
  } else {
    req.model.clone()
  };

  let client = http_client();
  let url = ollama_url("/api/chat");
  let payload = serde_json::to_value(OllamaChatRequest {
    model: model.clone(),
    prompt: req.prompt.clone(),
    stream: Some(true),
  })
  .map_err(|e| format!("serialize chat request failed: {:?}", e))?;

  let res = client
    .post(&url)
    .header(header::CONTENT_TYPE, "application/json")
    .json(&payload)
    .send()
    .await
    .map_err(|e| format!("ollama_chat request failed: {:?}", e))?;

  if !res.status().is_success() {
    return Err(format!("ollama responded with status {}", res.status()));
  }

  let body = res.text().await.map_err(|e| format!("failed to read response: {:?}", e))?;

  let mut result = OllamaChatResponse {
    model: model.clone(),
    message: ChatMessage {
      role: "assistant".to_owned(),
      content: String::new(),
    },
    done: true,
  };

  for line in body.lines() {
    let trimmed = line.trim();
    if trimmed.is_empty() {
      continue;
    }
    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(trimmed) {
      if let Some(msg) = parsed.get("message") {
        if let Some(content) = msg.get("content").and_then(|v| v.as_str()) {
          result.message = ChatMessage {
            role: msg
              .get("role")
              .and_then(|v| v.as_str())
              .unwrap_or("assistant")
              .to_owned(),
            content: content.to_owned(),
          };
        }
      }
    }
  }

  Ok(result)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OllamaStreamDelta {
  pub model: String,
  pub message: ChatMessage,
  pub done: bool,
}

#[tauri::command]
async fn ollama_stream(req: OllamaChatRequest) -> Result<Vec<OllamaStreamDelta>, String> {
  let model = if req.model.trim().is_empty() {
    DEFAULT_MODEL.to_owned()
  } else {
    req.model.clone()
  };
  let client = http_client();
  let url = ollama_url("/api/chat");
  let payload = serde_json::to_value(OllamaChatRequest {
    model: model.clone(),
    prompt: req.prompt.clone(),
    stream: Some(true),
  })
  .map_err(|e| format!("serialize stream request failed: {:?}", e))?;

  let res = client
    .post(&url)
    .header(header::CONTENT_TYPE, "application/json")
    .json(&payload)
    .send()
    .await
    .map_err(|e| format!("ollama_stream request failed: {:?}", e))?;

  if !res.status().is_success() {
    return Err(format!("ollama responded with status {}", res.status()));
  }

  let body = res.text().await.map_err(|e| format!("failed to read stream body: {:?}", e))?;
  let mut deltas: Vec<OllamaStreamDelta> = Vec::new();
  for line in body.lines() {
    let trimmed = line.trim();
    if trimmed.is_empty() {
      continue;
    }
    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(trimmed) {
      let delta = OllamaStreamDelta {
        model: parsed
          .get("model")
          .and_then(|v| v.as_str())
          .unwrap_or(&model)
          .to_owned(),
        message: ChatMessage {
          role: parsed
            .get("message")
            .and_then(|v| v.get("role"))
            .and_then(|v| v.as_str())
            .unwrap_or("assistant")
            .to_owned(),
          content: parsed
            .get("message")
            .and_then(|v| v.get("content"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_owned(),
        },
        done: parsed
          .get("done")
          .and_then(|v| v.as_bool())
          .unwrap_or(false),
      };
      deltas.push(delta);
    }
  }
  Ok(deltas)
}

#[tauri::command]
async fn open_external_url(url: String) -> Result<(), String> {
  open::that_detached(url).map_err(|e| e.to_string())?;
  Ok(())
}

#[tauri::command]
fn media_tts_speak(_text: String) -> Result<(), String> {
  Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
struct LocalSession {
  email: String,
  created_unix: u64,
}

#[tauri::command]
async fn local_sign_in(email: String, _password: String) -> Result<bool, String> {
  if email.trim().is_empty() {
    return Ok(false);
  }
  let session = LocalSession {
    email: email.trim().to_owned(),
    created_unix: std::time::SystemTime::now()
      .duration_since(std::time::UNIX_EPOCH)
      .map(|d| d.as_secs())
      .unwrap_or_default(),
  };
  let payload = serde_json::to_string(&session).map_err(|e| e.to_string())?;
  secure_set(
    format!("shadowtalk.local_session.{}", email),
    payload,
  )
  .map(|()| true)
  .map_err(|e| e.to_string())
}

#[tauri::command]
async fn local_sign_out() -> Result<bool, String> {
  secure_clear().map(|()| true).map_err(|e| e.to_string())
}

#[tauri::command]
async fn local_has_credentials() -> Result<bool, String> {
  let keys = secure_get_all_keys().map_err(|e| e.to_string())?;
  Ok(keys
    .into_iter()
    .any(|k| k.starts_with("shadowtalk.local_session.")))
}

#[tauri::command]
async fn local_preferred_login() -> Result<String, String> {
  Ok("credentials".to_owned())
}

#[tauri::command]
async fn local_biometric(_reason: Option<String>) -> Result<bool, String> {
  Ok(false)
}
