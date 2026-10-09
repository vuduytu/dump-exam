import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { db } from "@/db";
import { examQuestions, exams, questions, users } from "@/db/schema";
import { generateExams, seedQuestions, seedTags } from "@/db/seed";
import { abandonAttempt, AttemptNotFound, getAttempt, getResult, listAttempts, saveAnswer, setMark, startAttempt, submitAttempt } from "@/lib/attempts";
import { openDrills, startDrill, topicStats } from "@/lib/drills";
import { getScoreboard } from "@/lib/scoreboard";
import { certificationsOf, createUser, currentCertification, listUsers, NoAccess, NoCertification, NotAdmin, setCertifications, UserNotFound } from "@/lib/users";
import { closeDb, resetDb } from "./db";

// Two PgMP Questions of one PgMP Exam; tagged with a PMP Task only so a PgMP Drill can be drawn before ticket 03.
const PGMP_Q = [900001, 900002];
let pgmpExam: number;
let admin: number;
let pam: number; // PMP only
let gus: number; // PgMP only
let both: number; // PMP and PgMP

before(async () => {
  await resetDb();
  await seedQuestions(JSON.parse(readFileSync("data/questions.json", "utf8")));
  await seedTags(JSON.parse(readFileSync("data/question-tags.json", "utf8"))); // before the PgMP Questions: it wants every Question tagged
  await generateExams();
  await db.insert(questions).values(
    PGMP_Q.map((id) => ({
      id,
      certification: "PgMP" as const,
      text: `PgMP ${id}`,
      choices: ["A", "B", "C", "D"].map((letter) => ({ letter, text: letter })),
      suggestedAnswer: "A",
      mostVotedAnswer: "",
      correctAnswer: "A",
      votes: [],
      usable: true,
      task: "people-1",
    })),
  );
  [{ insertId: pgmpExam }] = await db.insert(exams).values({ name: "PgMP 1", certification: "PgMP" });
  await db.insert(examQuestions).values(PGMP_Q.map((questionId, i) => ({ examId: pgmpExam, position: i + 1, questionId })));
  [{ insertId: admin }] = await db.insert(users).values({ email: "admin@x.test", passwordHash: "-", isAdmin: true });
  pam = (await createUser(admin, "pam@x.test", "pam-pass-1", ["PMP"])).id;
  gus = (await createUser(admin, "gus@x.test", "gus-pass-1", ["PgMP"])).id;
  both = (await createUser(admin, "both@x.test", "both-pass-1", ["PgMP", "PMP"])).id;
});
after(closeDb);

test("createUser and setCertifications need at least one known Certification; an Admin has them all", async () => {
  await assert.rejects(createUser(admin, "nobody@x.test", "nobody-pass-1", []), NoCertification);
  await assert.rejects(createUser(admin, "nobody@x.test", "nobody-pass-1", ["CAPM"]), NoCertification);
  await assert.rejects(setCertifications(admin, pam, []), NoCertification);
  await assert.rejects(setCertifications(admin, 999999, ["PMP"]), UserNotFound);
  await assert.rejects(setCertifications(pam, pam, ["PMP", "PgMP"]), NotAdmin);
  const list = await listUsers(admin);
  assert.deepEqual(list.map((u) => [u.email, u.certifications]), [
    ["admin@x.test", ["PMP", "PgMP"]],
    ["pam@x.test", ["PMP"]],
    ["gus@x.test", ["PgMP"]],
    ["both@x.test", ["PMP", "PgMP"]],
  ]);
  assert.deepEqual(await certificationsOf(admin), ["PMP", "PgMP"]);
});

test("the current Certification is the saved choice when still allowed, else the first allowed one", async () => {
  assert.deepEqual(await currentCertification(both, "PgMP"), { certs: ["PMP", "PgMP"], current: "PgMP" });
  assert.deepEqual(await currentCertification(both, undefined), { certs: ["PMP", "PgMP"], current: "PMP" });
  assert.deepEqual(await currentCertification(gus, "PMP"), { certs: ["PgMP"], current: "PgMP" });
});

