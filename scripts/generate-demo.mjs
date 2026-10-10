import fs from "node:fs";
const potholeSamples = JSON.parse(
  fs.readFileSync("data/pothole-samples.json", "utf8"),
).samples;
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const anchor = new Date("2026-10-09T12:00:00Z");
const date = (d) => new Date(+anchor + d * 86400000).toISOString();
const roads = [
  "College Road",
  "Station Road",
  "Market Street",
  "Lake Avenue",
  "Hospital Road",
  "Gandhi Street",
  "Park Lane",
  "Temple Road",
  "Canal Street",
  "North Main Road",
].map((name, i) => ({ id: id(101 + i), name, ward_id: id(1) }));
const I = (
  n,
  road,
  days,
  severity,
  sensitive,
  status,
  lat = 13.0827,
  lng = 80.2707,
  previous = null,
) => ({
  id: id(n),
  road_segment_id: id(road),
  opened_at: date(days),
  severity,
  sensitive_location: sensitive,
  status,
  lat,
  lng,
  previous_repair_id: previous ? id(previous) : null,
});
const incidents = [
  I(203, 101, -130, 0.8, true, "closed"),
  I(201, 101, -65, 0.85, true, "closed", 13.0827, 80.2707, 503),
  I(202, 101, -10, 0.9, true, "open", 13.08272, 80.27071, 501),
  I(204, 102, -2, 0.7, false, "assigned", 13.085, 80.271),
  I(205, 102, -2, 0.5, false, "open", 13.08527, 80.271),
  I(206, 103, -12, 0.65, false, "assigned", 13.081, 80.273),
  I(207, 105, -6, 0.8, true, "repaired_pending_review", 13.084, 80.268),
  I(208, 104, -7, 0.25, false, "assigned", 13.078, 80.274),
];
const J = (n, i, due, repaired, contractor, verified = null) => ({
  id: id(n),
  incident_id: id(i),
  owner: id(3),
  due_date: date(due).slice(0, 10),
  contractor_name: contractor,
  warranty_days: 90,
  repaired_at: repaired !== null ? date(repaired) : null,
  verified_at: verified !== null ? date(verified) : null,
  verified_by: verified !== null ? id(4) : null,
  photo_url: repaired !== null ? "/demo-repair.png" : null,
});
const jobs = [
  J(503, 203, -102, -100, "Metro Roads Ltd.", -99),
  J(501, 201, -46, -45, "Metro Roads Ltd.", -44),
  J(506, 206, -3, null, "City Works"),
  J(507, 207, -2, -1, "City Works"),
  J(504, 204, 1, null, "City Works"),
  J(508, 208, 3, null, "Metro Roads Ltd."),
];
const reports = [];
function R(n, i, note, days, road = 101, lat = 13.0827, lng = 80.2707) {
  const incident = incidents.find((x) => x.id === id(i));
  reports.push({
    id: id(300 + n),
    ticket_id: `RW-${String(n).padStart(4, "0")}`,
    reporter_id: id(2),
    road_segment_id: id(road),
    lat,
    lng,
    location_source: n % 2 ? "gps" : "manual_pin",
    note,
    status: incident
      ? incident.status === "open"
        ? "grouped"
        : incident.status
      : "submitted",
    incident_id: incident?.id ?? null,
    created_at: date(days),
    photo_url:
      potholeSamples[Math.abs((i ?? n) - 201) % potholeSamples.length].image,
  });
}
for (let n = 1; n <= 5; n++)
  R(
    n,
    201,
    [
      "Deep pothole outside the college gate.",
      "Same hole near the college crossing.",
      "Water pooling in the broken surface.",
      "Unsafe for bicycles at the college entrance.",
      "Please repair before the school rush.",
    ][n - 1],
    -65 + n * 0.1,
  );
