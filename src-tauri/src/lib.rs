#![feature(try_blocks)]
#![allow(clippy::result_large_err)]

use std::sync::{Arc, LazyLock};

use eventsub::EventSubClient;
use irc::IrcClient;
use reqwest::header::HeaderMap;
use seventv::SeventTvClient;
use sysinfo::System;
use tauri::async_runtime::{self, Mutex};
use tauri::ipc::Invoke;
use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_cache::{CacheConfig, CacheExt, CompressionMethod};
use tauri_plugin_svelte::ManagerExt;
use twitch_api::HelixClient;
use twitch_api::twitch_oauth2::{AccessToken, UserToken};

mod api;
mod error;
mod eventsub;
mod irc;
mod log;
mod recent_messages;
mod server;
mod seventv;

const CLIENT_ID: &str = "kimne78kx3ncx6brgo4mv6wki5h1ko";

pub static HTTP: LazyLock<reqwest::Client> = LazyLock::new(|| {
    let mut headers = HeaderMap::new();
    headers.insert("Client-Id", CLIENT_ID.parse().unwrap());
    headers.insert("Content-Type", "application/json".parse().unwrap());

    reqwest::Client::builder()
        .default_headers(headers)
        .build()
        .unwrap()
});

pub struct AppState {
    helix: HelixClient<'static, reqwest::Client>,
    token: Option<UserToken>,
    irc: Option<IrcClient>,
    eventsub: Option<Arc<EventSubClient>>,
    seventv: Option<Arc<SeventTvClient>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            helix: HelixClient::new(),
            token: None,
            irc: None,
            eventsub: None,
            seventv: None,
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut sys = sysinfo::System::new_all();
    sys.refresh_all();

    let mut builder = tauri::Builder::default();
    let mut state = AppState::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _, _| {
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }));
    }

    builder
        .plugin(tauri_plugin_cache::init_with_config(CacheConfig {
            compression_level: Some(8),
            compression_method: Some(CompressionMethod::Lzma2),
            ..Default::default()
        }))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_svelte::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            let log_guard = log::init_tracing(app);
            let app_handle = app.handle();

            async_runtime::block_on(async {
                let stored_token = app_handle
                    .svelte()
                    .get_raw("settings", "user")
                    .and_then(|user| user["token"].as_str().map(|t| t.to_string()));

                let access_token = if let Some(token) = stored_token {
                    UserToken::from_token(&state.helix, AccessToken::from(token))
                        .await
                        .ok()
                } else {
                    None
                };

                if let Some(ref token) = access_token {
                    tracing::debug!(
                        token = token.access_token.as_str(),
                        "Using access token from storage",
                    );
                }

                state.token = access_token;
            });

            app.manage(Mutex::new(state));
            app.manage(log_guard);
            app.manage(sys);

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                let app_handle = window.app_handle();

                match window.label() {
                    "main" => {
                        if let Some(settings_win) =
                            window.app_handle().get_webview_window("settings")
                        {
                            settings_win
                                .close()
                                .expect("failed to close settings window");
                        }
                    }
                    "settings" => {
                        app_handle
                            .svelte()
                            .save("settings")
                            .expect("failed to save settings while closing window");
                    }
                    _ => (),
                }
            }
        })
        .invoke_handler(get_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_cache_size(app_handle: AppHandle) -> i64 {
    let cache_path = app_handle.cache().get_cache_file_path();

    match std::fs::metadata(cache_path) {
        Ok(metadata) => {
            let size = metadata.len() as i64;

            // Empty cache files contain an empty object i.e. "{}"
            if size == 2 { 0 } else { size }
        }
        Err(error) => {
            tracing::error!(%error, "Failed to get cache size");
            0
        }
    }
}

fn format_bytes(bytes: u64) -> String {
    let i = ((bytes as f64).ln() / 1024_f64.ln()).floor();

    if i == 0.0 {
        "0 bytes".to_string()
    } else {
        let value = bytes as f64 / 1024_f64.powf(i);
        let unit = ["bytes", "KB", "MB", "GB", "TB"][i as usize];

        format!("{value:.2} {unit}")
    }
}

#[tauri::command]
fn get_debug_info(app_handle: AppHandle) -> String {
    use tauri_plugin_os as os;

    let pkg_info = app_handle.package_info();
    let sys = app_handle.state::<sysinfo::System>();
    let cpus = sys.cpus();

    let app_info = format!("{} v{}", pkg_info.name, pkg_info.version);
    let os_info = format!("OS: {} {}", os::platform(), os::version());

    let chip_info = format!(
        "Chip: {}",
        cpus.first().map(|cpu| cpu.brand()).unwrap_or("unknown")
    );

    let cpu_info = format!("CPU: {} cores ({})", cpus.len(), System::cpu_arch());

    let mem_info = format!(
        "Memory: {} / {}",
        format_bytes(sys.used_memory()),
        format_bytes(sys.total_memory())
    );

    let wv_info = format!(
        "WebView: {} {}",
        if std::env::consts::FAMILY == "windows" {
            "WebView2"
        } else {
            "WebKit"
        },
        tauri::webview_version().unwrap_or_default()
    );

    format!("{app_info}\n{os_info}\n{chip_info}\n{cpu_info}\n{mem_info}\n{wv_info}")
}

fn get_handler() -> impl Fn(Invoke) -> bool {
    tauri::generate_handler![
        api::join,
        api::leave,
        api::rejoin,
        api::get_user_emotes,
        eventsub::connect_eventsub,
        get_cache_size,
        get_debug_info,
        irc::connect_irc,
        log::log,
        recent_messages::fetch_recent_messages,
        server::start_server,
        seventv::connect_seventv,
        seventv::resub_emote_set,
    ]
}
