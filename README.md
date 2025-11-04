## Restore this project to a saved state

This project uses Git snapshots (tags) and a timestamped ZIP backup so you can safely return to a known good state.

### Latest snapshot details
- Tag: `snapshot-20251104-194908`
- ZIP: `C:\Users\Simon\Documents\polymarket-live-feed-20251104-194909.zip`

### Restore using Git (safe, non-destructive)
This creates a new branch at the snapshot, leaving your current work intact.

```powershell
cd "C:\Users\Simon\Documents\polymarket-live-feed"
git switch -c view-snapshot snapshot-20251104-194908
```

To see available snapshots:
```powershell
cd "C:\Users\Simon\Documents\polymarket-live-feed"
git tag --list
# or
git log --oneline --decorate --graph -n 20
```

### Restore using Git (make working copy match snapshot)
This is destructive to uncommitted changes. Make sure you've saved anything important first.

```powershell
cd "C:\Users\Simon\Documents\polymarket-live-feed"
git reset --hard snapshot-20251104-194908
```

### Restore from the ZIP backup
This does not affect your current project folder; it extracts to a separate location.

```powershell
Expand-Archive -Path "C:\Users\Simon\Documents\polymarket-live-feed-20251104-194909.zip" -DestinationPath "C:\Users\Simon\Documents\polymarket-live-feed-restore"
```

### Create a new snapshot later
Run these commands in PowerShell from the project root to save a new checkpoint and tag it.

```powershell
cd "C:\Users\Simon\Documents\polymarket-live-feed"
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
git add -A
git commit -m "chore: snapshot $ts"
git tag -a "snapshot-$ts" -m "snapshot-$ts"
```

Optionally list your snapshots after:
```powershell
git tag --list
```

### Notes
- A basic `.gitignore` is included to avoid committing caches and build artifacts.
- Prefer the non-destructive restore first (new branch). Use the destructive `reset --hard` only when you intend to fully roll back the working copy.


