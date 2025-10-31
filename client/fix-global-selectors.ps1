# Fix global selectors in CSS modules by wrapping them with :global()
$files = Get-ChildItem -Path "styles" -Filter "*.module.css" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Wrap common global selectors
    $content = $content -replace '(\s+)(html|body|main|header|footer|nav|section|article|aside)\s*\{', '$1:global($2) {'
    $content = $content -replace '^(html|body|main|header|footer|nav|section|article|aside)\s*\{', ':global($1) {'
    
    # Fix * selector
    $content = $content -replace '(\s+)\*\s*\{', '$1:global(*) {'
    $content = $content -replace '^\*\s*\{', ':global(*) {'
    
    Set-Content $file.FullName -Value $content
    Write-Host "Fixed $($file.Name)"
}

Write-Host "`n✅ All global selectors fixed!"
