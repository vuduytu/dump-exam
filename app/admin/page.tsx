import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createUserAction, resetPasswordAction, setCertificationsAction, setLockedAction } from "@/app/actions";
import { CERTIFICATIONS, type Certification } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/submit-button";
import { ActionForm } from "@/app/action-form";
import { SESSION_COOKIE, userFromSession } from "@/lib/auth";
import { listUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

/** Certification Access checkboxes; the server refuses an empty choice. */
function CertificationBoxes({ checked, label }: { checked: Certification[]; label: string }) {
  return (
    <fieldset className="flex items-center gap-3 self-center text-sm">
      <legend className="sr-only">{label}</legend>
      {CERTIFICATIONS.map((c) => (
        <label key={c} className="flex items-center gap-1">
          <input type="checkbox" name="certification" value={c} defaultChecked={checked.includes(c)} /> {c}
        </label>
      ))}
    </fieldset>
  );
}

export default async function Admin() {
  const me = await userFromSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!me) redirect("/login");
  if (!me.isAdmin) notFound();
  const list = await listUsers(me.id);
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Quản lý User</h1>
      <h2 className="mt-6 font-medium">Tạo User</h2>
      <ActionForm action={createUserAction} submit="Tạo" className="mt-2 flex flex-wrap items-start gap-3">
        <input name="email" type="email" required placeholder="Email" aria-label="Email" className="field" />
        <input name="password" type="text" required minLength={8} placeholder="Mật khẩu ban đầu" aria-label="Mật khẩu ban đầu" autoComplete="off" className="field" />
        <CertificationBoxes checked={["PMP"]} label="Certification của User mới" />
      </ActionForm>
      <Card className="mt-6 gap-0 py-0"><ul className="divide-y">
        {list.map((u) => (
          <li key={u.id} className="flex flex-wrap items-start gap-x-4 gap-y-2 p-3">
            <span className="font-medium">{u.email}</span>
            {u.isAdmin && <Badge variant="secondary">Admin</Badge>}
            <span className="text-sm text-muted-foreground">{u.createdAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span>
            {u.locked && <Badge className="bg-wrong-soft text-wrong">đã khoá</Badge>}
            <div className="ml-auto flex flex-wrap items-start gap-3">
              {u.isAdmin ? (
                <span className="self-center text-sm text-muted-foreground">Mọi Certification</span>
              ) : (
                <ActionForm action={setCertificationsAction.bind(null, u.id)} submit="Lưu Certification" className="flex flex-wrap items-start gap-2">
                  <CertificationBoxes checked={u.certifications} label={`Certification của ${u.email}`} />
                </ActionForm>
              )}
              <ActionForm action={resetPasswordAction.bind(null, u.id)} submit="Đặt lại mật khẩu" className="flex flex-wrap items-start gap-2">
                <input name="password" type="text" required minLength={8} placeholder="Mật khẩu mới" aria-label={`Mật khẩu mới của ${u.email}`} autoComplete="off" className="field py-1 text-sm" />
              </ActionForm>
              {u.id !== me.id && (
                <form action={setLockedAction.bind(null, u.id, !u.locked)}>
                  <SubmitButton variant="outline">{u.locked ? "Mở khoá" : "Khoá"}</SubmitButton>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul></Card>
    </main>
  );
}
