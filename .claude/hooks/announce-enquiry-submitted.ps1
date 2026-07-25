# =============================================================================
#  PostToolUse hook — spoken confirmation after an enquiry submit
# =============================================================================
#  Speaks a thank-you out loud once the enquiry form has actually been
#  submitted. It only fires when the PreToolUse hook (validate-enquiry-form.ps1)
#  has flagged the submit as valid AND the tool call itself came back without an
#  error, so a blocked or failed submit stays silent.
#
#  Fails OPEN and silent — a missing sound card must not break the session.
# =============================================================================

$ErrorActionPreference = 'Stop'

# --- Configuration ----------------------------------------------------------

# Spoken aloud, so this is the read-aloud wording rather than the literal
# on-screen copy. Edit freely; nothing else depends on it.
$MESSAGE = 'Thank you for your submission. We will get back to you in 3 business days.'

$RATE   = 0    # -10 (slowest) .. 10 (fastest)
$VOLUME = 100  # 0 .. 100

$stateDir = Join-Path $env:TEMP 'claude-enquiry-hooks'
$logPath  = Join-Path $stateDir 'hook.log'

function Write-Log([string]$message) {
  try {
    if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }
    Add-Content -Path $logPath -Value ("[{0}] post {1}" -f (Get-Date -Format 's'), $message)
  } catch { }
}

try {
  $raw = [Console]::In.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }

  $payload   = $raw | ConvertFrom-Json
  $sessionId = [string]$payload.session_id
  if ([string]::IsNullOrWhiteSpace($sessionId)) { $sessionId = 'no-session' }
  $sessionId = $sessionId -replace '[^A-Za-z0-9_-]', '_'

  $statePath = Join-Path $stateDir "$sessionId.json"
  if (-not (Test-Path $statePath)) { exit 0 }

  $state = Get-Content -Path $statePath -Raw | ConvertFrom-Json
  if (-not $state.awaitingAnnounce) { exit 0 }

  # The Pre hook approved this submit, but approval is not delivery: if
  # Playwright reported an error the click never landed, so say nothing.
  $response = $payload.tool_response | ConvertTo-Json -Depth 8 -Compress
  if ($response -and $response -match '"is_error"\s*:\s*true') {
    Write-Log 'submit tool errored — staying silent'
    @{ fields = $state.fields; awaitingAnnounce = $false } |
      ConvertTo-Json -Depth 6 | Set-Content -Path $statePath -Encoding UTF8
    exit 0
  }

  # One announcement per submit. Clear the flag BEFORE speaking so a crash in
  # the synthesiser cannot leave it armed for the next unrelated tool call.
  @{ fields = $state.fields; awaitingAnnounce = $false } |
    ConvertTo-Json -Depth 6 | Set-Content -Path $statePath -Encoding UTF8

  Add-Type -AssemblyName System.Speech
  $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
  try {
    $synth.Rate   = $RATE
    $synth.Volume = $VOLUME
    $synth.SetOutputToDefaultAudioDevice()
    $synth.Speak($MESSAGE)
  } finally {
    $synth.Dispose()
  }

  Write-Log "spoke confirmation"

  # Tell Claude what the user just heard, so the transcript matches the room.
  @{
    hookSpecificOutput = @{
      hookEventName    = 'PostToolUse'
      additionalContext = "Enquiry submitted. Spoken confirmation played to the user: ""$MESSAGE"""
    }
  } | ConvertTo-Json -Depth 6 -Compress

  exit 0
}
catch {
  Write-Log "ERROR (failing open): $($_.Exception.Message)"
  exit 0
}
