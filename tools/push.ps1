# DocSuite 一键推送脚本（Windows PowerShell）
# 用法:  pwsh tools/push.ps1 [分支名]
# 说明: 通过 gh CLI 的 token 一次性注入认证头推送，不修改任何全局/仓库配置文件，
#       在受限环境（如 DSH 沙箱）也可用。日常在普通终端可先执行 `gh auth setup-git`
#       配置持久凭据助手，之后直接 `git push`。
param(
    [string]$Branch = 'main'
)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# gh 可用性检查
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Error '未找到 gh CLI，请先安装 GitHub CLI 并执行 gh auth login'
    exit 1
}
gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Error 'gh 未登录，请先执行 gh auth login'
    exit 1
}

$token = gh auth token
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("x-access-token:$token"))

# 推送分支与所有 tag（用 OpenSSL TLS 后端，规避 Windows schannel 凭据问题）
git -c credential.helper= -c http.sslBackend=openssl -c http.extraheader="AUTHORIZATION: Basic $basic" push -u origin $Branch
git -c credential.helper= -c http.sslBackend=openssl -c http.extraheader="AUTHORIZATION: Basic $basic" push origin --tags

Write-Host "`n✔ 已推送到 origin/$Branch （含 tags）"
