use tauri::State;
use tauri::async_runtime::Mutex;
use twitch_api::helix::clips::{Clip, get_clips};
use twitch_api::helix::streams::CreatedStreamMarker;

use super::get_access_token;
use crate::AppState;
use crate::error::Error;

#[tauri::command]
pub async fn create_marker(
    state: State<'_, Mutex<AppState>>,
    broadcaster_id: String,
    description: String,
) -> Result<CreatedStreamMarker, Error> {
    let state = state.lock().await;
    let token = get_access_token(&state)?;

    let marker = state
        .helix
        .create_stream_marker(&broadcaster_id, &description, token)
        .await?;

    Ok(marker)
}

#[tauri::command]
pub async fn get_clip(
    state: State<'_, Mutex<AppState>>,
    id: String,
) -> Result<Option<Clip>, Error> {
    let state = state.lock().await;
    let token = get_access_token(&state)?;

    let request = get_clips::GetClipsRequest::clip_ids(vec![id]);
    let mut response = state.helix.req_get(request, token).await?;

    Ok(response.data.pop())
}
