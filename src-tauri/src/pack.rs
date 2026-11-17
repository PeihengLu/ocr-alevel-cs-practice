use crate::models::{PackManifest, PackPayload, SqlCheck, SqlQuestion};
use serde_json::Value;
use std::collections::HashMap;
use std::fs::File;
use std::io::{Cursor, Read};
use std::path::Path;
use zip::ZipArchive;

pub fn unpack_plpack_bytes(bytes: &[u8]) -> Result<PackPayload, String> {
    let cursor = Cursor::new(bytes);
    let mut zip = ZipArchive::new(cursor).map_err(|e| format!("Invalid .plpack zip: {e}"))?;
    unpack_zip(&mut zip)
}

pub fn unpack_plpack_path(path: &Path) -> Result<PackPayload, String> {
    let file = File::open(path).map_err(|e| format!("Could not open pack: {e}"))?;
    let mut zip = ZipArchive::new(file).map_err(|e| format!("Invalid .plpack zip: {e}"))?;
    unpack_zip(&mut zip)
}

fn unpack_zip<R: Read + std::io::Seek>(zip: &mut ZipArchive<R>) -> Result<PackPayload, String> {
    let manifest_raw = read_zip_string(zip, "manifest.json")?;
    let manifest_json: Value =
        serde_json::from_str(&manifest_raw).map_err(|e| format!("Invalid manifest.json: {e}"))?;

    let question_ids = manifest_json
        .get("questionIds")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "manifest.questionIds must be a string array".to_string())?
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect::<Vec<_>>();

    let mut questions = Vec::new();
    let mut listed = std::collections::HashSet::new();
    for id in &question_ids {
        let safe = sanitize_path_segment(id)?;
        listed.insert(safe.clone());
        let path = format!("questions/{safe}.json");
        let raw = read_zip_string(zip, &path)
            .map_err(|_| format!("Invalid .plpack: missing {path}"))?;
        let value: Value =
            serde_json::from_str(&raw).map_err(|e| format!("Invalid {path}: {e}"))?;
        questions.push(value);
    }

    let names: Vec<String> = (0..zip.len())
        .filter_map(|i| zip.by_index(i).ok().map(|f| f.name().to_string()))
        .collect();
    for name in names {
        if !name.starts_with("questions/") || !name.ends_with(".json") || name.ends_with('/') {
            continue;
        }
        let stem = name
            .trim_start_matches("questions/")
            .trim_end_matches(".json");
        if listed.contains(stem) {
            continue;
        }
        let raw = read_zip_string(zip, &name)?;
        let value: Value =
            serde_json::from_str(&raw).map_err(|e| format!("Invalid {name}: {e}"))?;
        questions.push(value);
    }

    let mut sql_assets = HashMap::new();
    let sql_names: Vec<String> = (0..zip.len())
        .filter_map(|i| zip.by_index(i).ok().map(|f| f.name().to_string()))
        .collect();
    for name in sql_names {
        if !name.starts_with("sql/") || !name.ends_with(".sql") || name.ends_with('/') {
            continue;
        }
        let ref_name = name
            .trim_start_matches("sql/")
            .trim_end_matches(".sql")
            .to_string();
        sql_assets.insert(ref_name, read_zip_string(zip, &name)?);
    }

    validate_pack_payload(Value::Object({
        let mut map = serde_json::Map::new();
        map.insert("manifest".into(), manifest_json);
        map.insert("questions".into(), Value::Array(questions));
        map.insert(
            "sqlAssets".into(),
            Value::Object(
                sql_assets
                    .into_iter()
                    .map(|(k, v)| (k, Value::String(v)))
                    .collect(),
            ),
        );
        map
    }))
}

pub fn read_sql_catalog(root: &Path) -> Result<PackPayload, String> {
    let manifest_raw = std::fs::read_to_string(root.join("manifest.json"))
        .map_err(|e| format!("SQL catalog missing manifest: {e}"))?;
    let manifest_json: Value =
        serde_json::from_str(&manifest_raw).map_err(|e| format!("Invalid catalog manifest: {e}"))?;
    let question_ids = manifest_json
        .get("questionIds")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "SQL catalog has no manifest.questionIds".to_string())?;

    let mut questions = Vec::new();
    for id_val in question_ids {
        let id = id_val
            .as_str()
            .ok_or_else(|| "manifest.questionIds must be strings".to_string())?;
        let path = root.join("questions").join(format!("{id}.json"));
        let raw = std::fs::read_to_string(&path)
            .map_err(|e| format!("Missing question {id}: {e}"))?;
        questions.push(
            serde_json::from_str(&raw).map_err(|e| format!("Invalid question {id}: {e}"))?,
        );
    }

    let mut sql_assets = HashMap::new();
    let sql_dir = root.join("sql");
    for entry in std::fs::read_dir(&sql_dir).map_err(|e| format!("Missing sql/: {e}"))? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if !name.ends_with(".sql") {
            continue;
        }
        let ref_name = name.trim_end_matches(".sql").to_string();
        let text = std::fs::read_to_string(entry.path()).map_err(|e| e.to_string())?;
        sql_assets.insert(ref_name, text);
    }

    validate_pack_payload(Value::Object({
        let mut map = serde_json::Map::new();
        map.insert("manifest".into(), manifest_json);
        map.insert("questions".into(), Value::Array(questions));
        map.insert(
            "sqlAssets".into(),
            Value::Object(
                sql_assets
                    .into_iter()
                    .map(|(k, v)| (k, Value::String(v)))
                    .collect(),
            ),
        );
        map
    }))
}

