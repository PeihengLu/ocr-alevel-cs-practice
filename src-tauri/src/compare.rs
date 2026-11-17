use crate::models::{CheckOutcome, QueryResultGrid, SqlCheck};
use serde_json::Value;
use std::collections::HashMap;

pub fn evaluate_checks(result: &QueryResultGrid, checks: &[SqlCheck]) -> Vec<CheckOutcome> {
    checks
        .iter()
        .enumerate()
        .map(|(index, check)| match check {
            SqlCheck::RowCount { expected } => {
                let passed = result.rows.len() as i64 == *expected;
                CheckOutcome {
                    index,
                    check_type: "row_count".into(),
                    passed,
                    detail: if passed {
                        format!("Row count is {expected}.")
                    } else {
                        format!("Expected {expected} row(s), got {}.", result.rows.len())
                    },
                }
            }
            SqlCheck::Columns { expected } => {
                let actual: Vec<String> = result
                    .columns
                    .iter()
                    .map(|c| c.to_lowercase())
                    .collect();
                let expected_l: Vec<String> =
                    expected.iter().map(|c| c.to_lowercase()).collect();
                let passed = actual == expected_l;
                CheckOutcome {
                    index,
                    check_type: "columns".into(),
                    passed,
                    detail: if passed {
                        format!("Columns match ({}).", expected.join(", "))
                    } else {
                        format!(
                            "Expected columns [{}], got [{}].",
                            expected.join(", "),
                            result.columns.join(", ")
                        )
                    },
                }
            }
            SqlCheck::ResultSet { expected, ordered } => {
                let ordered = ordered.unwrap_or(false);
                let passed = compare_result_sets(&result.rows, expected, ordered);
                CheckOutcome {
                    index,
                    check_type: "result_set".into(),
                    passed,
                    detail: if passed {
                        if ordered {
                            "Result set matches (order required).".into()
                        } else {
                            "Result set matches (order ignored).".into()
                        }
                    } else if ordered {
                        "Result set does not match expected rows/order.".into()
                    } else {
                        "Result set does not match expected rows (order ignored).".into()
                    },
                }
            }
        })
        .collect()
}

pub fn to_grid(
    columns: Vec<String>,
    rows: Vec<HashMap<String, Value>>,
) -> QueryResultGrid {
    QueryResultGrid {
        columns,
        rows: rows.into_iter().map(normalize_row).collect(),
    }
}

fn compare_result_sets(
    actual_rows: &[HashMap<String, Value>],
    expected_rows: &[HashMap<String, Value>],
    ordered: bool,
) -> bool {
    let actual: Vec<_> = actual_rows.iter().cloned().map(normalize_row).collect();
    let expected: Vec<_> = expected_rows.iter().cloned().map(normalize_row).collect();
    if actual.len() != expected.len() {
        return false;
    }

    if actual.len() == 1
        && expected.len() == 1
        && actual[0].len() == 1
        && expected[0].len() == 1
    {
        let a_val = actual[0].values().next().unwrap();
        let e_val = expected[0].values().next().unwrap();
        if values_equal(a_val, e_val) {
            return true;
        }
    }

    if ordered {
        return actual
            .iter()
            .zip(expected.iter())
            .all(|(a, b)| rows_equal(a, b));
    }

    let mut left: Vec<_> = actual.iter().map(canonical_row).collect();
    let mut right: Vec<_> = expected.iter().map(canonical_row).collect();
    left.sort();
    right.sort();
    left == right
}

fn rows_equal(a: &HashMap<String, Value>, b: &HashMap<String, Value>) -> bool {
    let mut keys_a: Vec<_> = a.keys().cloned().collect();
    let mut keys_b: Vec<_> = b.keys().cloned().collect();
    keys_a.sort();
    keys_b.sort();
    if keys_a != keys_b {
        return false;
    }
    keys_a.iter().all(|k| values_equal(&a[k], &b[k]))
}

fn canonical_row(row: &HashMap<String, Value>) -> String {
    let mut keys: Vec<_> = row.keys().cloned().collect();
    keys.sort();
    let mut obj = serde_json::Map::new();
    for k in keys {
        obj.insert(k.clone(), row[&k].clone());
    }
    Value::Object(obj).to_string()
}

fn normalize_row(row: HashMap<String, Value>) -> HashMap<String, Value> {
    let mut out = HashMap::new();
    for (key, value) in row {
        out.insert(key.to_lowercase(), normalize_value(value));
    }
    out
}

fn normalize_value(value: Value) -> Value {
    match value {
        Value::Null => Value::Null,
        Value::Number(n) => Value::Number(n),
        Value::Bool(b) => Value::Bool(b),
        Value::String(s) => Value::String(s),
        other => other,
    }
}

fn values_equal(a: &Value, b: &Value) -> bool {
    if a == b {
        return true;
    }
    match (a, b) {
        (Value::Number(n), Value::String(s)) if !s.trim().is_empty() => {
            s.parse::<f64>().ok().map(|v| n.as_f64() == Some(v)).unwrap_or(false)
        }
        (Value::String(s), Value::Number(n)) if !s.trim().is_empty() => {
            s.parse::<f64>().ok().map(|v| n.as_f64() == Some(v)).unwrap_or(false)
        }
        _ => a.to_string() == b.to_string(),
    }
}
