"use client";

export function AbandonForm({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Bỏ bài đang làm dở và làm lại từ đầu? Các đáp án đã chọn sẽ bị xoá.")) e.preventDefault();
      }}
    >
      <button className="rounded border px-3 py-1 text-sm">Bỏ, làm lại từ đầu</button>
    </form>
  );
}
