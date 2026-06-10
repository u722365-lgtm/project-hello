import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function processWhatsAppAIChat(
  message: string,
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }],
        sessionId: `whatsapp-${userId}`,
        personality: "sovereign",
        isWhatsApp: true,
      }),
    });

    if (!response.ok) {
      console.error("[WhatsApp] Chat API error:", response.status);
      return "I'm having trouble processing your request. Please try again shortly.";
    }

    const reader = response.body?.getReader();
    if (!reader) return "Error processing response.";

    let fullText = "";
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value, { stream: true });
    }

    let cleaned = fullText
      .replace(/```[\s\S]*?```/g, "[code block]")
      .replace(/\*\*\*(.*?)\*\*\*/g, "*$1*")
      .replace(/\*\*(.*?)\*\*/g, "*$1*")
      .replace(/#{1,6}\s/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    if (cleaned.length > 1500) {
      cleaned = cleaned.substring(0, 1497) + "...";
    }

    return cleaned || "I processed your request but had no response to share.";
  } catch (error) {
    console.error("[WhatsApp] AI processing error:", error);
    return "Sorry, I couldn't process that right now. Please try again.";
  }
}

export async function handleWhatsAppCommand(
  supabase: ReturnType<typeof createClient>,
  command: string,
  userId: string,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<string> {
  const parts = command.split(" ");
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(" ");

  switch (cmd) {
    case "/help":
      return `ShadowTalk Commands:\n\n/search <query> — Web search\n/status — Account status\n/help — Show this menu\n\nOr just type naturally to chat with AI.`;

    case "/search":
      if (!args) return "Usage: /search <query>\nExample: /search latest AI news";
      return await processWhatsAppAIChat(`Search the web for: ${args}`, userId, supabaseUrl, serviceRoleKey);

    case "/status": {
      const { data: credits } = await supabase
        .from("shadow_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();
      return `Account Status\nCredits: ${credits?.balance || 0}\nChannel: WhatsApp — Active`;
    }

    default:
      return `Unknown command: ${cmd}\nType /help for available commands.`;
  }
}
