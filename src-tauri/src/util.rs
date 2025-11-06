use std::sync::LazyLock;

use regex::Regex;
use serde::Serialize;

use crate::error::Error;

#[derive(Serialize)]
pub struct Seo {
    title: Option<String>,
    description: Option<String>,
    image: Option<String>,
}

static TITLE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<title[^>]*>([^<]+)</title>"#).unwrap());
static DESC_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<meta[^>]*name="description"[^>]*content="([^"]+)""#).unwrap());

static OG_TITLE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<meta[^>]*property="og:title"[^>]*content="([^"]+)""#).unwrap());
static OG_DESC_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r#"<meta[^>]*property="og:description"[^>]*content="([^"]+)""#).unwrap()
});
static OG_IMAGE_RE: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r#"<meta[^>]*property="og:image"[^>]*content="([^"]+)""#).unwrap());

#[tauri::command]
pub async fn extract_seo(url: String) -> Result<Option<Seo>, Error> {
    let res = reqwest::get(url).await?;
    let body = res.text().await?;

    Ok(Some(Seo {
        title: TITLE_RE
            .captures(&body)
            .or_else(|| OG_TITLE_RE.captures(&body))
            .and_then(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .or(None),
        description: DESC_RE
            .captures(&body)
            .or_else(|| OG_DESC_RE.captures(&body))
            .and_then(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .or(None),
        image: OG_IMAGE_RE
            .captures(&body)
            .and_then(|cap| cap.get(1).map(|m| m.as_str().to_string()))
            .or(None),
    }))
}
