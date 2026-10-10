import fs from "node:fs";
import { parse } from "pgsql-parser";
const files = [
  ...fs
    .readdirSync("supabase/migrations")
    .sort()
    .map((f) => `supabase/migrations/${f}`),
  "supabase/seed.sql",
];
for (const file of files) {
  await parse(fs.readFileSync(file, "utf8"));
  console.log(`PASS PostgreSQL syntax: ${file}`);
}
console.log(
  "Syntax validation does not execute PL/pgSQL bodies or prove RLS behavior. Run live database acceptance tests too.",
);
