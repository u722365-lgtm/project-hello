import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<{ publicUrl: string } | { error: string }> {
  if (!ALLOWED.includes(file.type)) {
    return { error: "Use JPEG, PNG, WebP, or GIF" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image must be under 5 MB" };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (profileError) {
    return { error: profileError.message };
  }

  return { publicUrl };
}
