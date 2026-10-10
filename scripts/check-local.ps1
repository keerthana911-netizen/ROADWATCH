# Writes local credentials into an ignored env file without displaying secrets.
# Run only after `npx supabase start` succeeds.
$localStatus = npx supabase status -o env | Out-String
if ($LASTEXITCODE -ne 0) { throw 'Local Supabase is not running.' }
function Read-LocalValue([string]$name) {
 $match = [regex]::Match($localStatus, "(?m)^$name=""([^""]+)""")
 if (!$match.Success) { throw "Local status did not return $name" }
 return $match.Groups[1].Value
}
$localUrl = Read-LocalValue 'API_URL'
$localAnon = Read-LocalValue 'ANON_KEY'
$localService = Read-LocalValue 'SERVICE_ROLE_KEY'
if (Test-Path -LiteralPath '.env.local') { throw 'An .env.local file already exists. Preserve it and configure the local values manually.' }
@("NEXT_PUBLIC_SUPABASE_URL=$localUrl", "NEXT_PUBLIC_SUPABASE_ANON_KEY=$localAnon", "SUPABASE_SERVICE_ROLE_KEY=$localService") | Set-Content -LiteralPath '.env.local'
$env:TEST_SUPABASE_URL = $localUrl
$env:TEST_SUPABASE_ANON_KEY = $localAnon
$env:TEST_SUPABASE_SERVICE_ROLE_KEY = $localService
node --env-file=.env.local scripts/upload-demo-photos.mjs
if ($LASTEXITCODE -ne 0) { throw 'Demo photo upload failed.' }
npm test
if ($LASTEXITCODE -ne 0) { throw 'Acceptance tests failed.' }
Write-Output 'Configured local Supabase, uploaded private demo illustrations, and ran acceptance checks. Restart Next.js to load .env.local.'
