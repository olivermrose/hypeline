use std::collections::{HashMap, HashSet};

use anyhow::anyhow;
use futures::TryStreamExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{State, async_runtime};
use tokio::sync::Mutex;
use twitch_api::eventsub::EventType;
use twitch_api::twitch_oauth2::{AccessToken, UserToken};
use twitch_api::types::{Collection, EmoteAnimationSetting, UserId};

use crate::AppState;
use crate::error::Error;
use crate::seventv::send_presence;

#[derive(Debug, Deserialize)]
pub struct Response<T> {
    pub data: T,
}

pub fn get_access_token(state: &AppState) -> Result<&UserToken, Error> {
    state.token.as_ref().ok_or_else(|| {
        tracing::error!("Attempted to retrieve access token but no token is set");
        Error::Generic(anyhow!("Access token not set"))
    })
}

#[derive(Clone, Serialize)]
pub struct TokenInfo {
    user_id: String,
    access_token: String,
}

pub async fn set_access_token(
    state: State<'_, Mutex<AppState>>,
    token: String,
) -> Option<TokenInfo> {
    let mut state = state.lock().await;

    state.token = UserToken::from_token(&state.helix, AccessToken::from(token))
        .await
        .ok();

    if let Some(ref token) = state.token {
        let raw_token = token.access_token.as_str();
        tracing::debug!("Set access token to {}", raw_token);

        Some(TokenInfo {
            user_id: token.user_id.to_string(),
            access_token: raw_token.to_string(),
        })
    } else {
        None
    }
}

#[tracing::instrument(skip(state, is_mod))]
#[tauri::command]
pub async fn join(
    state: State<'_, Mutex<AppState>>,
    id: String,
    set_id: Option<String>,
    login: String,
    is_mod: bool,
) -> Result<(), Error> {
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
                (Ev::ChannelUpdate, &ch_cond),
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

        if let Some(ref set_id) = set_id {
            seventv
                .subscribe("emote_set.*", &json!({ "object_id": set_id }))
                .await;
        }
    }

    irc.join(login.to_string());

    send_presence(state, id).await?;

    Ok(())
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

#[derive(Serialize)]
pub struct UserEmote {
    set_id: String,
    id: String,
    name: String,
    #[serde(rename = "type")]
    kind: String,
    format: String,
    owner: String,
    owner_profile_picture_url: String,
}

#[tauri::command]
pub async fn get_user_emotes(state: State<'_, Mutex<AppState>>) -> Result<Vec<UserEmote>, Error> {
    let state = state.lock().await;

    let Some(token) = state.token.as_ref() else {
        return Ok(vec![]);
    };

    let emotes: Vec<_> = state
        .helix
        .get_user_emotes(&token.user_id, token)
        .try_collect()
        .await?;

    let owner_ids: HashSet<_> = emotes
        .iter()
        .filter_map(|emote| {
            let id_str = emote.owner_id.as_str();

            if id_str.is_empty() || id_str == "twitch" {
                None
            } else {
                Some(id_str.to_string())
            }
        })
        .collect();

    let owner_users = if owner_ids.is_empty() {
        vec![]
    } else {
        let id_coll: Collection<UserId> = owner_ids.into_iter().collect();

        state
            .helix
            .get_users_from_ids(&id_coll, token)
            .try_collect()
            .await?
    };

    let owner_map: HashMap<_, _> = owner_users
        .into_iter()
        .map(|user| (user.id.clone(), user))
        .collect();

    let user_emotes = emotes
        .into_iter()
        .filter_map(|emote| {
            owner_map.get(&emote.owner_id).map(|owner| {
                let format = if emote.format.contains(&EmoteAnimationSetting::Animated) {
                    "animated"
                } else {
                    "static"
                };

                UserEmote {
                    set_id: emote.emote_set_id.into(),
                    id: emote.id.into(),
                    name: emote.name.clone(),
                    kind: emote.emote_type.clone(),
                    format: format.into(),
                    owner: owner.display_name.to_string(),
                    owner_profile_picture_url: owner.profile_image_url.clone().unwrap_or_default(),
                }
            })
        })
        .collect();

    Ok(user_emotes)
}
