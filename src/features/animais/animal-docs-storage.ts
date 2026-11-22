import { supabase } from "@/integrations/db/client";

export const ANIMAIS_DOCS_BUCKET = "animais-docs";

/** Sobe um arquivo para {org_id}/{animal_id}/{uuid}-{safe filename} */
export async function uploadAnimalDoc(params: {
  orgId: string;
  animalId: string;
  file: File;
}): Promise<{ path: string; size: number; mime: string }> {
  const { orgId, animalId, file } = params;
  const uuid = crypto.randomUUID();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const path = `${orgId}/${animalId}/${uuid}-${safe}`;

  const { error } = await supabase.storage
    .from(ANIMAIS_DOCS_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });
  if (error) throw error;

  return { path, size: file.size, mime: file.type || "application/octet-stream" };
}

/** URL assinada temporária (bucket privado) */
export async function signedUrlForDoc(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ANIMAIS_DOCS_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removeAnimalDoc(path: string): Promise<void> {
  const { error } = await supabase.storage.from(ANIMAIS_DOCS_BUCKET).remove([path]);
  if (error) throw error;
}

export function formatBytes(n?: number | null): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