R(6, 202, "Surface has broken again at the repaired college entrance.", -10);
R(7, 204, "Pothole near station north gate.", -2, 102, 13.085, 80.271);
R(
  8,
  205,
  "Separate pothole 30 metres further along.",
  -2,
  102,
  13.08527,
  80.271,
);
R(9, 206, "Broken asphalt outside the market.", -12, 103, 13.081, 80.273);
R(10, 207, "Dangerous depression near hospital.", -6, 105, 13.084, 80.268);
R(11, 208, "Small pothole beside the lake.", -7, 104, 13.078, 80.274);
R(
  12,
  null,
  "Fresh damage at the college gate. GPS may have drifted.",
  0,
  101,
  13.08278,
  80.27074,
);
R(13, null, "Shallow crack at Park Lane bus stop.", 0, 107, 13.079, 80.269);
R(14, 203, "Earlier road failure at the college gate.", -130);
const S = (n, report, output, decision = "pending") => ({
  id: id(n),
  entity_type: "report",
  entity_id: id(300 + report),
  kind: "photo_triage",
  model: "demo:gpt-4o",
  model_version: "demo-fixture-v1",
  confidence: 0.78,
  input_snapshot: { demo: true, report_id: id(300 + report) },
  output,
  decision,
  decided_by: decision === "pending" ? null : id(3),
  decided_at: decision === "pending" ? null : date(-1),
  created_at: date(-1),
  input_hash: `demo-${n}`,
});
const suggestions = [
  S(701, 12, {
    is_pothole: true,
    severity_estimate: 0.85,
    sensitive_hint: "school",
    reasoning:
      "The visible depression looks deep; the note mentions a college entrance.",
  }),
  S(702, 13, {
    is_pothole: true,
    severity_estimate: 0.3,
    sensitive_hint: "none",
    reasoning:
      "The surface appears shallow with no sensitive landmark identified.",
  }),
  S(
    703,
    10,
    {
      is_pothole: true,
      severity_estimate: 0.8,
      sensitive_hint: "hospital",
      reasoning: "Damage was reviewed near a hospital entrance.",
    },
    "accepted",
  ),
];
const events = [];
let ev = 800;
for (const r of reports) {
  events.push({
    id: id(ev++),
    entity_type: "report",
    entity_id: r.id,
    from_status: null,
    to_status: "submitted",
    actor_id: id(2),
    reason: "Citizen submitted a photo and location",
    created_at: r.created_at,
  });
  if (r.incident_id)
    events.push({
      id: id(ev++),
      entity_type: "report",
      entity_id: r.id,
      from_status: "submitted",
      to_status: "grouped",
      actor_id: id(3),
      reason:
        "Officer confirmed the road and location; permanent citizen ticket retained",
      created_at: r.created_at,
    });
  if (r.status !== "grouped" && r.status !== "submitted")
    events.push({
      id: id(ev++),
      entity_type: "report",
      entity_id: r.id,
      from_status: "grouped",
      to_status: r.status,
      actor_id: r.status === "closed" ? id(4) : id(3),
      reason:
        r.status === "closed"
          ? "Reviewer verified the repair and after-photo"
          : "Repair job progress recorded",
      created_at:
        jobs.find((j) => j.incident_id === r.incident_id)?.verified_at ??
        date(-1),
    });
}
for (const i of incidents) {
  events.push({
    id: id(ev++),
    entity_type: "incident",
    entity_id: i.id,
    from_status: null,
    to_status: "open",
    actor_id: id(3),
    reason: "Officer confirmed a separate incident",
    created_at: i.opened_at,
  });
  if (i.status !== "open")
    events.push({
      id: id(ev++),
      entity_type: "incident",
      entity_id: i.id,
      from_status: "open",
      to_status: i.status,
      actor_id: i.status === "closed" ? id(4) : id(3),
      reason:
        i.status === "closed"
          ? "Repair verified with after-photo"
          : "Officer confirmed severity and assigned a repair job",
      created_at:
        jobs.find((j) => j.incident_id === i.id)?.verified_at ?? date(-1),
    });
}
const dataset = {
  roads,
  reports,
  incidents,
  jobs,
  suggestions,
  events,
  notes: [],
  officers: [{ id: id(3), name: "Arun Kumar" }],
  demo: true,
  role: "officer",
  name: "Arun Kumar",
  userId: id(3),
};
fs.writeFileSync("lib/demo-fixture.json", JSON.stringify(dataset, null, 2));
const q = (v) => (v === null ? "null" : `'${String(v).replaceAll("'", "''")}'`);
const t = (v) =>
  `(now() + interval '${(+new Date(v) - +anchor) / 86400000} days')`;
const sql = [
  `-- DEMO DATA ONLY. Local auth seed; cloud users should be created with the seed utility.\ncreate extension if not exists pgcrypto with schema extensions;`,
  `select set_config('roadwatch.seed_actor',${q(id(3))},false);`,
];
for (const [n, email, name, role] of [
  [2, "citizen@roadwatch.demo", "Priya Sharma", "citizen"],
  [3, "officer@roadwatch.demo", "Arun Kumar", "officer"],
  [4, "reviewer@roadwatch.demo", "Meera Rao", "reviewer"],
]) {
  sql.push(
    `insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change) values('00000000-0000-0000-0000-000000000000',${q(id(n))},'authenticated','authenticated',${q(email)},extensions.crypt('RoadWatchDemo!2026',extensions.gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}',${q(JSON.stringify({ name }))},now(),now(),'','','','') on conflict(id) do nothing;`,
  );
  sql.push(
    `insert into auth.identities(id,user_id,identity_data,provider,provider_id,created_at,updated_at) values(${q(id(900 + n))},${q(id(n))},${q(JSON.stringify({ sub: id(n), email, email_verified: true }))},'email',${q(id(n))},now(),now()) on conflict do nothing;`,
  );
}
sql.push(
  `insert into wards(id,name) values(${q(id(1))},'Ward 12 · Central') on conflict do nothing;`,
);
for (const [n, name, role] of [
  [2, "Priya Sharma", "citizen"],
  [3, "Arun Kumar", "officer"],
  [4, "Meera Rao", "reviewer"],
])
  sql.push(
    `insert into profiles(id,name,role,ward_id) values(${q(id(n))},${q(name)},${q(role)},${q(id(1))}) on conflict do nothing;`,
  );
