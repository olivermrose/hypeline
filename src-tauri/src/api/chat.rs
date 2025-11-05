use anyhow::anyhow;
use serde::Serialize;
use serde_json::json;
use tauri::{State, async_runtime};
use tokio::sync::Mutex;
use twitch_api::eventsub::EventType;

use super::get_access_token;
use crate::AppState;
use crate::emotes::{Emote, EmoteMap, fetch_user_emotes};
use crate::error::Error;
use crate::providers::seventv::{EmoteSet, fetch_active_emote_set, send_presence};

#[derive(Serialize)]
pub struct JoinedChannel {
    emotes: EmoteMap,
    emote_set: Option<EmoteSet>,
}

#[tracing::instrument(skip(state, is_mod))]
#[tauri::command]
pub async fn join(
    state: State<'_, Mutex<AppState>>,
    id: String,
    login: String,
    is_mod: bool,
) -> Result<JoinedChannel, Error> {
    tracing::info!("Joining {login}");

    let (token, irc, eventsub, seventv) = {
        let state = state.lock().await;
        let token = get_access_token(&state)?;

        let Some(irc) = state.irc.clone() else {
            tracing::error!("No IRC connection");
            return Err(Error::Generic(anyhow!("No IRC connection")));
        };

        (
            token.clone(),
            irc,
            state.eventsub.clone(),
            state.seventv.clone(),
        )
    };

    let (mut emotes, emote_set) =
        tokio::try_join!(fetch_user_emotes(&id), fetch_active_emote_set(&id))?;

    let stv_emotes = match emote_set {
        Some(ref emote_set) => emote_set
            .emotes
            .clone()
            .into_iter()
            .map(Emote::from)
            .collect(),
        None => vec![],
    };

    for emote in stv_emotes {
        emotes.insert(emote.name.clone(), emote);
    }

    if let Some(eventsub) = eventsub {
        let login = login.clone();

        let ch_cond = json!({
            "broadcaster_user_id": id
        });

        let ch_with_user_cond = json!({
            "broadcaster_user_id": id,
            "user_id": token.user_id
        });

        let ch_with_mod_cond = json!({
            "broadcaster_user_id": id,
            "moderator_user_id": token.user_id
        });

        async_runtime::spawn(async move {
            use EventType as Ev;

            let mut events = vec![
                (Ev::ChannelChatUserMessageHold, &ch_with_user_cond),
                (Ev::ChannelChatUserMessageUpdate, &ch_with_user_cond),
                (Ev::ChannelSubscriptionEnd, &ch_cond),
                (Ev::StreamOffline, &ch_cond),
                (Ev::StreamOnline, &ch_cond),
            ];

            if is_mod {
                let mod_events = vec![
                    (Ev::AutomodMessageHold, &ch_with_mod_cond),
                    (Ev::AutomodMessageUpdate, &ch_with_mod_cond),
                    (Ev::ChannelModerate, &ch_with_mod_cond),
                    (Ev::ChannelSuspiciousUserMessage, &ch_with_mod_cond),
                    (Ev::ChannelSuspiciousUserUpdate, &ch_with_mod_cond),
                    (Ev::ChannelUnbanRequestCreate, &ch_with_mod_cond),
                    (Ev::ChannelUnbanRequestResolve, &ch_with_mod_cond),
                    (Ev::ChannelWarningAcknowledge, &ch_with_mod_cond),
                ];

                events.extend(mod_events)
            }

            eventsub.subscribe_all(login.as_str(), events).await
        });
    }

    if let Some(seventv) = seventv {
        let channel_cond = json!({
            "ctx": "channel",
            "platform": "TWITCH",
            "id": id
        });

        seventv.subscribe("cosmetic.create", &channel_cond).await;
        seventv.subscribe("entitlement.create", &channel_cond).await;

        if let Some(ref set) = emote_set {
            seventv
                .subscribe("emote_set.*", &json!({ "object_id": set.id }))
                .await;
        }
    }

    irc.join(login.to_string());

    send_presence(state, id).await?;

    Ok(JoinedChannel { emotes, emote_set })
}

#[tauri::command]
pub async fn leave(state: State<'_, Mutex<AppState>>, channel: String) -> Result<(), Error> {
    tracing::info!("Leaving {channel}");

    let state = state.lock().await;

    if let Some(ref eventsub) = state.eventsub {
        eventsub.unsubscribe_all(&channel).await?;
    }

    if let Some(ref seventv) = state.seventv {
        seventv.unsubscribe().await;
    }

    if let Some(ref irc) = state.irc {
        irc.part(channel);
    }

    Ok(())
}
