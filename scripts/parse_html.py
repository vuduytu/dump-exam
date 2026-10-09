"""Parse the ExamTopics PMP HTML dump into data/questions.json.

Usage: python3 -I scripts/parse_html.py <PMP_examtopic.html> data/questions.json
"""
import html
import json
import re
import sys

CARD = '<div class="card exam-question-card'
ALLOWED_TAGS = {"br", "img", "b", "strong", "i", "em", "u", "ul", "ol", "li", "p", "sub", "sup"}


def clean(fragment):
    """Keep a tiny tag whitelist; rewrite image src to local /media path; trim whitespace."""
    def tag(m):
        name = m.group(2).lower()
        if name not in ALLOWED_TAGS:
            return ""
        if name == "img":
            src = re.search(r'src="([^"]+)"', m.group(0))
            return f'<img src="/media/{src.group(1).rsplit("/", 1)[-1]}">' if src else ""
        return f"<{m.group(1)}{name}>"

    out = re.sub(r"<!--.*?-->", "", fragment, flags=re.S)
    out = re.sub(r"<(script|style)\b.*?</\1\s*>", "", out, flags=re.S | re.I)
    out = re.sub(r"<(/?)([a-zA-Z0-9]+)[^>]*>", tag, out)
    out = re.sub(r"\s+", " ", out).strip()
    return re.sub(r"\s*<br>\s*", "<br>", out)


def parse_card(c):
    number = int(re.search(r"Question #(\d+)", c).group(1))
    body = re.search(r'<p class="card-text">(.*?)</p>\s*<!-- exam-view49', c, re.S)
    choices = [
        {"letter": letter, "text": clean(html.unescape(re.sub(r'<span class="badge.*?</span>', "", text, flags=re.S)))}
        for letter, text in re.findall(
            r'data-choice-letter="([A-Z])">.*?</span>(.*?)</li>', c, re.S)
    ]
    votes_json = re.search(r'<script id="\d+" type="application/json">(.*?)</script>', c, re.S)
    votes = [
        {"letters": v["voted_answers"], "count": v["vote_count"], "mostVoted": v["is_most_voted"]}
        for v in (json.loads(votes_json.group(1)) if votes_json else [])
    ]
    suggested = re.search(r'<span class="correct-answer">(.*?)</span>', c, re.S).group(1).strip()
    if not re.fullmatch(r"[A-Z]+", suggested):
        suggested = ""  # image / empty answer (drag-drop etc.)
    most_voted = next((v["letters"] for v in votes if v["mostVoted"]), "")
    correct = most_voted or suggested
    letters = {ch["letter"] for ch in choices}
    usable = bool(choices) and bool(correct) and set(correct) <= letters
    return {
        "number": number,
        "text": clean(html.unescape(body.group(1))) if body else "",
        "choices": choices,
        "suggestedAnswer": suggested,
        "mostVotedAnswer": most_voted,
        "correctAnswer": correct,
        "votes": votes,
        "usable": usable,
        "images": sorted(set(re.findall(r'src="(/assets/media/[^"]+)"', c))),
    }


def main(src, dst):
    page = open(src, encoding="utf-8").read()
    cards = [CARD + part for part in page.split(CARD)[1:]]
    questions = sorted((parse_card(c) for c in cards), key=lambda q: q["number"])
    numbers = [q["number"] for q in questions]
    assert len(numbers) == len(set(numbers)), "duplicate question numbers"
    with open(dst, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=1)
    print(f"{len(questions)} questions, {sum(q['usable'] for q in questions)} usable -> {dst}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
