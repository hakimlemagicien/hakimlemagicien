import { supabase } from "@/integrations/supabase/client";

export const EXERCISE_MEDIA_BUCKET = "exercise-media";
export const SIGNED_MEDIA_URL_TTL_SECONDS = 60 * 60;

/** CEO-approved shared placeholder paths (single copy in Storage). */
export const SHARED_EXERCISE_PLACEHOLDER_PATH =
  "exercises/placeholders/default-exercise.mp4";

export const SHARED_INSTRUCTIONS_PLACEHOLDER_PATH =
  "exercises/placeholders/default-instructions.mp4";

export type ExerciseMediaStatus =
  | "placeholder"
  | "ready"
  | "missing"
  | "review_required"
  | "rejected";

export type ExerciseMediaKind = "exercise" | "instructions";

export type ExerciseMediaSource = {
  storagePath: string | null;
  useSharedPlaceholder: boolean;
  showUnavailable: boolean;
};

function sharedPlaceholderPath(kind: ExerciseMediaKind): string {
  return kind === "instructions"
    ? SHARED_INSTRUCTIONS_PLACEHOLDER_PATH
    : SHARED_EXERCISE_PLACEHOLDER_PATH;
}

/**
 * Resolves which Storage object to fetch for playback.
 * Exercise metadata (name, muscles, etc.) is independent — only status + path matter here.
 */
export function resolveExerciseMediaSource(input: {
  status: ExerciseMediaStatus;
  path: string | null | undefined;
  kind: ExerciseMediaKind;
}): ExerciseMediaSource {
  const path = input.path?.trim() || null;

  if (input.status === "ready" && path) {
    return {
      storagePath: path,
      useSharedPlaceholder: false,
      showUnavailable: false,
    };
  }

  if (input.status === "review_required" || input.status === "rejected") {
    return {
      storagePath: sharedPlaceholderPath(input.kind),
      useSharedPlaceholder: true,
      showUnavailable: false,
    };
  }

  if (input.status === "missing") {
    return {
      storagePath: sharedPlaceholderPath(input.kind),
      useSharedPlaceholder: true,
      showUnavailable: false,
    };
  }

  return {
    storagePath: sharedPlaceholderPath(input.kind),
    useSharedPlaceholder: true,
    showUnavailable: false,
  };
}

export function buildRealExerciseVideoPath(externalId: string): string {
  return `exercises/${externalId}/exercise.mp4`;
}

export function buildRealInstructionsVideoPath(externalId: string): string {
  return `exercises/${externalId}/instructions.mp4`;
}

export function normalizeStorageObjectPath(path: string): string {
  return path
    .replace(/^\/+/, "")
    .replace(new RegExp(`^${EXERCISE_MEDIA_BUCKET}/`), "");
}

export async function fetchExerciseMediaUrl(path: string | null): Promise<string | null> {
  const value = path?.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const objectPath = normalizeStorageObjectPath(value);

  const { data, error } = await supabase.storage
    .from(EXERCISE_MEDIA_BUCKET)
    .createSignedUrl(objectPath, SIGNED_MEDIA_URL_TTL_SECONDS);

  if (error) throw error;
  return data.signedUrl;
}

export async function fetchResolvedExerciseMediaUrl(input: {
  status: ExerciseMediaStatus;
  path: string | null | undefined;
  kind: ExerciseMediaKind;
}): Promise<string | null> {
  const source = resolveExerciseMediaSource(input);
  if (!source.storagePath) return null;

  try {
    return await fetchExerciseMediaUrl(source.storagePath);
  } catch {
    if (source.useSharedPlaceholder && input.status === "missing") {
      return null;
    }
    if (!source.useSharedPlaceholder) {
      try {
        return await fetchExerciseMediaUrl(sharedPlaceholderPath(input.kind));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function exerciseMediaQueryKey(input: {
  status: ExerciseMediaStatus;
  path: string | null | undefined;
  kind: ExerciseMediaKind;
}): string {
  const source = resolveExerciseMediaSource(input);
  return [input.kind, input.status, source.storagePath ?? "none"].join(":");
}

export function resolveExerciseListMediaPath(input: {
  status: ExerciseMediaStatus;
  thumbnailPath: string | null | undefined;
  videoPath: string | null | undefined;
}): { status: ExerciseMediaStatus; path: string | null; kind: ExerciseMediaKind } {
  if (input.thumbnailPath?.trim()) {
    return {
      status: "ready",
      path: input.thumbnailPath,
      kind: "exercise",
    };
  }

  const source = resolveExerciseMediaSource({
    status: input.status,
    path: input.videoPath,
    kind: "exercise",
  });

  return {
    status: input.status,
    path: source.storagePath,
    kind: "exercise",
  };
}
