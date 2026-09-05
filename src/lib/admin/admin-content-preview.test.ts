import { countContentWords, contentDraftToPreviewItem, setDraftAudience, slugFromContentTitle } from "./admin-content-preview";
import { emptyContentDraft } from "./admin-content-api";
import { contentVisibleToAudience, parseDiscoverAudience } from "@/lib/platform/discover-audience";

const draft = emptyContentDraft();
draft.title = "الالتزام والاستمرارية";
draft.slug = "stay-committed";
draft.short_description = "ملخص";
draft.body = "فقرة أولى.\n\n## عادة يومية\nنص.";
draft.author_name = "الكوتش حكيم";
draft.content_type = "article";
draft.cover_image_path = "https://example.com/cover.jpg";

const preview = contentDraftToPreviewItem(draft, "blob:cover");
if (preview.coverImage !== "blob:cover") throw new Error("preview uses local cover before upload");
if (preview.title !== draft.title) throw new Error("preview title matches draft");
if (preview.type !== "article") throw new Error("preview type maps");
if (!preview.readingTimeMinutes) throw new Error("reading time is derived");
if (countContentWords("كلمة واحدة اثنتان") !== 3) throw new Error("word count");
if (!slugFromContentTitle("Hello World").includes("hello")) throw new Error("slug from title");

const femaleDraft = setDraftAudience(draft, "female");
if (contentDraftToPreviewItem(femaleDraft).audience !== "female") throw new Error("audience maps to preview");
if (!contentVisibleToAudience("all", "male")) throw new Error("all is visible to everyone");
if (!contentVisibleToAudience(parseDiscoverAudience("food"), "female")) throw new Error("legacy food maps to all");
if (!contentVisibleToAudience("all", "female")) throw new Error("all is visible to females");
if (contentVisibleToAudience("female", "male")) throw new Error("female content is hidden from males");
if (!contentVisibleToAudience("male", "male")) throw new Error("male content is visible to males");
if (contentVisibleToAudience("female", null)) throw new Error("gendered content stays hidden without gender");

const allDraft = setDraftAudience(draft, "all");
if (contentDraftToPreviewItem(allDraft).audience !== "all") throw new Error("all audience maps to preview");

console.log("admin-content-preview tests passed");
