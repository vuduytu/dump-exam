"""Parse the PgMP dump files (one .txt per Exam) into data/pgmp-questions.json and print a report.

Usage: python3 -I scripts/parse_pgmp.py <dir with the .txt dumps> data/pgmp-questions.json
Exits 1, writing nothing, if an answer line matches no Choice or the ids are not unique and clear of PMP ids.
"""
import glob
import html
import json
import os
import re
import sys
from datetime import datetime

PMP_BANK = os.path.join(os.path.dirname(__file__), "..", "data", "questions.json")
CHOICE = re.compile(r"^([A-Fa-f])\.\s+(.*)$")
ANSWER = re.compile(r"^The correct answers? (?:is|are):\s*(.*)$")
NOISE = re.compile(r"^(the answer is incorrect\.?|your answer( is correct\.)?|is incorrect\.|explanation:)$", re.I)


def norm(s):
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


def to_html(s):
    return html.escape(norm(s), quote=False)


def match_answer(answer, choices):
    """Letters of the Choices whose texts, joined by ", ", make up `answer` (a Choice text may hold a comma)."""
    if not answer:
        return ""
    for c in choices:
        t = norm(c["raw"])
        if answer == t:
            return c["letter"]
        if answer.startswith(t + ", "):
            rest = match_answer(answer[len(t) + 2:], [x for x in choices if x is not c])
            if rest:
                return "".join(sorted(c["letter"] + rest))
    return ""


def parse_block(number, lines):
    i = 0
    while i < len(lines) and not CHOICE.match(lines[i]):
        i += 1
    stem = [norm(l) for l in lines[:i] if l.strip()]
    if stem:
        stem[0] = re.sub(r"^:\s*", "", stem[0])  # one stem starts with ": "
    choices = []
    while i < len(lines):
        m = CHOICE.match(lines[i])
        expected = chr(ord("A") + len(choices))
        if m and m.group(1).upper() == expected:
            choices.append({"letter": expected, "raw": m.group(2)})
        elif lines[i].strip() or not choices:
            break
        else:  # a blank line inside the Choices: only skip it if the next Choice follows
            j = i + 1
            while j < len(lines) and not lines[j].strip():
                j += 1
            m2 = CHOICE.match(lines[j]) if j < len(lines) else None
            if not (m2 and m2.group(1).upper() == expected):
                break
            i = j - 1
        i += 1
    explanation, answer = [], None
    for line in lines[i:]:
        m = ANSWER.match(line)
        if m:
            answer = norm(m.group(1))
        elif line.strip() and not NOISE.match(line.strip()):
            explanation.append(to_html(line))
    correct = match_answer(answer, choices) if answer else ""
    return {
        "number": number,
        "stem": " ".join(stem),
        "text": "<br>".join(html.escape(s, quote=False) for s in stem),
        "choices": [{"letter": c["letter"], "text": to_html(c["raw"])} for c in choices],
        "suggestedAnswer": correct,
        "mostVotedAnswer": "",
        "correctAnswer": correct,
        "votes": [],
        "usable": bool(choices) and bool(correct),
        "explanation": "<br>".join(explanation) or None,
        "answerLine": answer,
    }


def exam_time(path):
    return datetime.strptime(os.path.basename(path)[:-4], "%m_%d_%Y %I_%M_%S %p")


def question_id(path, number):
    """Stable per file: seconds of the day in the file name * 1000 + number (fits the int column: < 86,400,000)."""
    t = exam_time(path)
    return (t.hour * 3600 + t.minute * 60 + t.second) * 1000 + number


def main(src, dst):
    files = sorted(glob.glob(os.path.join(src, "*.txt")), key=exam_time)
    questions, failures = [], []
    pmp_max = max(q["number"] for q in json.load(open(PMP_BANK, encoding="utf-8")))
    print(f"{'Exam':<24}{'Questions':>10}{'Unusable':>10}{'Multi':>7}{'No Expl.':>10}")
    for path in files:
        exam = os.path.basename(path)[:-4]
        text = open(path, encoding="utf-8-sig").read().replace("\r\n", "\n")
        parts = re.split(r"(?m)^Question (\d+)[ \t]*$", text)
        qs = [parse_block(int(parts[k]), parts[k + 1].split("\n")[1:]) for k in range(1, len(parts), 2)]
        numbers = [q["number"] for q in qs]
        if numbers != list(range(1, len(qs) + 1)) or len(qs) >= 1000:
            failures.append(f"{exam}: numbers are not 1..N with N < 1000")
        for q in qs:
            if q["answerLine"] and not q["correctAnswer"]:
                failures.append(f"no Choice matches {exam} · Câu {q['number']}: {q['answerLine']!r}")
            q.update(id=question_id(path, q["number"]), certification="PgMP", source=exam)
        questions += qs
        print(f"{exam:<24}{len(qs):>10}{sum(not q['usable'] for q in qs):>10}"
              f"{sum(len(q['correctAnswer']) > 1 for q in qs):>7}{sum(q['explanation'] is None for q in qs):>10}")

    # Duplicate Question: same stem ignoring case and every character that is not a letter or digit.
    usable_by_key = {}
    for q in questions:
        q["key"] = re.sub(r"[\W_]", "", q["stem"].lower())
        if q["usable"]:
            usable_by_key.setdefault(q["key"], []).append(q)
    for q in questions:
        q["duplicates"] = [{"exam": d["source"], "number": d["number"]} for d in usable_by_key.get(q["key"], []) if d is not q] or None

    ids = [q["id"] for q in questions]
    if len(set(ids)) != len(ids):
        failures.append("PgMP ids collide (two files with the same time of day)")
    if min(ids, default=pmp_max + 1) <= pmp_max:
        failures.append(f"a PgMP id is <= {pmp_max}, the largest PMP id")

    out = [{k: v for k, v in q.items() if k not in ("stem", "key", "answerLine")} for q in questions]
    if not failures:  # never leave a half-good bank behind
        with open(dst, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"{len(files)} Exams, {len(out)} Questions, {sum(not q['usable'] for q in out)} Unusable, "
          f"{sum(q['duplicates'] is not None for q in out)} with a Duplicate Question, "
          f"{len(failures)} failures -> {dst if not failures else 'nothing written'}")
    for f in failures:
        print("FAIL " + f)
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
