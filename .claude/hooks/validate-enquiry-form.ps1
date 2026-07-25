# =============================================================================
#  PreToolUse hook — enquiry form completeness gate
# =============================================================================
#  Blocks a Playwright-driven submit of the §6 contact form (index.html
#  #contactForm) unless every required field has been filled with a value that
#  passes the SAME rules script.js §6 enforces in the browser.
#
#  How it knows what is in the form: Playwright tool calls carry their values in
#  tool_input, so this hook records every fill/type/select into a per-session
#  state file, then checks the accumulated record when a submit click arrives.
#
#  Fails OPEN. A hook that throws must never wedge the session, so every
#  unexpected error exits 0 (allow) and leaves a line in the log file.
# =============================================================================

$ErrorActionPreference = 'Stop'

# --- Configuration ----------------------------------------------------------

# script.js §6 treats "message" as optional. Flip this to $true to demand it.
$REQUIRE_MESSAGE = $false

# What counts as "submit the enquiry form" in a click / keypress description.
$SUBMIT_PATTERN = 'book my free week|submit.*(enquiry|contact)|(enquiry|contact).*submit'

# Tool calls that put a value into a field.
$FILL_TOOLS = @(
  'mcp__playwright__browser_fill_form',
  'mcp__playwright__browser_type',
  'mcp__playwright__browser_select_option'
)

$stateDir = Join-Path $env:TEMP 'claude-enquiry-hooks'
$logPath  = Join-Path $stateDir 'hook.log'

function Write-Log([string]$message) {
  try {
    if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }
    Add-Content -Path $logPath -Value ("[{0}] pre  {1}" -f (Get-Date -Format 's'), $message)
  } catch { }
}

# Emit the deny verdict Claude Code understands, then stop.
function Deny([string]$reason) {
  $out = @{
    hookSpecificOutput = @{
      hookEventName          = 'PreToolUse'
      permissionDecision     = 'deny'
      permissionDecisionReason = $reason
    }
  }
  $out | ConvertTo-Json -Depth 6 -Compress
  exit 0
}

# Map a human-readable element description to a form field id.
# Order matters: "Email" and "Your name" both end in text that would match a
# loose /name/, so the specific labels are tested before the generic one.
function Resolve-FieldKey([string]$label) {
  if ([string]::IsNullOrWhiteSpace($label)) { return $null }
  $l = $label.ToLowerInvariant()
  if ($l -match '_honey|honeypot')                    { return '_honey' }
  if ($l -match 'e-?mail')                            { return 'email' }
  if ($l -match 'phone|mobile|\btel\b')               { return 'phone' }
  if ($l -match 'goal')                               { return 'goal' }
  if ($l -match 'message|anything we should know')    { return 'message' }
  if ($l -match 'name')                               { return 'name' }
  return $null
}

# --- The same rules as script.js §6 -----------------------------------------
#  Kept deliberately literal rather than clever: if §6 changes, the diff should
#  be obvious here too.

$EMAIL_RE = '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
$PHONE_RE = '^[+()\d\s-]{7,20}$'
$MIN_PHONE_DIGITS = 7

function Test-Field([string]$key, [string]$value) {
  $v = if ($null -eq $value) { '' } else { $value.Trim() }

  switch ($key) {
    'name' {
      if ($v.Length -lt 2) { return 'Name — please tell us your name (2 characters or more).' }
    }
    'email' {
      if ($v -notmatch $EMAIL_RE) { return "Email — ""$v"" doesn't look like a valid email address." }
    }
    'phone' {
      $digits = ([regex]::Matches($v, '\d')).Count
      if ($v -notmatch $PHONE_RE -or $digits -lt $MIN_PHONE_DIGITS) {
        return "Phone — ""$v"" is not a number we can reach you on (needs $MIN_PHONE_DIGITS+ digits)."
      }
    }
    'goal' {
      if ($v -eq '' -or $v -match '^choose one') { return 'Goal — pick the goal that fits you best.' }
    }
    'message' {
      if ($REQUIRE_MESSAGE -and $v -eq '') { return 'Message — tell us anything we should know.' }
    }
  }
  return $null
}

# --- Main -------------------------------------------------------------------

