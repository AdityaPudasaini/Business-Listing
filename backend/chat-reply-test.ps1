# chat-reply-test.ps1
#
# Checks the chatbot replies straight from the backend (no frontend involved).
# Run from PowerShell with the backend already running on http://localhost:3001
# (npm run start:dev in backend/) and AFTER replacing chats.service.ts.
#
# Optional: pass a real APPROVED business id to also test the listing chat:
#   .\chat-reply-test.ps1 -BusinessId "<uuid>"
#
# Rate limits to keep in mind: /chats/general is 15/min per IP, POST /chats is
# 10/min. This script stays well under both, but don't run it 3 times in a row.
#
# What "pass" looks like:
#   1. "whats the closet business" + coords -> "Closest businesses to you" list
#      with distance + "View on map" links (NOT the generic Listings-page text)
#   2. same message, no coords              -> "Location needed" message
#   3. "closest garage" + coords            -> closest list again
#   4. "how do I list my business"          -> normal AI answer (NOT the closest list)
#   5. Listing chat (if -BusinessId given)  -> emoji-headed replies for hours,
#      phone, address, services, reviews and the "Sorry, I didn't understand" fallback

param([string]$BusinessId = "")

$base = "http://localhost:3001"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Kathmandu -- change if your seed businesses are elsewhere.
$lat = 27.7172
$lng = 85.3240

function Post-Json {
    param([string]$Path, $Body)
    try {
        return Invoke-RestMethod -Uri "$base$Path" -Method Post -ContentType "application/json; charset=utf-8" `
            -Body ([System.Text.Encoding]::UTF8.GetBytes(($Body | ConvertTo-Json -Depth 5)))
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        Write-Host "   !! HTTP $code" -ForegroundColor Red
        return $null
    }
}

function Show-Reply {
    param([string]$Title, $Result)
    Write-Host ""
    Write-Host "=== $Title" -ForegroundColor Cyan
    if ($Result -and $Result.reply -and $Result.reply.text) { Write-Host $Result.reply.text }   # listing chat: { reply: { text } }
    elseif ($Result -and $Result.reply) { Write-Host $Result.reply }                            # general chat: { reply: "..." }
    elseif ($Result -and $Result.text) { Write-Host $Result.text }
    elseif ($Result) { $Result | ConvertTo-Json -Depth 5 | Write-Host }
}

Write-Host "--- General chat (POST /chats/general) ---" -ForegroundColor Yellow

Show-Reply "1. typo 'closet' + location" (Post-Json "/chats/general" @{ message = "whats the closet business"; history = @(); latitude = $lat; longitude = $lng })
Show-Reply "2. same, NO location"        (Post-Json "/chats/general" @{ message = "whats the closet business"; history = @() })
Show-Reply "3. 'closest garage' + location" (Post-Json "/chats/general" @{ message = "closest garage"; history = @(); latitude = $lat; longitude = $lng })
Show-Reply "4. non-nearby question (should be AI, not the list)" (Post-Json "/chats/general" @{ message = "how do I list my business"; history = @(); latitude = $lat; longitude = $lng })

if ($BusinessId -ne "") {
    Write-Host ""
    Write-Host "--- Listing chat (POST /chats + /chats/:id/messages) ---" -ForegroundColor Yellow

    $session = Post-Json "/chats" @{ businessId = $BusinessId; visitorName = "Test" }
    if ($session -and $session.id) {
        $id = $session.id
        foreach ($q in @("opening hours", "phone number", "where is it located", "what services do you offer", "reviews", "asdfgh qwerty")) {
            Show-Reply "listing: '$q'" (Post-Json "/chats/$id/messages" @{ text = $q })
        }
    } else {
        Write-Host "Could not start a listing chat -- check the business id is approved." -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "(Skipping listing-chat tests -- pass -BusinessId to include them.)" -ForegroundColor DarkGray
}