test("a User without Certification Access cannot start an Exam or a Drill of it, even by id", async () => {
  await assert.rejects(startAttempt(pam, pgmpExam), NoAccess);
  await assert.rejects(startAttempt(gus, 1), NoAccess); // a PMP Exam
  await assert.rejects(startAttempt(pam, 999999), NoAccess); // unknown Exam: same answer
  await assert.rejects(startDrill(pam, "PgMP", "people-1", 10), NoAccess);
  await assert.rejects(listAttempts(pam, "PgMP"), NoAccess);
  await assert.rejects(topicStats(pam, "PgMP"), NoAccess);
  await assert.rejects(openDrills(pam, "PgMP"), NoAccess);
  await assert.rejects(startDrill(pam, "nope" as "PMP", "people-1", 10), NoAccess); // a forged Certification from a request
});

test("Home, Drill and History data are filtered by Certification", async () => {
  const id = await startAttempt(gus, pgmpExam);
  await submitAttempt(gus, id);
  assert.deepEqual((await listAttempts(gus, "PgMP")).map((a) => a.id), [id]);
  await assert.rejects(listAttempts(gus, "PMP"), NoAccess);

  const pgmpPeople = (await topicStats(gus, "PgMP")).find((d) => d.domain === "People")!;
  assert.equal(pgmpPeople.total, 2); // only the PgMP Questions
  assert.equal(pgmpPeople.done, 0); // the submitted Attempt had no answers
  const drill = await startDrill(gus, "PgMP", "people-1", 10);
  assert.deepEqual((await getAttempt(gus, drill)).questions.map((q) => q.id).sort(), PGMP_Q);
  assert.equal((await openDrills(gus, "PgMP")).get("people-1")?.id, drill);
  await assert.rejects(openDrills(gus, "PMP"), NoAccess);
  await abandonAttempt(gus, drill);

  const pmpDrill = await startDrill(pam, "PMP", "people-1", 20);
  assert.ok((await getAttempt(pam, pmpDrill)).questions.every((q) => !PGMP_Q.includes(q.id)));
  await abandonAttempt(pam, pmpDrill);
});

test("revoking hides every Exam, Drill, Attempt and Result of the Certification; granting again shows them unchanged", async () => {
  const done = await startAttempt(both, pgmpExam);
  await saveAnswer(both, done, PGMP_Q[0], ["A"]);
  const score = await submitAttempt(both, done);
  const open = await startAttempt(both, pgmpExam);
  await saveAnswer(both, open, PGMP_Q[1], ["B"]);
  const drill = await startDrill(both, "PgMP", "people-1", 10);
  const pmp = await startAttempt(both, 1);

  await setCertifications(admin, both, ["PMP"]);
  assert.deepEqual(await certificationsOf(both), ["PMP"]);
  for (const blocked of [
    () => getResult(both, done),
    () => getAttempt(both, open),
    () => getAttempt(both, drill),
    () => saveAnswer(both, open, PGMP_Q[0], ["A"]),
    () => setMark(both, open, PGMP_Q[0], true),
    () => submitAttempt(both, open),
    () => abandonAttempt(both, drill),
  ])
    await assert.rejects(blocked, AttemptNotFound);
  await assert.rejects(startAttempt(both, pgmpExam), NoAccess);
  await assert.rejects(listAttempts(both, "PgMP"), NoAccess);
  assert.equal((await getAttempt(both, pmp)).id, pmp); // PMP untouched

  await setCertifications(admin, both, ["PgMP", "PMP"]);
  assert.equal((await getResult(both, done)).score, score);
  assert.deepEqual((await getAttempt(both, open)).questions.map((q) => q.selected), [[], ["B"]]);
  assert.equal((await getAttempt(both, drill)).submittedAt, null);
  assert.deepEqual((await listAttempts(both, "PgMP")).map((a) => a.id), [done]);
});

test("the Scoreboard has one tab per Certification: its Exams and the Users with access to it", async () => {
  const pgmp = await getScoreboard(admin, "PgMP");
  assert.deepEqual(pgmp.exams.map((e) => [e.name, e.total]), [["PgMP 1", 2]]);
  assert.deepEqual(pgmp.users.map((u) => u.email), ["admin@x.test", "both@x.test", "gus@x.test"]);
  assert.ok(pgmp.cells.every((c) => c.examId === pgmpExam));
  const pmp = await getScoreboard(admin, "PMP");
  assert.equal(pmp.exams.length, 7);
  assert.deepEqual(pmp.users.map((u) => u.email), ["admin@x.test", "both@x.test", "pam@x.test"]);
  assert.ok(pmp.cells.every((c) => c.examId !== pgmpExam));
});
