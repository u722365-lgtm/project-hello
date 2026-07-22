use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use pbkdf2::pbkdf2_hmac;
use rand_core::RngCore;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::collections::BTreeMap;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SecureListItem {
    pub key: String,
    pub value: String,
    pub service: Option<String>,
    pub account: Option<String>,
}

#[derive(Debug, thiserror::Error)]
pub enum SecureStoreError {
    #[error("not found: {0}")]
    NotFound(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    #[error("crypto error: {0}")]
    Crypto(String),
    #[error("bad input: {0}")]
    BadInput(String),
}

pub type SecureResult<T> = Result<T, SecureStoreError>;

#[derive(Clone)]
pub struct SecureFileStore {
    path: PathBuf,
    cipher: Aes256Gcm,
}

impl SecureFileStore {
    const FILE: &'static str = "secure-store.json";
    const LEGACY_FILE: &'static str = "secure-store.enc";
    const PBKDF2_ITERATIONS: u32 = 120_000;
    const SALT_LEN: usize = 16;
    const NONCE_LEN: usize = 12;

    fn app_dir() -> SecureResult<PathBuf> {
        let base = std::env::var("APPDATA")
            .or_else(|_| std::env::var("LOCALAPPDATA"))
            .map_err(|_| SecureStoreError::BadInput("APPDATA/LOCALAPPDATA not set".into()))?;
        let dir: PathBuf = [base, "ShadowTalk AI".into()].iter().collect();
        if !dir.exists() {
            fs::create_dir_all(&dir)?;
        }
        Ok(dir)
    }

    pub fn new() -> SecureResult<Self> {
        let dir = Self::app_dir()?;
        let key = Self::derive_key()?;
        let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| SecureStoreError::Crypto(e.to_string()))?;
        let path = dir.join(Self::FILE);
        Ok(Self { path, cipher })
    }

    fn legacy_path() -> SecureResult<PathBuf> {
        Ok(Self::app_dir()?.join(Self::LEGACY_FILE))
    }

    fn key_material_path() -> PathBuf {
        Self::app_dir().expect("appdir").join(".masterkey")
    }

    fn derive_key() -> SecureResult<[u8; 32]> {
        let km_path = Self::key_material_path();
        let mut salt = [0u8; Self::SALT_LEN];
        let mut key = [0u8; 32];

        if km_path.exists() {
            let data = fs::read(&km_path)?;
            let len = data.len();
            if len >= Self::SALT_LEN + 32 {
                salt.copy_from_slice(&data[..Self::SALT_LEN]);
                key.copy_from_slice(&data[Self::SALT_LEN..Self::SALT_LEN + 32]);
                return Ok(key);
            }
            if !data.is_empty() {
                let n = Self::SALT_LEN.min(len);
                salt[..n].copy_from_slice(&data[..n]);
            }
        } else {
            OsRng.fill_bytes(&mut salt);
        }

        let secret = std::env::var("USERNAME").unwrap_or_else(|_| "shadowtalk".into());
        pbkdf2_hmac::<Sha256>(secret.as_bytes(), &salt, Self::PBKDF2_ITERATIONS, &mut key);

        if !km_path.exists() {
            let mut file = fs::File::create(&km_path)?;
            file.write_all(&salt)?;
            file.write_all(&key)?;
        }
        Ok(key)
    }

    fn make_nonce(random: bool, label: Option<&str>) -> [u8; Self::NONCE_LEN] {
        let mut n = [0u8; Self::NONCE_LEN];
        if random {
            OsRng.fill_bytes(&mut n);
        } else if let Some(l) = label {
            use sha2::Digest;
            let h = Sha256::digest(l.as_bytes());
            n.copy_from_slice(&h[..Self::NONCE_LEN]);
        }
        n
    }

    fn encrypt(&self, plain: &str) -> SecureResult<String> {
        let nonce = Self::make_nonce(true, None);
        let ct = self
            .cipher
            .encrypt(Nonce::from_slice(&nonce), plain.as_bytes())
            .map_err(|e| SecureStoreError::Crypto(e.to_string()))?;
        let mut out = Vec::with_capacity(1 + nonce.len() + ct.len());
        out.push(0);
        out.extend_from_slice(&nonce);
        out.extend_from_slice(&ct);
        Ok(BASE64.encode(out))
    }

