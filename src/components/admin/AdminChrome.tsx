import type { ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPage";

/** @deprecated Use AdminShell + AdminPageHeader. Kept as a thin header alias. */
export function AdminChrome({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AdminPageHeader title={title} subtitle={subtitle} />
      {children}
    </>
  );
}
