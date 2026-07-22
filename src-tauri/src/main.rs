// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use tauri::Manager;
use tokio::time::timeout;

use crate::secure_store::{secure_clear, secure_get, secure_list, secure_remove, secure_set};
use crate::whatsapp::{ ollama_status, OllamaChatRequest, ChatMessage, OllamaChatResponse, PullProgress, AppState, sidecar_path_from_env_or_default };

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
      app.manage(AppState::new());
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      ollama_status,
      ollama_pull,
      ollama_chat,
      secure_get,
      secure_set,
      secure_remove,
      secure_list,
      secure_clear,
      open_external_url,
      whatsapp_status,
      whatsapp_open_status,
      whatsapp_pair,
      media_tts_speak
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