for (const [idx, r] of roads.entries())
  sql.push(
    `insert into road_segments(id,name,ward_id,geometry) values(${q(r.id)},${q(r.name)},${q(r.ward_id)},extensions.st_geomfromtext('LINESTRING(${80.27 + idx * 0.0005} ${13.08 + idx * 0.0005},${80.273 + idx * 0.0005} ${13.083 + idx * 0.0005})',4326)) on conflict do nothing;`,
  );
for (const i of [...incidents].sort(
  (a, b) => Date.parse(a.opened_at) - Date.parse(b.opened_at),
)) {
  sql.push(
    `insert into incidents(id,road_segment_id,location,severity,sensitive_location,status,opened_at) values(${q(i.id)},${q(i.road_segment_id)},extensions.st_setsrid(extensions.st_makepoint(${i.lng},${i.lat}),4326)::extensions.geography,${i.severity},${i.sensitive_location},'open',${t(i.opened_at)}) on conflict do nothing;`,
  );
  const j = jobs.find((j) => j.incident_id === i.id);
  if (j) {
    sql.push(
      `insert into repair_jobs(id,incident_id,owner,due_date,contractor_name,warranty_days,after_photo_path,repaired_at,verified_by,verified_at) values(${q(j.id)},${q(j.incident_id)},${q(j.owner)},${t(j.due_date)},${q(j.contractor_name)},90,${j.repaired_at ? q(`${id(3)}/demo-after-${j.id}.png`) : "null"},${j.repaired_at ? t(j.repaired_at) : "null"},${q(j.verified_by)},${j.verified_at ? t(j.verified_at) : "null"}) on conflict do nothing;`,
    );
    for (const status of [
      "assigned",
      ...(j.repaired_at ? ["repaired_pending_review"] : []),
      ...(j.verified_at ? ["closed"] : []),
    ]) {
      sql.push(
        `select set_config('roadwatch.reason','Demo: officer confirmed repair progress; reviewer confirmed closure',false);select set_config('roadwatch.seed_actor',${q(status === "closed" ? id(4) : id(3))},false);update incidents set status=${q(status)} where id=${q(i.id)};`,
      );
    }
  }
  sql.push(`select set_config('roadwatch.seed_actor',${q(id(3))},false);`);
}
for (const r of reports) {
  sql.push(
    `select set_config('roadwatch.seed_actor',${q(id(2))},false);insert into reports(id,ticket_id,reporter_id,road_segment_id,location,location_source,photo_path,note,status,incident_id,created_at) values(${q(r.id)},${q(r.ticket_id)},${q(r.reporter_id)},${q(r.road_segment_id)},extensions.st_setsrid(extensions.st_makepoint(${r.lng},${r.lat}),4326)::extensions.geography,${q(r.location_source)},${q(`${id(2)}/demo-report-${r.id}.png`)},${q(r.note)},'submitted',${q(r.incident_id)},${t(r.created_at)}) on conflict do nothing;select set_config('roadwatch.seed_actor',${q(id(3))},false);update reports set status=${q(r.status)} where id=${q(r.id)};`,
  );
}
for (const s of suggestions)
  sql.push(
    `insert into ai_suggestions(id,entity_type,entity_id,kind,model,model_version,confidence,input_snapshot,output,input_hash,decision,decided_by,decided_at) values(${q(s.id)},'report',${q(s.entity_id)},'photo_triage',${q(s.model)},${q(s.model_version)},${s.confidence},${q(JSON.stringify(s.input_snapshot))},${q(JSON.stringify(s.output))},${q(s.input_hash)},${q(s.decision)},${q(s.decided_by)},${s.decided_at ? t(s.decided_at) : "null"}) on conflict do nothing;`,
  );
sql.push(
  `select setval('ticket_numbers',14);select set_config('roadwatch.seed_actor','',false);select set_config('roadwatch.reason','',false);`,
);
fs.writeFileSync("supabase/seed.sql", sql.join("\n"));
