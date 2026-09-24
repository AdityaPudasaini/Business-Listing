# merge-test.ps1 - checks the routes added by the backend merge.
# Run from backend/ with the API running:
#   powershell -ExecutionPolicy Bypass -File .\merge-test.ps1
#
# Safe by design: it never sends a real announcement/broadcast (only invalid
# bodies that must return 400), it bans/unbans a THROWAWAY user it creates
# (not reviewer1, so nobody's listings get pulled down), and it deletes what it
# created at the end. It does create 2 test bookings on Test Cafe.
param(
  [string]$Base          = "http://localhost:3001",
  [string]$AdminEmail    = "aditya@example.com",
  [string]$AdminPassword = "password123",
  [string]$OtherEmail    = "reviewer1@test.com",
  [string]$OtherPassword = "password123",
  [string]$BusinessId    = "cmtcn93bc0001sy2s1foy63h1"
)

$script:pass = 0
$script:fail = 0

function Check([string]$Name, [bool]$Cond, [string]$Detail = "") {
  if ($Cond) { $script:pass++; Write-Host ("PASS  " + $Name) -ForegroundColor Green }
  else       { $script:fail++; Write-Host ("FAIL  " + $Name + "   " + $Detail) -ForegroundColor Red }
}

# Returns @{ Status = <int>; Raw = <body text> }. Never throws on 4xx/5xx.
function Call([string]$Method, [string]$Path, [string]$Token, $Body) {
  $headers = @{}
  if ($Token) { $headers["Authorization"] = "Bearer $Token" }
  $req = @{ Uri = "$Base$Path"; Method = $Method; Headers = $headers; UseBasicParsing = $true }
  if ($null -ne $Body) {
    $req["Body"] = ($Body | ConvertTo-Json -Depth 6)
    $req["ContentType"] = "application/json"
  }
  try {
    $r = Invoke-WebRequest @req
    return @{ Status = [int]$r.StatusCode; Raw = [string]$r.Content }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $raw = $sr.ReadToEnd()
      return @{ Status = [int]$resp.StatusCode; Raw = [string]$raw }
    }
    throw
  }
}

function Json($r) { if ($r.Raw) { return ($r.Raw | ConvertFrom-Json) } return $null }

function Login([string]$Email, [string]$Password) {
  $r = Call "POST" "/auth/login" "" @{ email = $Email; password = $Password }
  if ($r.Status -ne 200 -and $r.Status -ne 201) { return $null }
  return (Json $r)
}

Write-Host "`n=== Setup ===" -ForegroundColor Cyan
$admin = Login $AdminEmail $AdminPassword
if (-not $admin) { Write-Host "Cannot log in as $AdminEmail - stopping." -ForegroundColor Red; exit 2 }
$other = Login $OtherEmail $OtherPassword
if (-not $other) { Write-Host "Cannot log in as $OtherEmail - stopping." -ForegroundColor Red; exit 2 }
$A = $admin.accessToken
$O = $other.accessToken
$stamp = Get-Date -Format "yyyyMMddHHmmss"

$cafe = Call "GET" "/businesses/$BusinessId" "" $null
$cafeApproved = ($cafe.Status -eq 200)
if (-not $cafeApproved) {
  Write-Host "Test Cafe is not approved (GET returned $($cafe.Status)) - booking tests will be skipped. Approve it: PATCH /businesses/$BusinessId/approve" -ForegroundColor Yellow
}

Write-Host "`n=== Listings: mine / admin ===" -ForegroundColor Cyan
$r = Call "GET" "/businesses/mine" $A $null
Check "GET /businesses/mine (logged in) -> 200 array" ($r.Status -eq 200 -and $r.Raw.TrimStart().StartsWith("[")) "status=$($r.Status)"
$r = Call "GET" "/businesses/mine" "" $null
Check "GET /businesses/mine (no token) -> 401" ($r.Status -eq 401) "status=$($r.Status)"
$r = Call "GET" "/businesses/admin/all" $A $null
Check "GET /businesses/admin/all (admin) -> 200" ($r.Status -eq 200) "status=$($r.Status)"
$r = Call "GET" "/businesses/admin/all" $O $null
Check "GET /businesses/admin/all (non-admin) -> 403" ($r.Status -eq 403) "status=$($r.Status)"

