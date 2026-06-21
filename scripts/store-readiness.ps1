$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

function Require-File($path, $message) {
  if (-not (Test-Path -LiteralPath $path)) {
    $script:failures.Add($message)
  }
}

function Require-Text($path, $needle, $message) {
  if (-not (Test-Path -LiteralPath $path)) {
    return
  }
  $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  if (-not $content.Contains($needle)) {
    $script:failures.Add($message)
  }
}

function Reject-Text($path, $needle, $message) {
  if (-not (Test-Path -LiteralPath $path)) {
    return
  }
  $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
  if ($content.Contains($needle)) {
    $script:failures.Add($message)
  }
}

Require-File "app.json" "Missing app.json."
Require-File "eas.json" "Missing eas.json for EAS production builds."
Require-File "docs/privacy-policy.md" "Missing privacy policy draft."
Require-File "docs/terms.md" "Missing terms draft."
Require-File "docs/store-submission-checklist.md" "Missing store submission checklist."
Require-File "docs/privacy.html" "Missing public privacy policy page."
Require-File "docs/terms.html" "Missing public terms page."
Require-File "docs/support.html" "Missing public support page."

$privacyUrl = "https://official891.github.io/mamoru-tana/privacy.html"
$termsUrl = "https://official891.github.io/mamoru-tana/terms.html"
$supportUrl = "https://official891.github.io/mamoru-tana/support.html"
$supportEmail = "birdvitals.support@gmail.com"

Require-Text "docs/store-urls.md" $privacyUrl "Store URLs doc is missing the public privacy policy URL."
Require-Text "docs/store-urls.md" $termsUrl "Store URLs doc is missing the public terms URL."
Require-Text "docs/store-urls.md" $supportUrl "Store URLs doc is missing the public support URL."
Require-Text "docs/support.html" $supportEmail "Support page must include the support email address."
Require-Text "docs/support.html" "support-form" "Support page must include the contact form."
Require-Text "docs/privacy-policy.md" $supportEmail "Privacy policy must disclose the support email contact path."
Reject-Text "docs/privacy-policy.md" "ストア公開前に" "Privacy policy still contains a pre-release placeholder."
Reject-Text "docs/terms.md" "ストア公開前に" "Terms still contains a pre-release placeholder."
Reject-Text "docs/support.html" "https://github.com/`"" "Support page still contains a generic GitHub URL."
Reject-Text "docs/support.html" "GitHub Issues" "Support page still points users to GitHub Issues instead of the contact form."
Reject-Text "src/store-links.ts" "github.com/official891/mamoru-tana/issues" "App support links should not point users to GitHub Issues."

if (Test-Path -LiteralPath "app.json") {
  $app = Get-Content -LiteralPath "app.json" -Raw -Encoding UTF8 | ConvertFrom-Json
  if (-not $app.expo.name) { $failures.Add("Missing app name in app.json.") }
  if (-not $app.expo.description) { $failures.Add("Missing app description in app.json.") }
  if (-not $app.expo.ios.bundleIdentifier) { $failures.Add("Missing iOS bundleIdentifier.") }
  if (-not $app.expo.android.package) { $failures.Add("Missing Android package.") }
  if ($null -eq $app.expo.android.permissions) { $warnings.Add("Android permissions is undefined. Keep permissions minimal.") }
  $ats = $app.expo.ios.infoPlist.NSAppTransportSecurity
  if ($null -eq $ats -or $ats.NSAllowsArbitraryLoads -ne $false) {
    $failures.Add("iOS ATS must explicitly block arbitrary network loads.")
  }
  if ($app.expo.android.allowBackup -ne $false) {
    $failures.Add("Android allowBackup must be false for the current local-only data policy.")
  }
  $permissions = @($app.expo.android.permissions)
  if ($permissions -notcontains "android.permission.POST_NOTIFICATIONS") {
    $failures.Add("Android POST_NOTIFICATIONS permission must be explicit because due reminders are implemented.")
  }
  $blockedPermissions = @($app.expo.android.blockedPermissions)
  foreach ($blockedPermission in @("android.permission.INTERNET", "android.permission.READ_EXTERNAL_STORAGE", "android.permission.WRITE_EXTERNAL_STORAGE", "android.permission.SYSTEM_ALERT_WINDOW")) {
    if ($blockedPermissions -notcontains $blockedPermission) {
      $failures.Add("Android blockedPermissions must remove $blockedPermission.")
    }
  }
}

if (Test-Path -LiteralPath "eas.json") {
  $eas = Get-Content -LiteralPath "eas.json" -Raw -Encoding UTF8 | ConvertFrom-Json
  $productionPreview = $eas.build.production.env.EXPO_PUBLIC_LOCAL_PLAN_PREVIEW
  if ($productionPreview -eq "true") {
    $failures.Add("Production EAS profile must not enable EXPO_PUBLIC_LOCAL_PLAN_PREVIEW.")
  }
  foreach ($profile in $eas.build.PSObject.Properties) {
    $preview = $profile.Value.env.EXPO_PUBLIC_LOCAL_PLAN_PREVIEW
    if ($preview -eq "true" -and $profile.Value.distribution -ne "internal") {
      $failures.Add("EAS profile '$($profile.Name)' enables plan preview but is not internal distribution.")
    }
  }
}

if ($env:EXPO_PUBLIC_LOCAL_PLAN_PREVIEW -eq "true") {
  $failures.Add("Do not submit with EXPO_PUBLIC_LOCAL_PLAN_PREVIEW=true. It enables local paid-plan preview.")
}

if ($failures.Count -gt 0) {
  Write-Host "Store readiness checks failed:" -ForegroundColor Red
  foreach ($failure in $failures) {
    Write-Host " - $failure" -ForegroundColor Red
  }
  exit 1
}

Write-Host "Store readiness local checks passed." -ForegroundColor Green
if ($warnings.Count -gt 0) {
  Write-Host "Warnings:" -ForegroundColor Yellow
  foreach ($warning in $warnings) {
    Write-Host " - $warning" -ForegroundColor Yellow
  }
}
Write-Host "Paid subscription release still requires App Store Connect and Google Play Billing products."
