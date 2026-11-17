# Source-only original-text catalog

This catalog links to all four publicly accessible 2018 volumes of the Sagymbay
Orozbakov variant, hosted at manas-discovery.kg. It contains metadata and printed
section headings only: **no verse, PDF, translation, or editorial essay is bundled**.
The PDFs have Institute / Print Express copyright notices and no redistribution
license was established. `access: 'source'` must remain explicit in the UI.

The 42 entries follow actual bold headings in the PDF body: 2 / 2 / 7 / 31 by
volume. The first entry in each volume is headed «МАНАС» ЭПОСУ. It is the opening
portion of that volume, not a claim that a new narrative episode starts there.
Volumes I and II do not provide a detailed episode table of contents. We do not
invent additional narrative headings to make the catalog look larger. This is a
navigation index for this particular four-volume edition, not a claim to contain
all variants or all parts of the Manas trilogy.

Page ranges cover the original text: I 11–551, II 3–543, III 3–558, IV 3–513.
Preface, publication information and tables of contents are outside these ranges.
PDF and printed page numbering agree. Adjacent sections can share a page when a
heading occurs after the preceding section's final verses. `startsMidPage` records
that condition. A PDF viewer may ignore the standard `#page=N` fragment; the UI
must also display the page number. `lineCount: 0` means no local text lines, not an
empty source episode.

The local web reader requests one page at a time from `scripts/reader/server.mjs`.
It extracts selectable text from a hash-verified source PDF in memory, preserves
verse lines and column order, and clips shared pages at section headings. No full
text corpus is written or included in a web/native bundle. The helper is loopback
only; static export does not deploy it. See `docs/EPIC_READER.md` for startup,
source access, extraction limitations, and rights constraints.

Regenerate metadata with `python scripts/content/extract-epic-index.py` after
placing the four inspected PDFs in `tmp/epic/`. PyMuPDF is required. The script
checks page and heading counts and records file SHA-256 fingerprints. Review any
new edition before changing the expected values. Text extraction can preserve
mixed Latin/Cyrillic glyphs already present in the PDF; it does not rewrite them.
