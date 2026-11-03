# HOLO ATELIER

원신·스타레일·명조·블루 아카이브 캐릭터 218종의 홀로그램 카드를 만드는 웹 앱입니다.

로컬 실행: `python3 -m http.server 4173 --directory dist` → http://localhost:4173

별도 설치나 API 키 없이 실행됩니다.

Browser-local Korean holographic character card studio for Genshin Impact, Honkai: Star Rail, Wuthering Waves and Blue Archive.

The curated roster contains 218 female character and outfit presets: 50 Genshin, 50 Star Rail, 32 Wuthering Waves, and 86 Blue Archive presets. The selection includes recognizable lower-rarity characters and popular Blue Archive outfits. There is no fixed per-game cap. Each has official transparent character artwork, an official thumbnail, and a lore-appropriate scene. Characters with signature equipment include official weapon / light cone / unique gun artwork. Some Wuthering Waves presets use a clearly labeled recommended weapon; characters without an established signature leave equipment blank. Scene assets are shared when characters belong to the same region or setting. Scenery is custom generated; character and equipment artwork is official. All assets are served locally without third-party requests. No artist names or source links are displayed in the app or exports.

Cards support editable Korean text and sample stats, word-aware quotation wrapping with explicit Enter line breaks, front/back rotation, 0–100% hologram strength, browser-local drafts and collections, 1000×1500 PNG exports and self-contained interactive HTML exports. Color swatches change the frame palette while preserving the selected character's lore scenery. Unknown manually entered weapons do not show an unrelated signature icon.

Furina's default quotation is a Korean voice-over excerpt laid out across four lines. Blue Archive defaults use localized greeting data; other quotes are left blank. Stats are illustrative and no game account data is fetched.

## Development

Buildless ES modules; serve `dist/` over HTTP. `.openai/hosting.json` retains the existing private Sites identity. `dist/catalog.js` holds the curated metadata. `scripts/expand-*.py` document imports and `scripts/merge-expanded.py` merges downloaded snapshots; `scripts/curate-popular.py` and `scripts/assign-scenes.py` validate assets and scene assignments. Source maps are retained for background maintenance. Source caches live outside the app in `/workspace/catalog-data`.

Official artwork sources: HoYoverse character website covers and genshin-db/Enka metadata; StarRailRes official character previews and light cone portraits; Encore-hosted Wuthering Waves game resources; SchaleDB Blue Archive portraits and unique guns. Characters are not redrawn. Korean fonts are Noto Serif/Sans CJK KR with bundled SIL OFL license.

## Verification

Browser checks cover all 218 render/export-safe asset sets, including blank-signature characters, character selection, lore scenery, quote line breaks, signature equipment controls, hologram intensity and persistence, collection save/reload, PNG dimensions, offline HTML interaction, and mobile layouts at 390px and 320px.

All 218 presets use the portrait-led front layout, with alpha-bound framing, game-specific crop scales and per-character focus corrections. Card and application typography uses locally bundled Pretendard Variable (SIL OFL); exports rasterize that typography.