fn read_zip_string<R: Read + std::io::Seek>(
    zip: &mut ZipArchive<R>,
    name: &str,
) -> Result<String, String> {
    let mut file = zip
        .by_name(name)
        .map_err(|_| format!("Missing zip entry {name}"))?;
    let mut buf = String::new();
    file.read_to_string(&mut buf)
        .map_err(|e| format!("Could not read {name}: {e}"))?;
    Ok(buf)
}

fn sanitize_path_segment(id: &str) -> Result<String, String> {
    if !id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '_' || c == '-')
    {
        return Err(format!(
            "Invalid id/schemaRef \"{id}\" — use letters, numbers, . _ - only"
        ));
    }
    Ok(id.to_string())
}

pub fn validate_pack_payload(raw: Value) -> Result<PackPayload, String> {
    let obj = raw
        .as_object()
        .ok_or_else(|| "Pack payload must be an object".to_string())?;
    let manifest = validate_manifest(obj.get("manifest").cloned())?;
    let questions_raw = obj
        .get("questions")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "Pack questions must be an array".to_string())?;
    let questions = questions_raw
        .iter()
        .enumerate()
        .map(|(i, q)| validate_question(q, i))
        .collect::<Result<Vec<_>, _>>()?;
    let by_id: std::collections::HashSet<_> = questions.iter().map(|q| q.id.clone()).collect();
    for id in &manifest.question_ids {
        if !by_id.contains(id) {
            return Err(format!("manifest.questionIds references missing question \"{id}\""));
        }
    }
    let sql_assets = validate_sql_assets(obj.get("sqlAssets").cloned())?;
    for q in &questions {
        if !sql_assets.contains_key(&q.schema_ref) {
            return Err(format!(
                "Question \"{}\" schemaRef \"{}\" missing from sqlAssets",
                q.id, q.schema_ref
            ));
        }
    }
    Ok(PackPayload {
        manifest,
        questions,
        sql_assets,
    })
}

fn validate_manifest(raw: Option<Value>) -> Result<PackManifest, String> {
    let obj = raw
        .as_ref()
        .and_then(|v| v.as_object())
        .ok_or_else(|| "manifest.json must be an object".to_string())?;
    let format_version = obj
        .get("formatVersion")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| "Unsupported pack formatVersion".to_string())?;
    if format_version != 1 {
        return Err(format!(
            "Unsupported pack formatVersion {format_version} (expected 1)"
        ));
    }
    let question_ids = obj
        .get("questionIds")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "manifest.questionIds must be a string array".to_string())?
        .iter()
        .map(|v| {
            v.as_str()
                .map(|s| s.to_string())
                .ok_or_else(|| "manifest.questionIds must be a string array".to_string())
        })
        .collect::<Result<Vec<_>, _>>()?;
    let retired_ids = match obj.get("retiredIds") {
        None => None,
        Some(Value::Array(arr)) => Some(
            arr.iter()
                .map(|v| {
                    v.as_str()
                        .map(|s| s.to_string())
                        .ok_or_else(|| "manifest.retiredIds must be a string array".to_string())
                })
                .collect::<Result<Vec<_>, _>>()?,
        ),
        Some(_) => return Err("manifest.retiredIds must be a string array when present".into()),
    };

    Ok(PackManifest {
        format_version: 1,
        pack_id: require_string(obj, "packId")?,
        version: require_string(obj, "version")?,
        title: require_string(obj, "title")?,
        description: optional_string(obj, "description")?,
        created_at: require_string(obj, "createdAt")?,
        min_app_version: require_string(obj, "minAppVersion")?,
        question_ids,
        retired_ids,
        checksum: optional_string(obj, "checksum")?,
    })
}

