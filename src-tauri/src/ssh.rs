use russh::client;
use russh_keys::key::PublicKey;
use russh_sftp::client::SftpSession;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

// ---------- Types ----------

#[derive(Debug, Serialize, Clone)]
pub struct ConnectionInfo {
    pub connected: bool,
    pub host: String,
    pub remote_path: String,
}

#[derive(Debug, Serialize)]
pub struct RemoteSkillInfo {
    pub name: String,
    pub has_skill_md: bool,
    pub file_count: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RemoteFileEntry {
    pub path: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct RemoteSkillBundle {
    pub files: Vec<RemoteFileEntry>,
}

// ---------- SSH Client Handler ----------

struct ClientHandler;

#[async_trait::async_trait]
impl client::Handler for ClientHandler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &PublicKey,
    ) -> Result<bool, Self::Error> {
        // Accept all host keys (for desktop app use)
        Ok(true)
    }
}

// ---------- SSH Manager ----------

pub struct SshManager {
    session: Option<client::Handle<ClientHandler>>,
    sftp: Option<SftpSession>,
    info: Option<ConnectionInfo>,
}

impl SshManager {
    pub fn new() -> Self {
        SshManager {
            session: None,
            sftp: None,
            info: None,
        }
    }
}

pub type SshState = Arc<Mutex<SshManager>>;

// ---------- Text file extensions ----------

const TEXT_EXTENSIONS: &[&str] = &[
    "md", "json", "yaml", "yml", "toml", "py", "sh", "js", "ts", "txt", "cfg", "ini",
];

fn is_text_file(name: &str) -> bool {
    name.rsplit('.')
        .next()
        .map(|ext| TEXT_EXTENSIONS.contains(&ext))
        .unwrap_or(false)
}

// ---------- Tauri Commands ----------

#[tauri::command]
pub async fn ssh_connect(
    host: String,
    port: u16,
    user: String,
    key_path: String,
    remote_path: String,
    state: tauri::State<'_, SshState>,
) -> Result<ConnectionInfo, String> {
    let mut manager = state.lock().await;

    // Disconnect existing session if any
    if manager.session.is_some() {
        manager.sftp = None;
        manager.session = None;
        manager.info = None;
    }

    // Load SSH key
    let key_pair = russh_keys::load_secret_key(&key_path, None)
        .map_err(|e| format!("Failed to load SSH key: {e}"))?;

    // Build SSH config
    let config = Arc::new(client::Config::default());

    // Connect
    let addr = format!("{}:{}", host, port);
    let mut session = client::connect(config, &addr, ClientHandler)
        .await
        .map_err(|e| format!("SSH connection failed: {e}"))?;

    // Authenticate
    let auth_result = session
        .authenticate_publickey(&user, Arc::new(key_pair))
        .await
        .map_err(|e| format!("SSH auth failed: {e}"))?;

    if !auth_result {
        return Err("SSH authentication failed".into());
    }

    // Open SFTP channel
    let channel = session
        .channel_open_session()
        .await
        .map_err(|e| format!("Failed to open channel: {e}"))?;

    channel
        .request_subsystem(true, "sftp")
        .await
        .map_err(|e| format!("Failed to request SFTP: {e}"))?;

    let sftp = SftpSession::new(channel.into_stream())
        .await
        .map_err(|e| format!("Failed to init SFTP: {e}"))?;

    let info = ConnectionInfo {
        connected: true,
        host: host.clone(),
        remote_path: remote_path.clone(),
    };

    manager.session = Some(session);
    manager.sftp = Some(sftp);
    manager.info = Some(info.clone());

    Ok(info)
}

#[tauri::command]
pub async fn ssh_disconnect(state: tauri::State<'_, SshState>) -> Result<(), String> {
    let mut manager = state.lock().await;
    manager.sftp = None;
    if let Some(session) = manager.session.take() {
        let _ = session
            .disconnect(russh::Disconnect::ByApplication, "", "en")
            .await;
    }
    manager.info = None;
    Ok(())
}

#[tauri::command]
pub async fn ssh_connection_status(
    state: tauri::State<'_, SshState>,
) -> Result<Option<ConnectionInfo>, String> {
    let manager = state.lock().await;
    Ok(manager.info.clone())
}

