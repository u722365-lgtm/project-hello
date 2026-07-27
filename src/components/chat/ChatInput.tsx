import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Send, Mic, MicOff, Square, Plus, Sparkles, Volume2, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/chat/FileUpload";
import { ModeSelector, ChatMode } from "@/components/chat/ModeSelector";
import { SearchHistory } from "@/components/chat/SearchHistory";
import { ProviderSelector, AIProvider } from "@/components/chat/ProviderSelector";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getChatEnterToSend } from "@/lib/profilePreferences";
import { usePromptAutocomplete } from "@/hooks/usePromptAutocomplete";
import { rememberPrompt } from "@/lib/chat/promptAutocomplete";
import { GhostTextOverlay } from "@/components/chat/GhostTextOverlay";


interface ChatInputProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isListening: boolean;
  isSpeaking?: boolean;
  onToggleVoice: () => void;
  onOpenImageGenerator: () => void;
  onStopGeneration: () => void;
  selectedFile: { type: "image" | "file"; data: string; name: string; mimeType: string } | null;
  onFileSelect: (file: { type: "image" | "file"; data: string; name: string; mimeType: string } | null) => void;
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  personality: string;
  layout?: "default" | "gemini" | "shadow-pulse" | "composer";
  aiProvider?: AIProvider;
  onProviderChange?: (provider: AIProvider) => void;
  hasKeyForProvider?: (provider: AIProvider) => boolean;
  isEmptyState?: boolean;
}