fn validate_question(raw: &Value, index: usize) -> Result<SqlQuestion, String> {
    let obj = raw
        .as_object()
        .ok_or_else(|| format!("questions[{index}] must be an object"))?;
    let version = obj
        .get("version")
        .and_then(|v| v.as_i64())
        .filter(|v| *v >= 1)
        .ok_or_else(|| format!("questions[{index}].version must be a positive integer"))?;
    let difficulty = require_string(obj, "difficulty")?;
    if !matches!(difficulty.as_str(), "easy" | "medium" | "hard") {
        return Err(format!(
            "questions[{index}].difficulty must be easy|medium|hard"
        ));
    }
    let tags = obj
        .get("tags")
        .and_then(|v| v.as_array())
        .ok_or_else(|| format!("questions[{index}].tags must be a string array"))?
        .iter()
        .map(|v| {
            v.as_str()
                .map(|s| s.to_string())
                .ok_or_else(|| format!("questions[{index}].tags must be a string array"))
        })
        .collect::<Result<Vec<_>, _>>()?;
    let checks_raw = obj
        .get("checks")
        .and_then(|v| v.as_array())
        .ok_or_else(|| format!("questions[{index}].checks must be an array"))?;
    let checks = checks_raw
        .iter()
        .enumerate()
        .map(|(ci, c)| validate_check(c, index, ci))
        .collect::<Result<Vec<_>, _>>()?;

    let statement = match obj.get("statement") {
        None | Some(Value::Null) => None,
        Some(Value::String(s)) if matches!(s.as_str(), "insert" | "delete" | "drop") => {
            Some(s.clone())
        }
        _ => {
            return Err(format!(
                "questions[{index}].statement must be insert, delete, or drop when present"
            ))
        }
    };
    let effect_query = optional_string(obj, "effectQuery")?;
    if statement.is_some() && effect_query.is_none() {
        return Err(format!("questions[{index}] with statement requires effectQuery"));
    }
    if effect_query.is_some() && statement.is_none() {
        return Err(format!("questions[{index}] effectQuery requires statement"));
    }

    Ok(SqlQuestion {
        id: require_string(obj, "id")?,
        version,
        title: require_string(obj, "title")?,
        prompt: require_string(obj, "prompt")?,
        starter_query: require_string(obj, "starterQuery")?,
        solution_query: optional_string(obj, "solutionQuery")?,
        statement,
        effect_query,
        checks,
        tags,
        difficulty,
        schema_ref: require_string(obj, "schemaRef")?,
    })
}

fn validate_check(raw: &Value, qi: usize, ci: usize) -> Result<SqlCheck, String> {
    let obj = raw
        .as_object()
        .ok_or_else(|| format!("questions[{qi}].checks[{ci}] must have a type"))?;
    let typ = obj
        .get("type")
        .and_then(|v| v.as_str())
        .ok_or_else(|| format!("questions[{qi}].checks[{ci}] must have a type"))?;
    match typ {
        "result_set" => {
            let expected = obj
                .get("expected")
                .and_then(|v| v.as_array())
                .ok_or_else(|| {
                    format!("questions[{qi}].checks[{ci}].expected must be an array")
                })?;
            let mut rows = Vec::new();
            for row in expected {
                let map = row.as_object().ok_or_else(|| {
                    format!("questions[{qi}].checks[{ci}].expected rows must be objects")
                })?;
                rows.push(map.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
            }
            let ordered = match obj.get("ordered") {
                None | Some(Value::Null) => None,
                Some(Value::Bool(b)) => Some(*b),
                _ => {
                    return Err(format!(
                        "questions[{qi}].checks[{ci}].ordered must be a boolean"
                    ))
                }
            };
            Ok(SqlCheck::ResultSet { expected: rows, ordered })
        }
        "row_count" => {
            let expected = obj
                .get("expected")
                .and_then(|v| v.as_i64())
                .ok_or_else(|| {
                    format!("questions[{qi}].checks[{ci}].expected must be a number")
                })?;
            Ok(SqlCheck::RowCount { expected })
        }
        "columns" => {
            let expected = obj
                .get("expected")
                .and_then(|v| v.as_array())
                .ok_or_else(|| {
                    format!("questions[{qi}].checks[{ci}].expected must be a string array")
                })?
                .iter()
                .map(|v| {
                    v.as_str().map(|s| s.to_string()).ok_or_else(|| {
                        format!("questions[{qi}].checks[{ci}].expected must be a string array")
                    })
                })
                .collect::<Result<Vec<_>, _>>()?;
            Ok(SqlCheck::Columns { expected })
        }
        other => Err(format!(
            "questions[{qi}].checks[{ci}]: unknown type \"{other}\""
        )),
    }
}

fn validate_sql_assets(raw: Option<Value>) -> Result<HashMap<String, String>, String> {
    let obj = raw
        .as_ref()
        .and_then(|v| v.as_object())
        .ok_or_else(|| "sqlAssets must be an object map of schemaRef → SQL".to_string())?;
    let mut out = HashMap::new();
    for (k, v) in obj {
        let s = v
            .as_str()
            .ok_or_else(|| format!("sqlAssets[\"{k}\"] must be a string"))?;
        out.insert(k.clone(), s.to_string());
    }
    Ok(out)
}

fn require_string(
    obj: &serde_json::Map<String, Value>,
    key: &str,
) -> Result<String, String> {
    obj.get(key)
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .filter(|s| !s.trim().is_empty())
        .ok_or_else(|| format!("Missing or empty string field \"{key}\""))
}

fn optional_string(
    obj: &serde_json::Map<String, Value>,
    key: &str,
) -> Result<Option<String>, String> {
    match obj.get(key) {
        None | Some(Value::Null) => Ok(None),
        Some(Value::String(s)) if !s.trim().is_empty() => Ok(Some(s.clone())),
        Some(Value::String(_)) => Err(format!("Missing or empty string field \"{key}\"")),
        _ => Err(format!("Missing or empty string field \"{key}\"")),
    }
}
