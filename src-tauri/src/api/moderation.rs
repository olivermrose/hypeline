use serde::Deserialize;
use tauri::State;
use tokio::sync::Mutex;
use twitch_api::helix::chat::{UpdateChatSettingsBody, UpdateChatSettingsRequest};
use twitch_api::helix::moderation::manage_held_automod_messages;

use super::get_access_token;
use crate::AppState;
use crate::error::Error;

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn update_held_message(
    state: State<'_, Mutex<AppState>>,
    message_id: String,
    allow: bool,
) -> Result<(), Error> {
    let state = state.lock().await;
    let token = get_access_token(&state)?;

    let request = manage_held_automod_messages::ManageHeldAutoModMessagesRequest::new();
    let body = manage_held_automod_messages::ManageHeldAutoModMessagesBody::new(
        &token.user_id,
        message_id,
        allow,
    );

    state.helix.req_post(request, body, token).await?;

    tracing::debug!("Updated held message");

    Ok(())
}

#[derive(Debug, Deserialize)]
pub struct ChatSettings {
    unique: Option<bool>,
    emote_only: Option<bool>,
    subscriber_only: Option<bool>,
    follower_only: Option<bool>,
    follower_only_duration: Option<u64>,
    slow_mode: Option<u64>,
}

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn update_chat_settings(
    state: State<'_, Mutex<AppState>>,
    broadcaster_id: String,
    settings: ChatSettings,
) -> Result<(), Error> {
    let state = state.lock().await;
    let token = get_access_token(&state)?;

    let request = UpdateChatSettingsRequest::new(&broadcaster_id, &token.user_id);
    let mut body = UpdateChatSettingsBody::default();

    body.unique_chat_mode = settings.unique;
    body.emote_mode = settings.emote_only;
    body.subscriber_mode = settings.subscriber_only;

    body.follower_mode = settings.follower_only;
    body.follower_mode_duration = settings.follower_only_duration;

    if let Some(duration) = settings.slow_mode {
        if duration == 0 {
            body.slow_mode = Some(false);
        } else {
            body.slow_mode = Some(true);
            body.slow_mode_wait_time = Some(duration);
        }
    }

    state.helix.req_patch(request, body, token).await?;

    tracing::debug!("Updated chat settings");

    Ok(())
}
