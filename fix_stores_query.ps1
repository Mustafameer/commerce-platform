# Read the entire file
$content = Get-Content -Path server.ts -Raw

# Replace the old query with the new one
$oldQuery = "SELECT id, store_name, slug, logo_url, primary_color, is_active, store_type, status, owner_name, owner_phone, description"
$newQuery = "SELECT id, store_name, slug, logo_url, primary_color, is_active, store_type, status, owner_name, owner_phone, category as description"

if ($content -contains $oldQuery) {
    Write-Host "Found old query in file - replacing..."
    $content = $content -replace [regex]::Escape($oldQuery), $newQuery
    Set-Content -Path server.ts -Value $content
    Write-Host "File updated successfully!"
} else {
    Write-Host "Could not find old query in file"
}

# Verify the change
$after = Get-Content -Path server.ts -Raw
if ($after -contains $newQuery) {
    Write-Host "✅ Verification: File now contains correct query with 'category as description'"
} else {
    Write-Host "❌ Verification failed"
}
