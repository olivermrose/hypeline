use std::collections::{HashMap, HashSet};

use futures::TryStreamExt;
use serde::Serialize;
use tauri::State;
use tauri::async_runtime::Mutex;
use twitch_api::types::{Collection, EmoteAnimationSetting, UserId};

use crate::AppState;
use crate::error::Error;

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
