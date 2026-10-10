/** Thin indeterminate bar pinned to the top: shown while the next page renders on the server. */
export function TopBar() {
  return (
    <div role="progressbar" aria-label="Đang tải" className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden">
      <div className="h-full w-1/3 animate-[top-bar_1s_ease-in-out_infinite] bg-primary" />
    </div>
  );
}
