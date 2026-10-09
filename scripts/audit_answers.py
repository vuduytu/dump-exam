"""Audit data/questions.json against the ExamTopics HTML, read with html.parser (independent of parse_html.py's regex).

Usage: python3 -I scripts/audit_answers.py <PMP_examtopic.html> data/questions.json
Exits 1 if any Question differs. Fields: Choice letters, Suggested / Most Voted / Correct Answer, Votes.
"""
import json
import re
import sys
from html.parser import HTMLParser

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


class Cards(HTMLParser):
    """Collects one dict per `.exam-question-card`, tracking open elements on a stack."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.cards, self.stack, self.card = [], [], None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        classes = (a.get("class") or "").split()
        role = None
        if tag == "div" and "exam-question-card" in classes:
            self.card = {"header": "", "letters": [], "hidden": "", "badges": "", "suggested": None, "votes": None}
            self.cards.append(self.card)
            role = "card"
        elif self.card is not None:
            if tag == "div" and "card-header" in classes:
                role = "header"
            elif tag == "span" and "data-choice-letter" in a:
                self.card["letters"].append(a["data-choice-letter"])
                if "correct-hidden" in self.li_classes():
                    self.card["hidden"] += a["data-choice-letter"]
            elif tag == "span" and "most-voted-answer-badge" in classes and self.card["letters"]:
                self.card["badges"] += self.card["letters"][-1]
            elif tag == "span" and classes == ["correct-answer"]:
                self.card["suggested"] = ""
                role = "suggested"
            elif tag == "script" and a.get("type") == "application/json":
                self.card["votes"] = ""
                role = "votes"
        if tag not in VOID:
            self.stack.append((tag, role, classes))

    def li_classes(self):
        return next((c for t, _, c in reversed(self.stack) if t == "li"), [])

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):  # pop to the matching open tag; ignore stray end tags
            if self.stack[i][0] == tag:
                if any(r == "card" for _, r, _ in self.stack[i:]):
                    self.card = None
                del self.stack[i:]
                return

    def handle_data(self, data):
        if self.card is None:
            return
        roles = {r for _, r, _ in self.stack}
        for key in ("header", "suggested", "votes"):
            if key in roles:
                self.card[key] += data


def expected(card):
    """What parse_html.py should produce for this card, by the rules in CONTEXT.md."""
    suggested = (card["suggested"] or "").strip()
    if not re.fullmatch(r"[A-Z]+", suggested):
        suggested = ""
    votes = [
        {"letters": v["voted_answers"], "count": v["vote_count"], "mostVoted": v["is_most_voted"]}
        for v in json.loads(card["votes"] or "[]")
    ]
    most_voted = next((v["letters"] for v in votes if v["mostVoted"]), "")
    return {
        "choices": card["letters"],
        "suggestedAnswer": suggested,
        "mostVotedAnswer": most_voted,
        "correctAnswer": most_voted or suggested,
        "votes": votes,
    }


def main(src, dst):
    parser = Cards()
    parser.feed(open(src, encoding="utf-8").read())
    html_cards = {}
    for c in parser.cards:
        n = int(re.search(r"Question #(\d+)", c["header"]).group(1))
        html_cards[n] = c
    parsed = {q["number"]: q for q in json.load(open(dst, encoding="utf-8"))}

    problems = []
    for n in sorted(html_cards.keys() - parsed.keys()):
        problems.append(f"Q{n}: in HTML, missing from JSON")
    for n in sorted(parsed.keys() - html_cards.keys()):
        problems.append(f"Q{n}: in JSON, missing from HTML")
    for n in sorted(html_cards.keys() & parsed.keys()):
        card, want, got = html_cards[n], expected(html_cards[n]), parsed[n]
        got = {**got, "choices": [c["letter"] for c in got["choices"]]}
        for field, value in want.items():
            if got[field] != value:
                problems.append(f"Q{n} {field}: HTML={value!r} JSON={got[field]!r}")
        if card["suggested"] is None:
            problems.append(f"Q{n}: no correct-answer span in HTML")

    print(f"HTML cards: {len(parser.cards)} ({len(html_cards)} distinct numbers), JSON: {len(parsed)}")
    # Cross-checks inside the HTML itself: the highlighted choices should agree with the answer text.
    for n in sorted(html_cards.keys() & parsed.keys()):
        card, want = html_cards[n], expected(html_cards[n])
        if card["letters"] and want["suggestedAnswer"] and card["hidden"] != want["suggestedAnswer"]:
            print(f"  note Q{n}: correct-hidden choices {card['hidden']!r} != Suggested {want['suggestedAnswer']!r}")
        if card["badges"] and sorted(card["badges"]) != sorted(want["mostVotedAnswer"]):
            print(f"  note Q{n}: Most Voted badges {card['badges']!r} != Most Voted {want['mostVotedAnswer']!r}")
    unusable = [q for q in parsed.values() if not q["usable"]]
    print(f"Unusable: {len(unusable)}")
    for q in sorted(unusable, key=lambda q: q["number"]):
        reason = "no choices" if not q["choices"] else "no answer" if not q["correctAnswer"] else "answer not in choices"
        print(f"  Q{q['number']}: {reason} (suggested={q['suggestedAnswer']!r}, mostVoted={q['mostVotedAnswer']!r})")
    for p in problems:
        print("MISMATCH " + p)
    print(f"{len(problems)} mismatches")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
