# Cookie Consent & Download Ad Gate

Implemented in this working version:

- Persistent cookie consent banner with Accept All / Reject Non-essential / Settings.
- Optional analytics are only rendered after explicit `all` consent.
- Cookie policy updated to document necessary, analytics, advertising and local storage categories.
- Reusable `DownloadAdGate` component for tools that have a real file download action.
- The ad gate explicitly does not require an ad click. It is intended to be connected to the site's approved ad provider when the advertising account is configured.

Important: `AdSlot` is currently the project's visual ad placeholder. No ad network script or rewarded-ad SDK was added, so this version does not falsely claim that an advertisement is being served.
