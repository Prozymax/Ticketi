# Update imports in all files
$files = @(
    "app/create-event/payment/page.tsx",
    "app/profile/page.tsx",
    "app/onboarding/edit-username/page.tsx",
    "app/onboarding/finalizing-profile/page.tsx",
    "app/onboarding/completed/page.tsx",
    "app/onboarding/authenticate/page.tsx",
    "app/onboarding/authenticate/components/page.tsx",
    "app/event-hub/page.tsx",
    "app/event-hub/events/components/events.tsx",
    "app/event-hub/events/components/empyEvents.tsx",
    "app/event-hub/tickets/components/tickets.tsx",
    "app/event-hub/tickets/components/emptyTickets.tsx",
    "app/events/components/empty_catalogue/page.tsx",
    "app/events/components/brand_nav/page.tsx",
    "app/events/components/catalogue/EventCatalogue.tsx",
    "app/buy-ticket/ticket/ticket.tsx",
    "app/components/BottomNavigation.tsx",
    "app/splash/[content]/page.tsx",
    "app/splash/components/page.tsx"
)

# Replace .css with .module.css in imports
foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace 'import "@/styles/([^"]+)\.css"', 'import styles from "@/styles/$1.module.css"'
        $content = $content -replace 'import ''@/styles/([^'']+)\.css''', 'import styles from "@/styles/$1.module.css"'
        $content = $content -replace 'import "@/styles/mobileview/([^"]+)\.css"', 'import "@/styles/mobileview/$1.module.css"'
        $content = $content -replace 'import ''@/styles/mobileview/([^'']+)\.css''', 'import "@/styles/mobileview/$1.module.css"'
        Set-Content $file -Value $content
        Write-Host "Updated imports in $file"
    }
}

# Convert classNames
foreach ($file in $files) {
    if (Test-Path $file) {
        node convert-to-modules.js $file
    }
}

Write-Host "`n✅ All files converted!"