export const ChatInput = ({
  message,
  onMessageChange,
  onSend,
  onKeyPress,
  isLoading,
  isListening,
  isSpeaking = false,
  onToggleVoice,
  onOpenImageGenerator,
  onStopGeneration,
  selectedFile,
  onFileSelect,
  chatMode,
  onModeChange,
  personality,
  layout = "default",
  aiProvider = "lovable",
  onProviderChange,
  hasKeyForProvider,
  isEmptyState = false,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  // Auto-grow the composer with the typed text (capped), so long prompts stay readable
  // instead of scrolling inside a one-line pill.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const max = 200;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
    const line = parseFloat(getComputedStyle(el).lineHeight || "22") || 22;
    setIsMultiline(el.scrollHeight > line * 1.8);
  }, [message]);

  // Auto-focus the composer on mount so users can start typing immediately.
  // Skip on touch devices so the mobile keyboard doesn't pop up unprompted.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia?.("(pointer: coarse)").matches;
    if (isTouch) return;
    const t = window.setTimeout(() => textareaRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, []);

  const { completion, suggestion, dismiss, clear } = usePromptAutocomplete(
    message,
    !isLoading && !isListening,
  );

  const handleSend = () => {
    if (message.trim()) rememberPrompt(message);
    clear();
    onSend();
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    onMessageChange(suggestion);
    clear();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && completion) {
      e.preventDefault();
      acceptSuggestion();
      return;
    }
    if (e.key === "Escape" && completion) {
      e.preventDefault();
      dismiss();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && getChatEnterToSend()) {
      e.preventDefault();
      handleSend();
      return;
    }
    onKeyPress(e);
  };




  const isShadowPulse = layout === "shadow-pulse";
  const isComposer = layout === "composer" || layout === "gemini" || isShadowPulse;
  const canSend = Boolean(message.trim() || selectedFile);

  const voiceBanner = (
    <AnimatePresence>
      {(isListening || isSpeaking) && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 20, scale: 0.9, x: "-50%" }}
          className={`fixed left-1/2 z-50 ${isEmptyState ? "bottom-44" : "bottom-36"}`}
        >
          <div className="bg-card/95 backdrop-blur-2xl border border-border/50 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-2xl ring-1 ring-border/30">
            <div className="flex gap-1.5 items-center h-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: isListening ? [8, 16, 8] : [4, 10, 4] }}
                  transition={{
                    duration: isListening ? 0.6 : 1.2,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                  className="w-1 bg-primary rounded-full"
                />
              ))}
            </div>
            <span className="text-[13px] font-medium text-foreground tracking-tight">
              {isListening ? "Listening..." : "ShadowTalk is speaking"}
            </span>
            {isSpeaking && <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isComposer && !isShadowPulse) {
    return (
      <div className="relative w-full">
        {voiceBanner}
        <div className={isEmptyState ? "w-full" : "w-full px-0 py-0"}>
          {selectedFile && (
            <div className="mb-2 px-3">
              <FileUpload
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                onClear={() => onFileSelect(null)}
                disabled={isLoading}
                variant="gemini"
              />
            </div>
          )}


          <div className={`shadowtalk-composer group${isMultiline ? " shadowtalk-composer--multiline" : ""}`}>
            {!selectedFile && (
              <FileUpload
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                onClear={() => onFileSelect(null)}
                disabled={isLoading}
                variant="composer"
              />
            )}

            <div className="shadowtalk-composer__textarea relative flex-1 min-w-0">
              <GhostTextOverlay
                value={message}
                completion={completion}
                className={"min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 pl-2 pr-2 text-base sm:text-[15px] leading-relaxed"}
              />
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Ask ShadowTalk"}
                className={"min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2.5 pl-2 pr-2 text-base sm:text-[15px] leading-relaxed" + " relative w-full placeholder:text-muted-foreground/50 overflow-y-auto custom-scrollbar"}
                disabled={isLoading}
                rows={1}
                aria-label="Chat message"
              />
            </div>


            <div className="shadowtalk-composer__actions">
              {onProviderChange && (
                <ProviderSelector
                  provider={aiProvider}
                  onProviderChange={onProviderChange}
                  hasKeyForProvider={hasKeyForProvider}
                  disabled={isLoading}
                  variant="chip"
                />
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isLoading ? (
                      <Button
                        onClick={onStopGeneration}
                        size="icon"
                        variant="ghost"
                        className="shadowtalk-composer__mic text-destructive hover:bg-destructive/10"
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </Button>
                    ) : (
                      <Button
                        onClick={onToggleVoice}
                        variant="ghost"
                        size="icon"
                        className={`shadowtalk-composer__mic ${
                          isListening ? "bg-primary text-primary-foreground border-primary" : ""
                        }`}
                        disabled={isLoading}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isLoading ? "Stop" : "Voice"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button
                onClick={handleSend}
                size="icon"
                type="button"
                className="shadowtalk-composer__send"
                disabled={!canSend || isLoading}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="shadowtalk-composer__hint hidden sm:block">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative ${
        isShadowPulse ? "bg-transparent" : isComposer ? "border-t-0 bg-transparent" : "border-t border-transparent bg-transparent"
      }`}
    >
      {voiceBanner}

      <div
        className={`mx-auto relative ${
          isShadowPulse
            ? "max-w-full px-2 py-0"
            : isComposer
              ? isEmptyState
                ? "max-w-[720px] px-4 py-0"
                : "max-w-[720px] px-4 py-4 md:py-5"
              : "max-w-3xl px-4 py-4 md:py-6"
        }`}
      >
        {!isComposer && !isShadowPulse && !isEmptyState && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <ModeSelector
              mode={chatMode}
              onModeChange={(mode) => {
                onModeChange(mode);
                if (mode === "image") onOpenImageGenerator();
              }}
              disabled={isLoading}
            />
            {chatMode === "research" && (
              <SearchHistory onSelectQuery={(query) => onMessageChange(query)} />
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 shrink-0 font-medium ml-auto tracking-wider uppercase">
              <Sparkles className="h-3 w-3 text-primary/30" />
              <span>{chatMode}</span>
              <span className="opacity-20">|</span>
              <span>{personality}</span>
            </div>
          </div>
        )}


        <div className="relative group">
          {!isComposer && !isShadowPulse && (
            <div className="absolute -inset-[1px] rounded-[32px] bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity duration-700" />
          )}

          <div
            className={
              isShadowPulse
                ? "relative flex items-center gap-2 bg-transparent rounded-[18px] px-2 py-1"
                : isComposer
                  ? "relative flex items-center gap-1 bg-[#2f2f2f] hover:bg-[#383838] focus-within:bg-[#383838] rounded-[26px] border border-[#404040] px-3 py-2 shadow-none transition-colors duration-200"
                  : "relative flex items-end gap-2 bg-[#1e1f20]/60 backdrop-blur-2xl rounded-[30px] border border-white/10 p-2.5 px-4 shadow-2xl transition-all duration-500 group-focus-within:bg-[#1e1f20]/80 group-focus-within:border-white/20 ring-1 ring-white/5"
            }
          >
            <div className={`flex items-center shrink-0 ${isComposer ? "" : "pb-1"}`}>
              <FileUpload
                onFileSelect={onFileSelect}
                selectedFile={selectedFile}
                onClear={() => onFileSelect(null)}
                disabled={isLoading}
                variant={isComposer ? "gemini" : "default"}
              />
            </div>

            <div className="relative flex-1 min-w-0">
              <GhostTextOverlay
                value={message}
                completion={completion}
                className={(isComposer
                  ? "min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-1 text-base sm:text-[15px] leading-relaxed"
                  : "min-h-[46px] max-h-[220px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3.5 px-2 text-base sm:text-[15.5px] leading-relaxed")}
              />
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Chat message"
                placeholder={
                  isListening
                    ? "Listening..."
                    : isShadowPulse
                      ? "Ask anything..."
                      : isComposer
                        ? "Ask ShadowTalk"
                        : "Type, talk, or share..."
                }
                className={(isComposer
                  ? "min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-1 text-base sm:text-[15px] leading-relaxed"
                  : "min-h-[46px] max-h-[220px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3.5 px-2 text-base sm:text-[15.5px] leading-relaxed") + " relative w-full placeholder:text-muted-foreground/40 overflow-y-auto custom-scrollbar"}
                disabled={isLoading}
                rows={1}
              />
            </div>

            <div className={`flex items-center gap-0.5 shrink-0 ${isComposer ? "" : "pb-1"}`}>
              {isComposer && onProviderChange && (
                <ProviderSelector
                  provider={aiProvider}
                  onProviderChange={onProviderChange}
                  hasKeyForProvider={hasKeyForProvider}
                  disabled={isLoading}
                  variant="inline"
                />
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isLoading ? (
                      <Button
                        onClick={onStopGeneration}
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
                      >
                        <Square className="h-4 w-4 fill-current" />
                      </Button>
                    ) : (
                      <Button
                        onClick={onToggleVoice}
                        variant="ghost"
                        size="icon"
                        className={`h-9 w-9 rounded-full transition-all ${
                          isListening
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        }`}
                        disabled={isLoading}
                      >
                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {isLoading ? "Stop" : "ShadowTalk Live (voice)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isComposer ? (
                (message.trim() || selectedFile) &&
                !isLoading && (
                  <Button
                    onClick={handleSend}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-40"
                    disabled={!message.trim() && !selectedFile}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )
              ) : isLoading ? (
                <Button
                  onClick={onStopGeneration}
                  size="icon"
                  className="h-9 w-9 rounded-full bg-destructive/80 hover:bg-destructive text-white shadow-lg shadow-destructive/20"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white text-black hover:bg-white/90 shadow-lg transition-all duration-300 disabled:opacity-10 disabled:bg-white/5 disabled:text-white/20 hover:scale-105 active:scale-95"
                  disabled={!message.trim() && !selectedFile}
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {!isComposer && !isShadowPulse && (
          <p className="text-[10px] text-muted-foreground/25 font-medium text-center mt-4 select-none tracking-widest uppercase">
            ShadowTalk Neural OS • Enterprise Grade Privacy
          </p>
        )}
      </div>
    </div>
  );
};
