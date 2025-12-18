use std::collections::HashMap;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

use anyhow::anyhow;
use futures::future::join_all;
use futures::{SinkExt, StreamExt};
use serde::Deserialize;
use serde_json::json;
use tokio::sync::{Mutex, mpsc};
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;
use tracing::Instrument;

use crate::error::Error;

const SEVENTV_WS_URI: &str = "wss://events.7tv.io/v3";

#[derive(Deserialize)]
struct WebSocketMessage {
    op: u8,
    d: serde_json::Value,
}

pub struct SeventTvClient {
    session_id: Arc<Mutex<Option<String>>>,
    subscriptions: Arc<Mutex<HashMap<String, serde_json::Value>>>,
    sender: mpsc::UnboundedSender<serde_json::Value>,
    connected: AtomicBool,
    message_tx: mpsc::UnboundedSender<Message>,
    message_rx: Arc<Mutex<Option<mpsc::UnboundedReceiver<Message>>>>,
}

impl SeventTvClient {
    pub fn new() -> (mpsc::UnboundedReceiver<serde_json::Value>, Self) {
        let (sender, receiver) = mpsc::unbounded_channel::<serde_json::Value>();
        let (message_tx, message_rx) = mpsc::unbounded_channel();

        let client = Self {
            subscriptions: Arc::new(Mutex::new(HashMap::new())),
            session_id: Arc::new(Mutex::new(None)),
            sender,
            connected: AtomicBool::default(),
            message_tx,
            message_rx: Arc::new(Mutex::new(Some(message_rx))),
        };

        (receiver, client)
    }

    #[tracing::instrument(name = "7tv_connect", skip_all)]
    pub async fn connect(self: Arc<Self>) -> Result<(), Error> {
        let this = Arc::clone(&self);

        let mut message_rx = {
            let mut guard = this.message_rx.lock().await;

            guard
                .take()
                .ok_or_else(|| Error::Generic(anyhow!("Message receiver already taken")))?
        };

        tokio::spawn(async move {
            loop {
				tracing::info!("Connecting to 7TV Event API");

                let mut stream = match connect_async(SEVENTV_WS_URI).await {
                    Ok((stream, _)) => stream,
                    Err(err) => {
						tracing::error!(%err, "Failed to connect to 7TV Event API");
						return Err::<(), _>(Error::WebSocket(err))
					},
                };

				tracing::info!("Connected to 7TV Event API");

                {
                    let session_id = this.session_id.lock().await;

                    if let Some(id) = &*session_id {
                        tracing::info!(%id, "Resuming 7TV session");

                        let payload = json!({
                            "op": 34,
                            "d": {
                                "session_id": id
                            }
                        });

                        if let Err(err) = stream.send(Message::Text(payload.to_string().into())).await {
                             tracing::error!(%err, "Error sending resume message");
                        }
                    }
                }

                self.connected.store(true, Ordering::Relaxed);

                'recv: loop {
                    let this = Arc::clone(&this);

                    tokio::select! {
                        Some(data) = message_rx.recv() => {
                            if let Err(err) = stream.send(data).await {
                                tracing::error!(%err, "Error sending message");
                                break 'recv;
                            }
                        }
                        Some(Ok(message)) = stream.next() => {
                            match message {
                                Message::Text(text) => {
                                    if let Ok(msg) = serde_json::from_str::<WebSocketMessage>(&text) {
                                        match msg.op {
                                            0 => {
                                                if let Err(err) = this.sender.send(msg.d) {
                                                    tracing::error!(%err, "Error sending payload");
                                                }
                                            }
                                            1 => {
                                                if let Some(id) = msg.d.get("session_id").and_then(|v| v.as_str()) {
                                                    let mut session = this.session_id.lock().await;
                                                    *session = Some(id.to_string());

                                                    tracing::info!(%id, "Event API session id stored");
                                                }
                                            }
											7 => {
												tracing::info!(payload = ?msg.d, "End of stream reached");

												if let Some(code) = msg.d.get("code").and_then(|v| v.as_u64())
													&& matches!(code, 4000 | 4006 | 4008)
												{
													tracing::warn!("Resuming Event API session");
													break 'recv;
												}
											}
                                            _ => {}
                                        }
                                    }
                                }
                                Message::Close(cf) => {
									if let Some(frame) = cf {
										tracing::warn!(%frame, "Event API connection closed");
									}

                                    this.connected.store(false, Ordering::Relaxed);
                                    break 'recv;
                                }
                                _ => (),
                            }
                        }
                    }
                }
            }
        }.in_current_span());

        Ok(())
    }

    pub fn connected(&self) -> bool {
        self.connected.load(Ordering::Relaxed)
    }

    #[tracing::instrument(name = "7tv_subscribe", skip(self, condition), fields(%condition))]
    pub async fn subscribe(&self, channel: &str, event: &str, condition: &serde_json::Value) {
        let payload = json!({
            "op": 35,
            "d": {
                "type": event,
                "condition": condition
            }
        });

        match self
            .message_tx
            .send(Message::Text(payload.to_string().into()))
        {
            Ok(_) => {
                let mut subscriptions = self.subscriptions.lock().await;
                subscriptions.insert(format!("{channel}:{event}"), condition.clone());

                tracing::trace!("Subscription created");
            }
            Err(err) => {
                tracing::error!(%err, "Failed to send subscription message");
            }
        }
    }

    pub async fn unsubscribe(&self, channel: &str, event: &str) {
        let mut subscriptions = self.subscriptions.lock().await;

        if let Some(condition) = subscriptions.remove(&format!("{channel}:{event}")) {
            let payload = json!({
                "op": 36,
                "d": {
                    "type": event,
                    "condition": condition
                }
            });

            let _ = self
                .message_tx
                .send(Message::Text(payload.to_string().into()));
        }
    }

    pub async fn unsubscribe_all(&self, channel: &str) {
        let prefix = format!("{channel}:");

        let events = {
            let subscriptions = self.subscriptions.lock().await;

            subscriptions
                .keys()
                .filter(|k| k.starts_with(&prefix))
                .map(|k| k.strip_prefix(&prefix).unwrap().to_string())
                .collect::<Vec<_>>()
        };

        let futures = events.iter().map(|event| self.unsubscribe(channel, event));

        join_all(futures).await;
    }
}
