use crate::models::{
    default_progress, BankSnapshot, PackPayload, ProgressRecord, SqlQuestion,
};
use std::cmp::Ordering;

pub struct MergeStats {
    pub merged: usize,
    pub skipped: usize,
    pub retired: usize,
}

pub fn merge_pack_into_bank(bank: &BankSnapshot, pack: &PackPayload) -> (BankSnapshot, MergeStats) {
    let mut questions = bank.questions.clone();
    let mut sql_assets = bank.sql_assets.clone();
    let mut merged = 0usize;
    let mut skipped = 0usize;

    for q in &pack.questions {
        match questions.get(&q.id) {
            Some(existing) if q.version <= existing.version => skipped += 1,
            _ => {
                questions.insert(q.id.clone(), q.clone());
                merged += 1;
            }
        }
    }

    for (ref_name, sql) in &pack.sql_assets {
        sql_assets.insert(ref_name.clone(), sql.clone());
    }

    let mut progress = bank.progress.clone();
    let mut retired = 0usize;
    if let Some(ids) = &pack.manifest.retired_ids {
        for id in ids {
            if questions.remove(id).is_some() {
                progress.remove(id);
                retired += 1;
            }
        }
    }

    let mut packs = bank.packs.clone();
    packs.insert(
        pack.manifest.pack_id.clone(),
        crate::models::PackMeta {
            pack_id: pack.manifest.pack_id.clone(),
            version: pack.manifest.version.clone(),
            title: pack.manifest.title.clone(),
            imported_at: crate::models::now_iso(),
        },
    );

    (
        BankSnapshot {
            questions,
            packs,
            attempts: bank.attempts.clone(),
            progress,
            sql_assets,
        },
        MergeStats {
            merged,
            skipped,
            retired,
        },
    )
}

pub fn questions_from_bank(bank: &BankSnapshot) -> Vec<SqlQuestion> {
    let mut list: Vec<_> = bank.questions.values().cloned().collect();
    list.sort_by(|a, b| compare_numbered_titles(&a.title, &b.title));
    list
}

pub fn progress_for(bank: &BankSnapshot, question_id: &str) -> ProgressRecord {
    bank.progress
        .get(question_id)
        .cloned()
        .unwrap_or_else(|| default_progress(question_id))
}

fn compare_numbered_titles(a: &str, b: &str) -> Ordering {
    numeric_key(a).cmp(&numeric_key(b)).then_with(|| {
        a.to_lowercase().cmp(&b.to_lowercase())
    })
}

fn numeric_key(title: &str) -> (u64, String) {
    let digits: String = title
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect();
    let n = digits.parse::<u64>().unwrap_or(u64::MAX);
    (n, title.to_lowercase())
}
