"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/submit-button";

/** Button that opens a confirmation Dialog; confirming runs the Server Action, and the confirm button waits for it. */
export function ConfirmDialog({ trigger, title, description, confirm, action, triggerProps }: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirm: string;
  action: () => Promise<void>;
  triggerProps?: React.ComponentProps<typeof Button>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" {...triggerProps} />}>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          action={async () => {
            await action();
            setOpen(false);
          }}
        >
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>Huỷ</DialogClose>
            <SubmitButton>{confirm}</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
