use anyhow::anyhow;
use serde::Serialize;
use serde_json::json;
use tauri::async_runtime::{self, Mutex};
use tauri::{AppHandle, Emitter, State};
use twitch_api::eventsub::EventType;
use twitch_api::helix::chat::BadgeSet;
use twitch_api::helix::streams::Stream;

use super::channels::get_stream;
use super::users::{get_user_from_login, User};
use crate::emotes::{fetch_user_emotes, EmoteMap};
use crate::error::Error;
use crate::providers::recent_messages::get_recent_messages;
use crate::providers::twitch::{fetch_channel_badges, fetch_global_badges};
use crate::AppState;

#[derive(Serialize)]
pub struct JoinedChannel {
    id: String,
    user: User,
    stream: Option<Stream>,
    emotes: EmoteMap,
    badges: Vec<BadgeSet>,
}

#[tauri::command]
pub async fn join(
    app: AppHandle,
    state: State<'_, Mutex<AppState>>,
    login: String,
    history_limit: u32,
) -> Result<JoinedChannel, Error> {
    let (helix, token, irc, eventsub) = {
        let state = state.lock().await;

        let token = state
            .token
            .as_ref()
            .ok_or_else(|| Error::Generic(anyhow!("Access token not set")))?;

        let Some(irc) = state.irc.clone() else {
            return Err(Error::Generic(anyhow!("No IRC connection")));
        };

        (
            state.helix.clone(),
            token.clone(),
            irc,
            state.eventsub.clone(),
        )
    };

    let user = get_user_from_login(state.clone(), login)
        .await?
        .expect("user not found");

    let broadcaster_id = user.data.id.as_str();
    let login = user.data.login.to_string();

    let (stream, emotes, mut global_badges, channel_badges) = tokio::try_join!(
        get_stream(state.clone(), user.data.id.to_string()),
        fetch_user_emotes(broadcaster_id),
        fetch_global_badges(&helix, &token),
        fetch_channel_badges(&helix, &token, login),
    )?;

    let login = user.data.login.clone();
    let login_query = login.clone();

    async_runtime::spawn(async move {
        let recent_messages = get_recent_messages(login_query.to_string(), history_limit)
            .await
            .unwrap_or_default();

        app.emit("recentmessages", recent_messages)
    });

    global_badges.extend(channel_badges);

    if let Some(eventsub) = eventsub {
        eventsub.subscribe_all(
            login.as_str(),
            &[(
                EventType::ChannelModerate,
                &json!({ "broadcaster_user_id": broadcaster_id, "moderator_user_id": token.user_id }),
            )],
        ).await?;
    }

    irc.join(login.to_string());

    Ok(JoinedChannel {
        id: broadcaster_id.to_string(),
        user,
        stream,
        emotes,
        badges: global_badges,
    })
}

#[tauri::command]
pub async fn leave(state: State<'_, Mutex<AppState>>, channel: String) -> Result<(), Error> {
    let state = state.lock().await;

    if let Some(eventsub) = state.eventsub.clone() {
        eventsub.unsubscribe_all(&channel).await?;
    }

    if let Some(ref irc) = state.irc {
        irc.part(channel);
    }

    Ok(())
}

#[tauri::command]
pub async fn send_message(
    state: State<'_, Mutex<AppState>>,
    content: String,
    broadcaster_id: String,
    reply_id: Option<String>,
) -> Result<(), Error> {
    let state = state.lock().await;

    if state.token.is_none() {
        return Err(Error::Generic(anyhow!("Access token not set")));
    }

    let token = state.token.as_ref().unwrap();
    let user_id = token.user_id.clone();

    if let Some(reply_id) = reply_id {
        state
            .helix
            .send_chat_message_reply(&broadcaster_id, user_id, &reply_id, content.as_str(), token)
            .await?;
    } else {
        state
            .helix
            .send_chat_message(&broadcaster_id, user_id, content.as_str(), token)
            .await?;
    }

    Ok(())
}