Write-Host "`n=== Throwaway user + listing (isPartner guard, ban) ===" -ForegroundColor Cyan
$tEmail = "merge.$stamp@test.com"
$tPass  = "Passw0rd-$stamp"
$r = Call "POST" "/auth/register" "" @{ name = "Merge Tester"; email = $tEmail; password = $tPass }
Check "register throwaway user" ($r.Status -eq 201 -or $r.Status -eq 200) "status=$($r.Status) body=$($r.Raw)"
$tUser = Login $tEmail $tPass
$T = $tUser.accessToken
$tId = $tUser.user.id

$r = Call "POST" "/businesses" $T @{ name = "Merge Test Listing $stamp"; category = "auto-garage"; location = "Kathmandu" }
$listing = Json $r
$lid = $listing.id
Check "throwaway user creates a listing (pending)" ($lid -and $listing.status -eq "pending") "status=$($r.Status) body=$($r.Raw)"

if ($lid) {
  $r = Call "PATCH" "/businesses/$lid" $T @{ isPartner = $true; tiktok = "https://tiktok.com/@merge" }
  $upd = Json $r
  Check "owner PATCH with isPartner=true -> isPartner stays false" ($r.Status -eq 200 -and $upd.isPartner -eq $false) "status=$($r.Status) isPartner=$($upd.isPartner)"
  Check "owner PATCH saves tiktok (social columns exist)" ($upd.tiktok -eq "https://tiktok.com/@merge") "tiktok=$($upd.tiktok)"

  $r = Call "GET" "/businesses/admin/$lid" $A $null
  Check "GET /businesses/admin/:id (admin) sees the pending listing" ($r.Status -eq 200) "status=$($r.Status)"
  $r = Call "GET" "/businesses/admin/$lid" $O $null
  Check "GET /businesses/admin/:id (non-admin) -> 403" ($r.Status -eq 403) "status=$($r.Status)"

  $r = Call "PATCH" "/businesses/admin/$lid" $A @{ isPartner = $true }
  $adm = Json $r
  Check "admin PATCH can set isPartner=true, status untouched" ($r.Status -eq 200 -and $adm.isPartner -eq $true -and $adm.status -eq "pending") "status=$($r.Status) body=$($r.Raw)"
}

Write-Host "`n=== Users: ban ===" -ForegroundColor Cyan
$r = Call "PATCH" "/users/$($admin.user.id)/ban" $A @{ isBanned = $true }
Check "admin cannot ban self -> 400" ($r.Status -eq 400) "status=$($r.Status)"
$r = Call "PATCH" "/users/$tId/ban" $O @{ isBanned = $true }
Check "non-admin cannot ban -> 403" ($r.Status -eq 403) "status=$($r.Status)"
$r = Call "PATCH" "/users/$tId/ban" $A @{ isBanned = $true }
$ban = Json $r
Check "admin bans throwaway user (row has isBanned + businessCount)" ($r.Status -eq 200 -and $ban.isBanned -eq $true -and $null -ne $ban.businessCount) "status=$($r.Status) body=$($r.Raw)"
$r = Call "POST" "/auth/login" "" @{ email = $tEmail; password = $tPass }
Check "banned user cannot log in -> 401" ($r.Status -eq 401) "status=$($r.Status)"
$r = Call "GET" "/users" $A $null
Check "GET /users includes isBanned" ($r.Status -eq 200 -and $r.Raw -match '"isBanned"') "status=$($r.Status)"
$r = Call "PATCH" "/users/$tId/ban" $A @{ isBanned = $false }
Check "admin unbans throwaway user" ($r.Status -eq 200 -and (Json $r).isBanned -eq $false) "status=$($r.Status)"
$tUser2 = Login $tEmail $tPass
Check "unbanned user can log in again" ($null -ne $tUser2) ""

