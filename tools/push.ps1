# DocSuite one-click push script (Windows PowerShell)
# Usage:  powershell -File tools/push.ps1 [branch]
# It injects the gh CLI token as a one-shot auth header, so it works even in
# restricted environments (e.g. the DSH sandbox) without touching git config.
# In a normal terminal you can also run `gh auth setup-git` once, then plain
# `git push` will work.
param(
    [string]$Branch = 'main'
)
$ErrorActionPreference = 'Continue'
Set-Location (Join-Path $PSScriptRoot '..')

# Run git and judge success only by the exit code (git progress goes to stderr)
function Invoke-GitPush([string[]]$GitArgs) {
    git @GitArgs *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git push failed (exit code $LASTEXITCODE); check network and retry"
        exit 1
    }
}

# gh availability
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error 'gh CLI not found. Install GitHub CLI and run gh auth login first.'
    exit 1
}
gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error 'gh not logged in. Run gh auth login first.'
    exit 1
}

$token = gh auth token
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))

# 自动使用系统代理（Clash/mihomo 等）：直连 GitHub 443 常被墙，走本地代理可成功
$proxyArgs = @()
try {
    $ie = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings'
    if ($ie.ProxyEnable -eq 1 -and $ie.ProxyServer) {
        $p = ($ie.ProxyServer -split ';' | Where-Object { $_ -notmatch '^=' } | Select-Object -First 1)
        if ($p) { $proxyArgs = @('-c', "http.proxy=http://$p") }
    }
} catch { $proxyArgs = @() }

# Push branch and all tags (OpenSSL TLS backend avoids Windows schannel credential issues)
Invoke-GitPush @('-c', 'credential.helper=', '-c', 'http.sslBackend=openssl', $proxyArgs, '-c', "http.extraheader=AUTHORIZATION: Basic $basic", 'push', '-u', 'origin', $Branch)
Invoke-GitPush @('-c', 'credential.helper=', '-c', 'http.sslBackend=openssl', $proxyArgs, '-c', "http.extraheader=AUTHORIZATION: Basic $basic", 'push', 'origin', '--tags')

Write-Host ""
Write-Host "OK: pushed to origin/$Branch (with tags)"
