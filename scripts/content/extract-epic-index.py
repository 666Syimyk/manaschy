"""Extract section metadata, never the poem, from the four linked 2018 PDFs.

Usage: python scripts/content/extract-epic-index.py [PDF directory]
Requires PyMuPDF. Input files are orozbakov-2018-v1.pdf ... -v4.pdf.
The PDF files themselves are not distributed with this application.
"""

from hashlib import sha256
import json
from pathlib import Path
import re
import sys
from urllib.parse import quote

import pymupdf


ROOT = Path(__file__).resolve().parents[2]
INPUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tmp" / "epic"
OUTPUT = ROOT / "src" / "data" / "epic" / "catalog.json"
RANGES = {1: (11, 551, 552, 2), 2: (3, 543, 544, 2),
          3: (3, 558, 560, 7), 4: (3, 513, 516, 31)}


def spans(page):
    return [span for block in page.get_text("dict")["blocks"]
            for line in block.get("lines", []) for span in line["spans"]]


def extract():
    volumes, episodes = [], []
    for number, (first, last, count, expected_sections) in RANGES.items():
        path = INPUT / f"orozbakov-2018-v{number}.pdf"
        doc = pymupdf.open(path)
        assert len(doc) == count, f"Unexpected page count in {path}"
        volume_id = f"orozbakov-v{number}"
        url = "https://manas-discovery.kg/wp-content/uploads/2021/07/" + quote(
            f"С.ОРОЗБАКОВ_{number}-TOM_на-печать.pdf")
        volumes.append({
            "id": volume_id,
            "number": number,
            "title": f"Сагымбай Орозбаков. «Манас». {number}-том",
            "pdfUrl": url,
            "pageCount": count,
            "citation": f"Сагымбай Орозбаков. «Манас». {number}-том. "
                        "«Классикалык изилдөөлөр жана тексттер» сериясы. "
                        f"Бишкек: Принт Экспресс, 2018. {count} б.",
            "sha256": sha256(path.read_bytes()).hexdigest(),
        })
        headings = []
        for index in range(first - 1, last):
            page_spans = spans(doc[index])
            bold = [span for span in page_spans if "Bold" in span["font"]
                    and len(span["text"].strip()) > 4 and span["bbox"][1] < 620]
            if not bold:
                continue
            title = " ".join(span["text"].strip() for span in bold)
            title = re.sub(r"(?<=\w)-\s+(?=\w)", "", title)
            title = re.sub(r"\s+", " ", title)
            heading_top = min(span["bbox"][1] for span in bold)
            prior_text = any(
                span["bbox"][1] >= 40 and span["bbox"][3] <= heading_top
                and "Bold" not in span["font"] and len(span["text"].strip()) > 4
                for span in page_spans)
            headings.append({"title": title, "page": index + 1,
                             "startsMidPage": prior_text})
        assert len(headings) == expected_sections, f"Review headings of volume {number}"
        assert headings[0]["page"] == first
        for index, heading in enumerate(headings):
            next_heading = headings[index + 1] if index + 1 < len(headings) else None
            end = (next_heading["page"] - (0 if next_heading["startsMidPage"] else 1)
                   if next_heading else last)
            episodes.append({
                "id": f"{volume_id}-{index + 1:03}",
                "title": heading["title"],
                "volumeId": volume_id,
                "order": len(episodes) + 1,
                "startPage": heading["page"],
                "endPage": end,
                "startsMidPage": heading["startsMidPage"],
                "lineCount": 0,
                "access": "source",
                "pdfUrl": f"{url}#page={heading['page']}",
            })
        doc.close()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps({"volumes": volumes, "episodes": episodes},
                                 ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {len(episodes)} section entries in {len(volumes)} volumes to {OUTPUT}")


if __name__ == "__main__":
    extract()