Write-Host "`n=== Bookings ===" -ForegroundColor Cyan
if ($cafeApproved) {
  $guestBody = @{ businessId = $BusinessId; date = "2026-10-15"; time = "18:30"; contactName = "Merge Guest"; contactEmail = "merge.guest.$stamp@example.com" }
  $r = Call "POST" "/bookings" "" $guestBody
  $gb = Json $r
  Check "guest booking (no token) on approved listing -> created" (($r.Status -eq 201 -or $r.Status -eq 200) -and $gb.id) "status=$($r.Status) body=$($r.Raw)"

  $noContact = @{ businessId = $BusinessId; date = "2026-10-15"; time = "18:30"; contactName = "No Contact" }
  $r = Call "POST" "/bookings" "" $noContact
  Check "guest booking with no phone/email -> 400" ($r.Status -eq 400) "status=$($r.Status)"

  if ($lid) {
    $r = Call "POST" "/bookings" $O @{ businessId = $lid; date = "2026-10-15"; time = "18:30" }
    Check "booking on a PENDING listing -> 400" ($r.Status -eq 400) "status=$($r.Status) body=$($r.Raw)"
  }

  $r = Call "GET" "/bookings/received" $A $null
  Check "GET /bookings/received (owner) lists the guest booking" ($r.Status -eq 200 -and $gb.id -and $r.Raw -match $gb.id) "status=$($r.Status)"
  $r = Call "GET" "/bookings/received" "" $null
  Check "GET /bookings/received (no token) -> 401" ($r.Status -eq 401) "status=$($r.Status)"

  $r = Call "PATCH" "/bookings/$($gb.id)/status" $O @{ status = "confirmed" }
  Check "non-owner cannot change status -> 403" ($r.Status -eq 403) "status=$($r.Status)"
  $r = Call "PATCH" "/bookings/$($gb.id)/status" $A @{ status = "rejected" }
  Check "old status 'rejected' is no longer accepted -> 400" ($r.Status -eq 400) "status=$($r.Status)"
  $r = Call "PATCH" "/bookings/$($gb.id)/status" $A @{ status = "declined" }
  Check "owner declines booking -> status declined" ($r.Status -eq 200 -and (Json $r).status -eq "declined") "status=$($r.Status) body=$($r.Raw)"

  $r = Call "PATCH" "/bookings/$($gb.id)/cancel" $O $null
  Check "logged-in user cannot cancel a guest booking -> 403" ($r.Status -eq 403) "status=$($r.Status)"

  $r = Call "POST" "/bookings" $O @{ businessId = $BusinessId; date = "2026-10-16"; time = "10:00"; contactPhone = "9800000000" }
  $ub = Json $r
  Check "logged-in booking created" (($r.Status -eq 201 -or $r.Status -eq 200) -and $ub.id) "status=$($r.Status) body=$($r.Raw)"
  $r = Call "PATCH" "/bookings/$($ub.id)/cancel" $A $null
  Check "someone else cannot cancel it -> 403" ($r.Status -eq 403) "status=$($r.Status)"
  $r = Call "PATCH" "/bookings/$($ub.id)/cancel" $O $null
  Check "customer cancels own booking" ($r.Status -eq 200 -and (Json $r).status -eq "cancelled") "status=$($r.Status) body=$($r.Raw)"
  $r = Call "PATCH" "/bookings/$($ub.id)/cancel" $O $null
  Check "cancelling twice -> 400" ($r.Status -eq 400) "status=$($r.Status)"
}

