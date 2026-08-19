/**
 * Match lineup workspace final — photos via player identity + desktop side-by-side.
 * Run: npm run test:lineup-workspace-final
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
console.log("→ lineup-workspace-final");

const page = readFileSync(join(root, "src/app/(site)/beheer/wedstrijden/[matchId]/page.tsx"), "utf8");
const editor = readFileSync(join(root, "src/components/admin/match-formation-editor.tsx"), "utf8");
const pitch = readFileSync(join(root, "src/components/match/formation-pitch.tsx"), "utf8");
const avatar = readFileSync(join(root, "src/components/players/player-photo-avatar.tsx"), "utf8");
const action = readFileSync(join(root, "src/actions/match-formation.ts"), "utf8");
const picker = readFileSync(join(root, "src/components/admin/match-player-picker.tsx"), "utf8");

assert.match(page, /photoByPlayerId/);
assert.match(page, /db\.players\.map\(\(p\) => \[p\.id, p\.photo_url/);
assert.match(page, /photo_url: photoByPlayerId\.get\(x\.player_id\)/);
assert.doesNotMatch(page, /from\("players"\)/);

assert.match(avatar, /PhotoOrFallback/);
assert.match(avatar, /data-player-id=\{playerId\}/);
assert.match(avatar, /object-\[center_20%\]/);
assert.match(avatar, /isValidImageUrl/);

assert.match(pitch, /PlayerPhotoAvatar/);
assert.match(pitch, /photoUrl=\{p\.photo_url\}/);
assert.match(pitch, /playerId=\{p\.player_id\}/);
assert.match(pitch, /Kies speelster/);
assert.match(pitch, /size === "workspace"/);
assert.match(pitch, /clamp\(760px,\s*78vw,\s*960px\)/);
assert.match(pitch, /minHeight:\s*"760px"/);

assert.match(editor, /data-lineup-workspace/);
assert.match(editor, /xl:grid-cols-\[minmax\(0,1fr\)_minmax\(320px,380px\)\]/);
assert.match(editor, /data-testid="lineup-selection-panel"/);
assert.match(editor, /xl:sticky xl:top-24/);
assert.match(editor, /data-selection-tab/);
assert.match(editor, /photo_url: p\.photo_url \?\? null/);
assert.match(editor, /size="workspace"/);
assert.match(editor, /Concept bewaren/);
assert.match(editor, /Opstelling bevestigen/);
assert.match(editor, /Op veld/);
assert.match(editor, /Gastspeelster toevoegen/);
assert.match(editor, /saveMatchFormationAction/);

assert.doesNotMatch(action, /photo_url/);
assert.match(action, /player_id: playerId/);
assert.match(action, /role: "starter"/);
assert.match(action, /role: "bench"/);
assert.match(action, /role: "absent"/);

assert.match(picker, /PlayerPhotoAvatar/);
assert.match(picker, /photo_url\?: string \| null/);

console.log("✓ lineup-workspace-final — assertions OK");
