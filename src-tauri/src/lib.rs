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
    .invoke_handler(tauri::generate_handler![ollama_status, ollama_pull, ollama_chat, open_external_url, media_tts_speak])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

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

#[tauri::command]
async fn ollama_status() -> serde_json::Value {
  let client = http_client();
  let health_url = ollama_url("/api/health");
  let tags_url = ollama_url("/api/tags");

  let health = match client.get(&health_url).header("Accept", "application/json").send().await {
    Ok(resp) => resp.status() == reqwest::StatusCode::OK,
    Err(_) => false,
  };

  let mut models = Vec::<String>::new();
  let mut version = None;

  if health {
    if let Ok(resp) = client.get(&tags_url).send().await {
      if resp.status() == reqwest::StatusCode::OK {
        if let Ok(parsed) = resp.json::<OllamaTagsResponse>().await {
          models = parsed.models.into_iter().map(|m| m.name).collect();
        }
      }
    }

    if let Ok(resp) = client.get(ollama_url("/api/version")).send().await {
      if let Ok(parsed) = resp.json::<std::collections::HashMap<String, String>>().await {
        version = parsed.get("version").cloned();
      }
    }
  }

  let active_model = models
    .iter()
    .find(|m| *m == DEFAULT_MODEL || m.starts_with(&format!("{}:", DEFAULT_MODEL)))
    .cloned()
    .unwrap_or_else(|| DEFAULT_MODEL.to_owned());

  serde_json::json!({
    "endpoint": ollama_url(""),
    "ready": health,
    "version": version,
    "models": models,
    "default_model": DEFAULT_MODEL,
    "fallback_model": FALLBACK_MODEL,
    "active_model": active_model,
  })
}

#[tauri::command]
async fn ollama_pull(model: String) -> Result<PullProgress, String> {
  if model.trim().is_empty() {
    return Ok(PullProgress { status: "missing model name".into(), digest: None, total: None, completed: None });
  }
  let client = http_client();
  let url = ollama_url("/api/pull");
  let payload = serde_json::json!({ "name": model, "stream": true });

  match client.post(&url).json(&payload).send().await {
    Ok(resp) if resp.status().is_success() => Ok(PullProgress {
      status: format!("initiated pull for {}", model),
      digest: None,
      total: None,
      completed: None,
    }),
    Ok(resp) => Err(format!("pull failed with status {}", resp.status())),
    Err(e) => Err(format!("pull request failed: {:?}", e)),
  }
}

#[tauri::command]
async fn ollama_chat(req: OllamaChatRequest) -> Result<OllamaChatResponse, String> {
  let model = if req.model.trim().is_empty() { DEFAULT_MODEL.to_owned() } else { req.model.clone() };
  let client = http_client();
  let url = ollama_url("/api/chat");
  let payload = serde_json::json!({
    "model": model,
    "prompt": req.prompt,
    "stream": req.stream.unwrap_or(false),
  });

  let resp = client.post(&url).json(&payload).send().await.map_err(|e| format!("chat request failed: {:?}", e))?;
  if !resp.status().is_success() {
    return Err(format!("ollama responded with status {}", resp.status()));
  }

  let text = resp.text().await.map_err(|e| format!("failed to read response: {:?}", e))?;
  let mut result = OllamaChatResponse {
    model: "".into(),
    message: ChatMessage { role: "assistant".into(), content: "".into() },
    done: true,
  };
  for line in text.lines() {
    let trimmed = line.trim();
    if trimmed.is_empty() { continue; }
    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(trimmed) {
      if let Some(msg) = parsed.get("message") {
        if let Some(content) = msg.get("content").and_then(|v| v.as_str()) {
          result.message = ChatMessage {
            role: msg.get("role").and_then(|v| v.as_str()).unwrap_or("assistant").to_owned(),
            content: content.to_owned(),
          };
        }
      }
    }
  }
  Ok(result)
}

#[tauri::command]
fn open_external_url(url: String) -> Result<(), String> {
  open::that_detached(url).map_err(|e| e.to_string())
}

#[tauri::command]
fn media_tts_speak(_text: String) -> Result<(), String> {
  Ok(())
}
