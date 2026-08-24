// SafetyOS DB tooling — applies .sql files to the Supabase Postgres
// Usage: node run-sql.js <path-to-sql-file>
// Credentials via env: PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
const { Client } = require("pg");
const fs = require("fs");

function splitSql(sql) {
  const stmts = [];
  let cur = "";
  let i = 0;
  const n = sql.length;
  while (i < n) {
    const ch = sql[i];
    if (ch === "-" && sql[i + 1] === "-") {          // line comment
      let j = i;
      while (j < n && sql[j] !== "\n") j++;
      cur += sql.slice(i, j);
      i = j;
      continue;
    }
    if (ch === "/" && sql[i + 1] === "*") {           // block comment
      let j = i + 2;
      while (j < n && !(sql[j] === "*" && sql[j + 1] === "/")) j++;
      cur += sql.slice(i, j + 2);
      i = j + 2;
      continue;
    }
    if (ch === "$") {                                 // dollar quote $$ or $tag$
      const m = /^\$[A-Za-z0-9_]*\$/.exec(sql.slice(i));
      if (m) {
        const tag = m[0];
        const end = sql.indexOf(tag, i + tag.length);
        if (end === -1) throw new Error("Unterminated dollar quote at " + i);
        cur += sql.slice(i, end + tag.length);
        i = end + tag.length;
        continue;
      }
    }
    if (ch === "'") {                                 // string literal
      let j = i + 1;
      while (j < n) {
        if (sql[j] === "'" && sql[j + 1] === "'") { j += 2; continue; }
        if (sql[j] === "'") break;
        j++;
      }
      cur += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === '"') {                                 // quoted identifier
      let j = i + 1;
      while (j < n) {
        if (sql[j] === '"' && sql[j + 1] === '"') { j += 2; continue; }
        if (sql[j] === '"') break;
        j++;
      }
      cur += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === ";") {
      if (cur.trim()) stmts.push(cur.trim());
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim()) stmts.push(cur.trim());
  return stmts;
}

async function main() {
  const file = process.argv[2];
  if (!file) { console.error("usage: node run-sql.js <file.sql>"); process.exit(1); }
  const sql = fs.readFileSync(file, "utf8");
  const stmts = splitSql(sql);
  console.log(`→ ${file}: ${stmts.length} statements`);

  const client = new Client({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || "postgres",
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });

  await client.connect();
  console.log("✓ connected to", process.env.PGHOST);
  let ok = 0, failed = 0;
  for (let k = 0; k < stmts.length; k++) {
    const s = stmts[k];
    const firstLine = s.split("\n")[0].slice(0, 90);
    try {
      await client.query(s);
      ok++;
      if (firstLine.match(/^(create|alter|insert|drop|do)/i)) {
        const t = /^(create|alter|insert|drop)\s+(\S+)/i.exec(s);
        console.log(`  [${k + 1}/${stmts.length}] ok  ${firstLine}`);
      }
    } catch (e) {
      failed++;
      console.log(`  [${k + 1}/${stmts.length}] FAIL  ${firstLine}`);
      console.log("       ↳", e.message.slice(0, 220));
      if (process.env.STRICT === "1") break;
    }
  }
  await client.end();
  console.log(`\n${ok} ok · ${failed} failed${failed ? " (re-runnable — fix and rerun)" : ""}`);
  process.exit(failed && process.env.STRICT === "1" ? 1 : 0);
}

main().catch((e) => { console.error("FATAL:", e.message); process.exit(1); });
