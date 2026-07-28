/** Subtle static backdrop for the chat workspace — no infinite blur animations. */
export function ChatAmbientBackground() {
  return (
    <>
      <div className="shadowtalk-chat-glow" aria-hidden data-decorative="ambient" />
      <div className="fixed inset-0 settings-grain pointer-events-none -z-[1]" aria-hidden />
    </>
  );
}
