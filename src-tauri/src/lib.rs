mod ssh;

use std::sync::Arc;
use tokio::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .manage(Arc::new(Mutex::new(ssh::SshManager::new())) as ssh::SshState)
        .invoke_handler(tauri::generate_handler![
            ssh::ssh_connect,
            ssh::ssh_disconnect,
            ssh::ssh_connection_status,
            ssh::ssh_list_skills,
            ssh::ssh_read_skill,
            ssh::ssh_write_skill,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
