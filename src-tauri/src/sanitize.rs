use regex::Regex;
use std::sync::OnceLock;

fn admin_banned() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"(?i)\b(UPDATE|ALTER|CREATE|TRUNCATE|REPLACE|MERGE|GRANT|REVOKE|CALL|EXEC|EXECUTE|LOAD|HANDLER|LOCK|UNLOCK|SET|USE|SHOW|DESCRIBE|EXPLAIN|PREPARE|DEALLOCATE|SHUTDOWN|KILL|BENCHMARK|SLEEP)\b")
            .expect("admin regex")
    })
}

const PROTECTED_DATABASES: &[&str] = &[
    "portable_leetcode",
    "mysql",
    "performance_schema",
    "sys",
    "pl_exercise",
];

pub fn assert_practice_statement(sql: &str, kind: &str) -> Result<String, String> {
    let without_trailing = single_statement(sql)?;
    assert_no_foreign_database(&without_trailing, "pl_exercise")?;
    assert_kind(&without_trailing, kind)?;
    Ok(without_trailing)
}

pub fn assert_safe_select(sql: &str) -> Result<String, String> {
    assert_practice_statement(sql, "select")
}

fn single_statement(sql: &str) -> Result<String, String> {
    let stripped = strip_sql_comments(sql).trim().to_string();
    if stripped.is_empty() {
        return Err("Query is empty.".into());
    }
    let without_trailing = stripped
        .trim_end_matches(|c: char| c == ';' || c.is_whitespace())
        .trim()
        .to_string();
    if without_trailing.is_empty() {
        return Err("Query is empty.".into());
    }
    if without_trailing.contains(';') {
        return Err("Only a single SQL statement is allowed.".into());
    }
    Ok(without_trailing)
}

fn assert_kind(sql: &str, kind: &str) -> Result<(), String> {
    let scanned = mask_sql_literals(sql);
    if Regex::new(r"(?i)\bINTO\s+OUTFILE\b")
        .unwrap()
        .is_match(&scanned)
        || Regex::new(r"(?i)\bINTO\s+DUMPFILE\b")
            .unwrap()
            .is_match(&scanned)
    {
        return Err("SELECT … INTO OUTFILE/DUMPFILE is not allowed.".into());
    }
    if admin_banned().is_match(&scanned) || extra_banned(kind).is_match(&scanned) {
        return Err(rejected_message(kind).into());
    }
    if !starts_with_kind(sql, kind) {
        return Err(rejected_message(kind).into());
    }
    Ok(())
}

fn starts_with_kind(sql: &str, kind: &str) -> bool {
    let re = match kind {
        "select" => r"(?is)^\s*(WITH|SELECT)\b",
        "insert" => r"(?is)^\s*INSERT\s+INTO\b",
        "delete" => r"(?is)^\s*DELETE\s+FROM\b",
        "drop" => r"(?is)^\s*DROP\s+TABLE\b",
        _ => return false,
    };
    Regex::new(re).unwrap().is_match(sql)
}

fn extra_banned(kind: &str) -> Regex {
    let pat = match kind {
        "select" => r"(?i)\b(INSERT|DELETE|DROP)\b",
        "insert" => r"(?i)\b(DELETE|DROP)\b",
        "delete" => r"(?i)\b(INSERT|DROP)\b",
        "drop" => r"(?i)\b(INSERT|DELETE|SELECT|WITH)\b",
        _ => r"(?i)\b(INSERT|DELETE|DROP)\b",
    };
    Regex::new(pat).unwrap()
}

fn rejected_message(kind: &str) -> &'static str {
    match kind {
        "insert" => "This question needs a single INSERT INTO statement.",
        "delete" => "This question needs a single DELETE FROM statement.",
        "drop" => "This question needs a single DROP TABLE statement.",
        _ => "Only read-only SELECT queries are allowed for this exercise (no DDL/DML/admin statements).",
    }
}

fn assert_no_foreign_database(sql: &str, home: &str) -> Result<(), String> {
    let masked = mask_sql_literals(sql);
    for db in PROTECTED_DATABASES {
        if *db == home {
            continue;
        }
        let plain = Regex::new(&format!(r"(?i)\b{}\b\s*\.", regex::escape(db))).unwrap();
        let quoted = Regex::new(&format!("(?i)`{}`\\s*\\.", regex::escape(db))).unwrap();
        if plain.is_match(&masked) || quoted.is_match(sql) {
            return Err("That query references a database outside this exercise.".into());
        }
    }
    Ok(())
}

fn mask_sql_literals(sql: &str) -> String {
    let mut out = sql.to_string();
    out = Regex::new(r"'(?:[^']|'')*'")
        .unwrap()
        .replace_all(&out, "''")
        .into_owned();
    out = Regex::new(r#""(?:[^"]|"")*""#)
        .unwrap()
        .replace_all(&out, "\"\"")
        .into_owned();
    out = Regex::new(r"`[^`]*`")
        .unwrap()
        .replace_all(&out, "``")
        .into_owned();
    out
}

fn strip_sql_comments(sql: &str) -> String {
    let chars: Vec<char> = sql.chars().collect();
    let mut out = String::new();
    let mut i = 0;
    let mut in_single = false;
    let mut in_double = false;
    let mut in_backtick = false;

    while i < chars.len() {
        let ch = chars[i];
        let next = chars.get(i + 1).copied();

        if in_single {
            out.push(ch);
            if ch == '\'' && next == Some('\'') {
                out.push('\'');
                i += 2;
                continue;
            }
            if ch == '\'' {
                in_single = false;
            }
            i += 1;
            continue;
        }
        if in_double {
            out.push(ch);
            if ch == '"' && next == Some('"') {
                out.push('"');
                i += 2;
                continue;
            }
            if ch == '"' {
                in_double = false;
            }
            i += 1;
            continue;
        }
        if in_backtick {
            out.push(ch);
            if ch == '`' {
                in_backtick = false;
            }
            i += 1;
            continue;
        }

        if ch == '\'' {
            in_single = true;
            out.push(ch);
            i += 1;
            continue;
        }
        if ch == '"' {
            in_double = true;
            out.push(ch);
            i += 1;
            continue;
        }
        if ch == '`' {
            in_backtick = true;
            out.push(ch);
            i += 1;
            continue;
        }

        if ch == '-' && next == Some('-') {
            i += 2;
            while i < chars.len() && chars[i] != '\n' {
                i += 1;
            }
            continue;
        }
        if ch == '/' && next == Some('*') {
            i += 2;
            while i + 1 < chars.len() && !(chars[i] == '*' && chars[i + 1] == '/') {
                i += 1;
            }
            i += 2;
            continue;
        }
        if ch == '#' {
            while i < chars.len() && chars[i] != '\n' {
                i += 1;
            }
            continue;
        }

        out.push(ch);
        i += 1;
    }
    out
}
