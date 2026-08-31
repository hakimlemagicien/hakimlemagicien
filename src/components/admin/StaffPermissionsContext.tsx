import { createContext, useContext, type ReactNode } from "react";
import type { AdminPermission, StaffSession } from "@/lib/admin/admin-permissions";
import { canAdmin, hasAdminPermission, permissionDeniedMessage } from "@/lib/admin/admin-permissions";

export type StaffPermissionsContextValue = {
  session: StaffSession | null;
  loading: boolean;
  can: (permission: AdminPermission) => boolean;
  deniedMessage: (permission: AdminPermission) => string;
};

const StaffPermissionsContext = createContext<StaffPermissionsContextValue>({
  session: null,
  loading: true,
  can: () => false,
  deniedMessage: permissionDeniedMessage,
});

export function StaffPermissionsProvider({
  session,
  loading,
  children,
}: {
  session: StaffSession | null;
  loading: boolean;
  children: ReactNode;
}) {
  const value: StaffPermissionsContextValue = {
    session,
    loading,
    can: (permission) => hasAdminPermission(session, permission),
    deniedMessage: permissionDeniedMessage,
  };
  return <StaffPermissionsContext.Provider value={value}>{children}</StaffPermissionsContext.Provider>;
}

export function useStaffPermissions(): StaffPermissionsContextValue {
  return useContext(StaffPermissionsContext);
}

export function useCanAdmin(permission: AdminPermission): boolean {
  const { can } = useStaffPermissions();
  return can(permission);
}

export function RequirePermission({
  permission,
  children,
  fallback,
}: {
  permission: AdminPermission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can, loading, deniedMessage } = useStaffPermissions();
  if (loading) return null;
  if (!can(permission)) {
    return (
      fallback ?? (
        <div className="cc-empty" role="status">
          <p className="cc-empty__title">صلاحية غير كافية</p>
          <p className="cc-empty__body">{deniedMessage(permission)}</p>
        </div>
      )
    );
  }
  return <>{children}</>;
}
