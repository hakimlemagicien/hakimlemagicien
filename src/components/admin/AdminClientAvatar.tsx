import { useEffect, useState } from "react";
import { personInitials } from "@/lib/admin/admin-status";
import { resolveAvatarDisplayUrl } from "@/lib/platform/profile-api";

type Props = {
  name: string | null | undefined;
  avatarPath: string | null | undefined;
  size?: "md" | "lg";
  className?: string;
};

export function AdminClientAvatar({ name, avatarPath, size = "md", className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const initials = personInitials(name);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    void resolveAvatarDisplayUrl(avatarPath)
      .then((next) => {
        if (!cancelled) setUrl(next);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [avatarPath]);

  const classes = ["cc-avatar", size === "lg" ? "cc-avatar--lg" : null, className].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-hidden>
      {url ? <img src={url} alt="" className="cc-avatar__img" /> : initials}
    </span>
  );
}