#[tauri::command]
pub async fn ssh_list_skills(state: tauri::State<'_, SshState>) -> Result<Vec<RemoteSkillInfo>, String> {
    let manager = state.lock().await;
    let sftp = manager
        .sftp
        .as_ref()
        .ok_or("Not connected")?;
    let remote_path = manager
        .info
        .as_ref()
        .map(|i| i.remote_path.clone())
        .unwrap_or_default();

    let entries: Vec<_> = sftp
        .read_dir(&remote_path)
        .await
        .map_err(|e| format!("Failed to list remote skills: {e}"))?
        .collect();

    let mut skills = Vec::new();
    for entry in entries {
        let name = entry.file_name();
        if name.starts_with('.') {
            continue;
        }
        // Check if it's a directory by trying to read it
        let skill_path = format!("{}/{}", remote_path, name);
        if let Ok(sub_entries) = sftp.read_dir(&skill_path).await {
            let sub_vec: Vec<_> = sub_entries.collect();
            let has_skill_md = sub_vec.iter().any(|e| e.file_name() == "SKILL.md");
            let file_count = sub_vec.len() as u32;
            skills.push(RemoteSkillInfo {
                name,
                has_skill_md,
                file_count,
            });
        }
    }

    skills.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(skills)
}

#[tauri::command]
pub async fn ssh_read_skill(
    skill_name: String,
    state: tauri::State<'_, SshState>,
) -> Result<RemoteSkillBundle, String> {
    let manager = state.lock().await;
    let sftp = manager.sftp.as_ref().ok_or("Not connected")?;
    let remote_path = manager
        .info
        .as_ref()
        .map(|i| i.remote_path.clone())
        .unwrap_or_default();

    let skill_dir = format!("{}/{}", remote_path, skill_name);
    let mut files = Vec::new();
    read_dir_recursive(sftp, &skill_dir, "", &mut files).await?;
    Ok(RemoteSkillBundle { files })
}

async fn read_dir_recursive(
    sftp: &SftpSession,
    base_dir: &str,
    relative_prefix: &str,
    result: &mut Vec<RemoteFileEntry>,
) -> Result<(), String> {
    let entries: Vec<_> = sftp
        .read_dir(base_dir)
        .await
        .map_err(|e| format!("Failed to read dir {base_dir}: {e}"))?
        .collect();

    for entry in entries {
        let name = entry.file_name();
        if name == "." || name == ".." {
            continue;
        }

        let full_path = format!("{}/{}", base_dir, name);
        let rel_path = if relative_prefix.is_empty() {
            name.clone()
        } else {
            format!("{}/{}", relative_prefix, name)
        };

        // Try to read as directory first
        if let Ok(_sub) = sftp.read_dir(&full_path).await {
            Box::pin(read_dir_recursive(sftp, &full_path, &rel_path, result)).await?;
        } else if is_text_file(&name) {
            // Read file content
            match sftp.read(&full_path).await {
                Ok(data) => {
                    if let Ok(content) = String::from_utf8(data) {
                        result.push(RemoteFileEntry {
                            path: rel_path,
                            content,
                        });
                    }
                }
                Err(e) => {
                    log::warn!("Failed to read {full_path}: {e}");
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn ssh_write_skill(
    skill_name: String,
    files: Vec<RemoteFileEntry>,
    state: tauri::State<'_, SshState>,
) -> Result<(), String> {
    let manager = state.lock().await;
    let sftp = manager.sftp.as_ref().ok_or("Not connected")?;
    let remote_path = manager
        .info
        .as_ref()
        .map(|i| i.remote_path.clone())
        .unwrap_or_default();

    let skill_dir = format!("{}/{}", remote_path, skill_name);

    // Ensure skill directory exists
    let _ = sftp.create_dir(&skill_dir).await;

    for file in &files {
        let full_path = format!("{}/{}", skill_dir, file.path);

        // Ensure parent directories exist
        if let Some(parent_end) = full_path.rfind('/') {
            let parent = &full_path[..parent_end];
            // Try to create parent dirs (ignore errors if they already exist)
            let _ = create_dirs_recursive(sftp, parent).await;
        }

        sftp.write(&full_path, file.content.as_bytes())
            .await
            .map_err(|e| format!("Failed to write {}: {e}", file.path))?;
    }

    Ok(())
}

async fn create_dirs_recursive(sftp: &SftpSession, path: &str) -> Result<(), String> {
    // Try creating the full path first
    if sftp.create_dir(path).await.is_ok() {
        return Ok(());
    }
    // If that fails, try creating parent first
    if let Some(parent_end) = path.rfind('/') {
        let parent = &path[..parent_end];
        if !parent.is_empty() {
            let _ = Box::pin(create_dirs_recursive(sftp, parent)).await;
        }
    }
    sftp.create_dir(path)
        .await
        .map_err(|e| format!("Failed to create dir {path}: {e}"))
}
