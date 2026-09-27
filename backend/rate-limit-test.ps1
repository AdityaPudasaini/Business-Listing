# rate-limit-test.ps1
#
# Verifies the new global rate limiting (app.module.ts + auth.controller.ts
# changes) without touching anything else in the system.
#
# Run this from PowerShell with the backend already running on
# http://localhost:3001 (npm run start:dev in backend/).
#
# What "pass" looks like:
#   - Login flood:           requests 1-5 succeed/fail normally (401 for bad
#                             creds), request 6+ return 429.
#   - Register flood:        requests 1-5 go through, request 6+ return 429.
#   - Forgot-password flood: requests 1-3 go through, request 4+ return 429.
#   - Public listings check: ALL 10 requests return 200 -- this is the "did
#     we break anything" check. If any of these come back 429, the global
#     default (60/min) is misconfigured or something else is hammering the
#     API in the background.

$base = "http://localhost:3001"

function Test-Flood {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Method,
        $Body,
        [int]$Times
    )

    Write-Host ""
    Write-Host "=== $Name : $Method $Path x$Times ===" -ForegroundColor Cyan

    for ($i = 1; $i -le $Times; $i++) {
        try {
            if ($Body) {
                $resp = Invoke-WebRequest -Uri "$base$Path" -Method $Method `
                    -Body ($Body | ConvertTo-Json) -ContentType "application/json" `
                    -ErrorAction Stop
            } else {
                $resp = Invoke-WebRequest -Uri "$base$Path" -Method $Method -ErrorAction Stop
            }
            Write-Host ("  [{0}] {1}" -f $i, $resp.StatusCode)
        } catch {
            $status = $_.Exception.Response.StatusCode.value__
            $color = if ($status -eq 429) { "Green" } else { "Yellow" }
            Write-Host ("  [{0}] {1}" -f $i, $status) -ForegroundColor $color
        }
        Start-Sleep -Milliseconds 150
    }
}

# 1. Login -- limit is 5/min. Expect 429 from request #6 onward.
#    (Bad credentials on purpose -- we're testing the limiter, not logging in.
#    A 401 on requests 1-5 is correct; a 429 there would mean it's too tight.)
Test-Flood -Name "Login flood (expect 429 at #6)" -Path "/auth/login" -Method "POST" `
    -Body @{ email = "nonexistent-ratelimit-test@example.com"; password = "wrong" } -Times 7

# 2. Register -- limit is 5/min. Expect 429 from request #6 onward.
Test-Flood -Name "Register flood (expect 429 at #6)" -Path "/auth/register" -Method "POST" `
    -Body @{ name = "Rate Limit Test"; email = "ratelimittest+$([guid]::NewGuid())@example.com"; password = "TestPassword123!" } -Times 7

# 3. Forgot-password -- limit is 3/min (tightest). Expect 429 from request #4 onward.
Test-Flood -Name "Forgot-password flood (expect 429 at #4)" -Path "/auth/forgot-password" -Method "POST" `
    -Body @{ email = "cookietest@example.com" } -Times 5

# 4. Sanity check: a route with NO override, well under the 60/min global
#    default. Every single one of these should be 200 -- if any of these
#    fail, something is broken, not just "working as intended."
Test-Flood -Name "Public listings sanity check (expect ALL 200)" -Path "/businesses" -Method "GET" `
    -Body $null -Times 10

Write-Host ""
Write-Host "Done. Scroll up: green 429s are the limiter working; any 429 in the last (listings) block means something's wrong." -ForegroundColor Cyan