try {
  $raw = [Console]::In.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

  $payload   = $raw | ConvertFrom-Json
  $toolName  = [string]$payload.tool_name
  $toolInput = $payload.tool_input
  $sessionId = [string]$payload.session_id
  if ([string]::IsNullOrWhiteSpace($sessionId)) { $sessionId = 'no-session' }
  $sessionId = $sessionId -replace '[^A-Za-z0-9_-]', '_'

  if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }
  $statePath = Join-Path $stateDir "$sessionId.json"

  # Load whatever has been typed into the page so far this session.
  $fields = @{}
  if (Test-Path $statePath) {
    $saved = Get-Content -Path $statePath -Raw | ConvertFrom-Json
    if ($saved.fields) {
      foreach ($p in $saved.fields.PSObject.Properties) { $fields[$p.Name] = [string]$p.Value }
    }
  }

  # ---- 1. Recording pass: remember what this call puts into the form -------
  if ($FILL_TOOLS -contains $toolName) {
    if ($toolName -eq 'mcp__playwright__browser_fill_form' -and $toolInput.fields) {
      foreach ($f in $toolInput.fields) {
        $key = Resolve-FieldKey ([string]$f.name)
        if ($key) { $fields[$key] = [string]$f.value }
      }
    }
    elseif ($toolName -eq 'mcp__playwright__browser_type') {
      $key = Resolve-FieldKey ([string]$toolInput.element)
      if ($key) { $fields[$key] = [string]$toolInput.text }
    }
    elseif ($toolName -eq 'mcp__playwright__browser_select_option') {
      $key = Resolve-FieldKey ([string]$toolInput.element)
      if ($key) { $fields[$key] = [string](@($toolInput.values) -join ',') }
    }

    @{ fields = $fields; awaitingAnnounce = $false } |
      ConvertTo-Json -Depth 6 | Set-Content -Path $statePath -Encoding UTF8
    exit 0
  }

  # ---- 2. Gate pass: is this call the submit? ------------------------------
  $isSubmit = $false
  if ($toolName -eq 'mcp__playwright__browser_click') {
    $isSubmit = ([string]$toolInput.element) -match $SUBMIT_PATTERN
  }
  elseif ($toolName -eq 'mcp__playwright__browser_evaluate') {
    $fn = [string]$toolInput.function
    $isSubmit = ($fn -match 'contactForm') -and ($fn -match 'submit|requestSubmit')
  }

  if (-not $isSubmit) { exit 0 }

  # Bots fill the trap; a person never sees it. script.js drops these silently —
  # here it is worth saying out loud, because the only thing driving this form
  # is Claude, and Claude filling a honeypot is a mistake, not a bot.
  if ($fields.ContainsKey('_honey') -and -not [string]::IsNullOrWhiteSpace($fields['_honey'])) {
    Deny 'Enquiry form blocked: the _honey spam trap has a value. Clear it before submitting — script.js discards any submission that has it set, so this enquiry would never reach the inbox.'
  }

  $required = @('name', 'email', 'phone', 'goal')
  if ($REQUIRE_MESSAGE) { $required += 'message' }

  $problems = @()
  foreach ($key in $required) {
    $value = if ($fields.ContainsKey($key)) { $fields[$key] } else { '' }
    if ([string]::IsNullOrWhiteSpace($value)) {
      $problems += "$key — empty. Fill it before submitting."
      continue
    }
    $problem = Test-Field $key $value
    if ($problem) { $problems += $problem }
  }

  if ($problems.Count -gt 0) {
    $reason = "Enquiry form NOT submitted — $($problems.Count) field(s) would be rejected:`n  - " +
              ($problems -join "`n  - ") +
              "`n`nFill or correct these fields on #contactForm, then click 'Book my free week' again."
    Write-Log "denied submit: $($problems -join ' | ')"
    Deny $reason
  }

  # Valid. Leave a flag the PostToolUse hook reads to decide whether to speak.
  @{ fields = $fields; awaitingAnnounce = $true } |
    ConvertTo-Json -Depth 6 | Set-Content -Path $statePath -Encoding UTF8
  Write-Log 'allowed submit: all required fields valid'
  exit 0
}
catch {
  Write-Log "ERROR (failing open): $($_.Exception.Message)"
  exit 0
}
