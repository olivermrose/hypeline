use serde::Deserialize;
use sysinfo::System;
use tauri::{AppHandle, Emitter, Manager, async_runtime};
use tauri_plugin_cache::CacheExt;
use tracing::Instrument;

use crate::HTTP;
use crate::error::Error;
use crate::irc::message::{IrcMessage, ServerMessage};

#[derive(Debug, Deserialize)]
struct RecentMessages {
    #[serde(default)]
    messages: Vec<String>,
}

#[tracing::instrument(skip(app_handle))]
#[tauri::command]
pub async fn fetch_recent_messages(app_handle: AppHandle, channel: String, limit: u32) {
    const BASE_URL: &str = "https://recent-messages.robotty.de/api/v2/recent-messages";

    // Return early to prevent wakeups
    if limit == 0 {
        tracing::debug!("History limit is 0, skipping request");
        return;
    }

    async_runtime::spawn(
        async move {
            let response: RecentMessages = HTTP
                .get(format!("{BASE_URL}/{channel}?limit={limit}",))
                .send()
                .await?
                .json()
                .await?;

            tracing::info!("Fetched {} recent messages", response.messages.len());

            let server_messages: Vec<_> = response
                .messages
                .into_iter()
                .filter_map(|msg| {
                    let irc_message = match IrcMessage::parse(&msg) {
                        Ok(msg) => msg,
                        Err(err) => {
                            tracing::warn!(%err, "Failed to parse IRC message");
                            return None;
                        }
                    };

                    match ServerMessage::try_from(irc_message) {
                        Ok(server_msg) => Some(server_msg),
                        Err(err) => {
                            tracing::warn!(%err, "Failed to convert to ServerMessage");
                            None
                        }
                    }
                })
                .collect();

            app_handle.emit("recentmessages", server_messages).unwrap();
            Ok::<_, Error>(())
        }
        .in_current_span(),
    );
}

#[tauri::command]
pub fn get_cache_size(app_handle: AppHandle) -> i64 {
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
pub fn get_debug_info(app_handle: AppHandle) -> String {
    use tauri_plugin_os as os;

    let pkg_info = app_handle.package_info();
    let system = app_handle.state::<sysinfo::System>();
    let cpus = system.cpus();

    let app_info = format!("{} v{}", pkg_info.name, pkg_info.version);
    let os_info = format!("OS: {} {}", os::platform(), os::version());

    let chip_info = format!(
        "Chip: {}",
        cpus.first().map(|cpu| cpu.brand()).unwrap_or("unknown")
    );

    let cpu_info = format!("CPU: {} cores ({})", cpus.len(), System::cpu_arch());

    let mem_info = format!(
        "Memory: {} / {}",
        format_bytes(system.used_memory()),
        format_bytes(system.total_memory())
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