Write-Host "`n=== Customers / announcements / broadcasts (no emails sent) ===" -ForegroundColor Cyan
$r = Call "GET" "/businesses/$BusinessId/customers" $A $null
Check "GET /businesses/:id/customers (owner/admin) -> 200" ($r.Status -eq 200) "status=$($r.Status)"
$r = Call "GET" "/businesses/$BusinessId/customers" $O $null
Check "GET /businesses/:id/customers (not owner) -> 403" ($r.Status -eq 403) "status=$($r.Status)"
$r = Call "GET" "/businesses/$BusinessId/customers" "" $null
Check "GET /businesses/:id/customers (no token) -> 401" ($r.Status -eq 401) "status=$($r.Status)"
$r = Call "GET" "/businesses/mine/customers" $A $null
Check "GET /businesses/mine/customers -> 200" ($r.Status -eq 200) "status=$($r.Status)"

$r = Call "GET" "/businesses/$BusinessId/announcements" $A $null
Check "GET announcements history (owner) -> 200" ($r.Status -eq 200) "status=$($r.Status)"
$r = Call "GET" "/businesses/$BusinessId/announcements" $O $null
Check "GET announcements history (not owner) -> 403" ($r.Status -eq 403) "status=$($r.Status)"
$r = Call "POST" "/businesses/$BusinessId/announcements" $A @{ subject = "x"; message = "short" }
Check "POST announcement with too-short body -> 400 (nothing sent)" ($r.Status -eq 400) "status=$($r.Status)"

$r = Call "GET" "/admin/broadcasts" $A $null
Check "GET /admin/broadcasts (admin) -> 200" ($r.Status -eq 200) "status=$($r.Status)"
$r = Call "GET" "/admin/broadcasts" $O $null
Check "GET /admin/broadcasts (non-admin) -> 403" ($r.Status -eq 403) "status=$($r.Status)"
$r = Call "POST" "/admin/broadcasts" $A @{ subject = "x"; message = "short" }
Check "POST broadcast with too-short body -> 400 (nothing sent)" ($r.Status -eq 400) "status=$($r.Status)"

Write-Host "`n=== Auth: reset + social ===" -ForegroundColor Cyan
$r = Call "POST" "/auth/forgot-password" "" @{ email = "nobody.$stamp@example.com" }
Check "forgot-password for unknown email -> generic 2xx" ($r.Status -eq 200 -or $r.Status -eq 201) "status=$($r.Status)"

foreach ($p in @("google", "facebook")) {
  $loc = $null
  try {
    $req = [System.Net.HttpWebRequest]::Create("$Base/auth/$p")
    $req.AllowAutoRedirect = $false
    $resp = $req.GetResponse()
    $code = [int]$resp.StatusCode
    $loc = $resp.Headers["Location"]
    $resp.Close()
  } catch [System.Net.WebException] {
    $code = [int]$_.Exception.Response.StatusCode
    $loc = $_.Exception.Response.Headers["Location"]
  }
  $ok = ($code -eq 302) -and ($loc -match "provider_not_configured" -or $loc -match "accounts.google.com" -or $loc -match "facebook.com")
  Check "GET /auth/$p redirects (302)" $ok "status=$code location=$loc"
  Write-Host ("      -> " + $loc) -ForegroundColor DarkGray
}

Write-Host "`n=== Cleanup ===" -ForegroundColor Cyan
if ($lid) {
  $r = Call "DELETE" "/businesses/admin/$lid" $A $null
  Check "admin deletes the throwaway listing" ($r.Status -eq 200) "status=$($r.Status)"
  $r = Call "GET" "/businesses/admin/$lid" $A $null
  Check "deleted listing is gone -> 404" ($r.Status -eq 404) "status=$($r.Status)"
}
if ($tUser2) {
  $r = Call "DELETE" "/me/account" $tUser2.accessToken $null
  Check "throwaway user deletes own account" ($r.Status -eq 200) "status=$($r.Status)"
}

Write-Host ""
$color = "Green"
if ($script:fail -gt 0) { $color = "Red" }
Write-Host ("RESULT: " + $script:pass + " passed, " + $script:fail + " failed") -ForegroundColor $color
Write-Host "Left behind on purpose: 2 test bookings on Test Cafe (declined / cancelled)."
if ($script:fail -gt 0) { exit 1 } else { exit 0 }