    fn decrypt(&self, data: &str) -> SecureResult<String> {
        let raw = BASE64
            .decode(data)
            .map_err(|_| SecureStoreError::BadInput("invalid base64".into()))?;
        if raw.first() != Some(&0) {
            return Err(SecureStoreError::BadInput(
                "legacy plain text no longer supported".into(),
            ));
        }
        if raw.len() < 1 + Self::NONCE_LEN + 1 {
            return Err(SecureStoreError::BadInput("truncated ciphertext".into()));
        }
        let nonce = &raw[1..1 + Self::NONCE_LEN];
        let ct = &raw[1 + Self::NONCE_LEN..];
        let pt = self
            .cipher
            .decrypt(Nonce::from_slice(nonce), ct)
            .map_err(|e| SecureStoreError::Crypto(e.to_string()))?;
        String::from_utf8(pt).map_err(|e| SecureStoreError::Crypto(e.to_string()))
    }
}

fn load(store: &SecureFileStore) -> SecureResult<BTreeMap<String, SecureListItem>> {
    if !store.path.exists() {
        return migrate_legacy(store);
    }
    let raw = fs::read_to_string(&store.path)?;
    let payload: Vec<SecureListItem> = serde_json::from_str(&raw)?;
    let mut map = BTreeMap::new();
    for item in payload {
        let plain = store.decrypt(&item.value)?;
        let mut it = item.clone();
        it.value = plain;
        map.insert(it.key.clone(), it);
    }
    Ok(map)
}

fn save(
    store: &SecureFileStore,
    items: &BTreeMap<String, SecureListItem>,
) -> SecureResult<()> {
    let list: Vec<SecureListItem> = items
        .values()
        .cloned()
        .map(|mut it| {
            it.value = store.encrypt(&it.value).expect("encrypt");
            it
        })
        .collect();
    let tmp = store.path.with_extension("tmp");
    {
        let mut f = fs::File::create(&tmp)?;
        f.write_all(serde_json::to_string_pretty(&list)?.as_bytes())?;
        f.sync_all()?;
    }
    fs::rename(&tmp, &store.path)?;
    Ok(())
}

fn migrate_legacy(store: &SecureFileStore) -> SecureResult<BTreeMap<String, SecureListItem>> {
    let legacy = match SecureFileStore::legacy_path() {
        Ok(p) if p.exists() => p,
        _ => return Ok(BTreeMap::new()),
    };
    let mut migrated = BTreeMap::new();
    let raw = fs::read(&legacy)?;
    for (i, chunk) in raw.chunks(64).enumerate() {
        let key = format!("#legacy-{i}");
        migrated.insert(
            key.clone(),
            SecureListItem {
                key,
                value: BASE64.encode(chunk),
                service: Some("legacy-migration".into()),
                account: None,
            },
        );
    }
    if !migrated.is_empty() {
        let _ = save(store, &migrated);
        let _ = fs::rename(legacy, legacy.with_extension("bak"));
    }
    Ok(migrated)
}

pub fn secure_get(key: String) -> SecureResult<Option<String>> {
    let store = SecureFileStore::new()?;
    let items = load(&store)?;
    Ok(items.get(&key).map(|it| it.value.clone()))
}

pub fn secure_set(key: String, value: String) -> SecureResult<()> {
    let store = SecureFileStore::new()?;
    let mut items = load(&store)?;
    items.insert(
        key.clone(),
        SecureListItem {
            key,
            value,
            service: None,
            account: None,
        },
    );
    save(&store, &items)
}

pub fn secure_remove(key: String) -> SecureResult<()> {
    let store = SecureFileStore::new()?;
    let mut items = load(&store)?;
    if items.remove(&key).is_none() {
        return Err(SecureStoreError::NotFound(key));
    }
    save(&store, &items).map_err(|e| e.into())
}

pub fn secure_clear() -> SecureResult<()> {
    let store = SecureFileStore::new()?;
    save(&store, &BTreeMap::new())
}

pub fn secure_get_all_keys() -> SecureResult<Vec<String>> {
    let store = SecureFileStore::new()?;
    let items = load(&store)?;
    Ok(items.keys().cloned().collect())
}
