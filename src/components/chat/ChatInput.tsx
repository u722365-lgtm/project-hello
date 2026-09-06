import { getChatEnterToSend } from "@/lib/profilePreferences";
import { useEffect, useRef, useMemo, useState } from "react";
import { Send, Mic, MicOff, Square, Plus, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/chat/FileUpload";
import { ModeSelector, ChatMode } from "@/components/chat/ModeSelector";
import { SearchHistory } from "@/components/chat/SearchHistory";
import type { AIProvider } from "@/lib/aiProviders";
import { motion, AnimatePresence } from "framer-motion";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useSoundEffects } from "@/hooks/useSoundEffects";
import { usePromptAutocomplete } from "@/hooks/usePromptAutocomplete";
import { buildInAppSharePayload, getViralShareLinks } from "@/lib/viralShare";
import { ViralShareButton } from "@/components/chat/ViralShareButton";

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
  promptSuggestion?: string;
  onPromptAccept?: (value: string) => void;
  onPromptClear?: () => void;
  onSuggestionChange?: (suggestion: string) => void;
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
  aiProvider = "shadowtalk",
  onProviderChange,
  hasKeyForProvider,
  isEmptyState = false,
  promptSuggestion,
  onPromptAccept,
  onPromptClear,
  onSuggestionChange,
}: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { play } = useSoundEffects();

  const [isMultiLine, setIsMultiLine] = useState(false);

  // Auto-resize the composer textarea to dynamically fit typed lines without clipping
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    const multiline = message.includes("\n") || scrollHeight > 46;
    setIsMultiLine(multiline);
    const newHeight = Math.min(Math.max(scrollHeight, 38), 200);
    textarea.style.height = `${newHeight}px`;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && promptSuggestion) {
      e.preventDefault();
      if (e.shiftKey || !message) {
        onPromptClear?.();
        return;
      }
      const next = `${message}${promptSuggestion}`;
      onMessageChange(next);
      onPromptAccept?.(next);
      onPromptClear?.();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && getChatEnterToSend()) {
      e.preventDefault();
      play('send');
      onSend();
      return;
    }
    onKeyPress(e);
  };

  const isShadowPulse = layout === "shadow-pulse";
  const isComposer = layout === "composer" || layout === "gemini" || isShadowPulse;
  const canSend = Boolean(message.trim() || selectedFile);

  const hasComposerGhost = useMemo(
    () => Boolean(isComposer && !isShadowPulse && promptSuggestion),
    [isComposer, isShadowPulse, promptSuggestion],
  );

  // Local hook result: renders its own visual in its own lifecycle; we only use
  // its generated value by exposing it upward so the parent can own the source of truth.
  const acceptLocal = usePromptAutocomplete(
    message,
    (value: string) => void onPromptAccept?.(value),
    { composerEnabled: isComposer && !isShadowPulse, localOnly: true, maxSuggestionChars: 140 },
  );

  useEffect(() => {
    if (!onSuggestionChange) return;
    onSuggestionChange(acceptLocal.suggestion);
  }, [acceptLocal.suggestion, onSuggestionChange]);

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
                  animate={{ scaleY: isListening ? [0.5, 1, 0.5] : [0.25, 0.625, 0.25] }}
                  style={{ originY: 0.5 }}
                  transition={{
                    duration: isListening ? 0.6 : 1.2,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                  className="w-1 h-4 bg-primary rounded-full"
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

          <div className={`shadowtalk-composer group ${isMultiLine ? "shadowtalk-composer--multiline" : ""}`}>
            {!selectedFile && (
              <div className="shadowtalk-composer__attach-wrap shrink-0">
                <FileUpload
                  onFileSelect={onFileSelect}
                  selectedFile={selectedFile}
                  onClear={() => onFileSelect(null)}
                  disabled={isLoading}
                  variant="composer"
                />
              </div>
            )}

            <div className="relative flex-1 min-w-0">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? "Listening..." : "Message ShadowTalk, draft a document, or generate code..."}
                className="shadowtalk-composer__textarea w-full resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-2 pl-2 text-base sm:text-[15px] placeholder:text-muted-foreground/50 leading-relaxed overflow-y-auto custom-scrollbar"
                disabled={isLoading}
                rows={1}
                aria-label="Chat message"
              />
            </div>

            <div className="shadowtalk-composer__actions">

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isLoading ? (
                      <Button
                        onClick={onStopGeneration}
                        size="icon"
                        variant="ghost"
                        className="shadowtalk-composer__mic text-destructive hover:bg-destructive/10"
                        aria-label="Stop generating"
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
                        aria-label={isListening ? "Stop voice input" : "Start voice input"}
                        aria-pressed={isListening}
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
                onClick={() => { play('send'); onSend(); }}
                size="icon"
                className="shadowtalk-composer__send"
                disabled={!canSend || isLoading}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
              <ViralShareButton />
            </div>
          </div>

          <p className="shadowtalk-composer__hint hidden sm:block" role="status" aria-live="polite">
            {isLoading
              ? "ShadowTalk is thinking… press Stop to cancel"
              : canSend
                ? "Enter to send · Shift+Enter for new line"
                : "Type a message to get started · Shift+Enter for new line"}
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
                  : `relative flex items-end gap-2 bg-[#1e1f20]/60 backdrop-blur-3xl rounded-[30px] border border-white/10 p-2.5 px-4 shadow-2xl transition-all duration-500 group-focus-within:bg-[#1e1f20]/80 group-focus-within:border-white/20 ring-1 ${message.trim() ? "ring-primary/50 shadow-primary/20" : "ring-white/5"}`
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
              className={
                isComposer
                  ? "flex-1 min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3 px-1 text-base sm:text-[15px] placeholder:text-muted-foreground/50 leading-relaxed overflow-y-auto custom-scrollbar"
                  : "flex-1 min-h-[46px] max-h-[220px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 py-3.5 px-2 text-base sm:text-[15.5px] placeholder:text-muted-foreground/30 leading-relaxed overflow-y-auto custom-scrollbar"
              }
              disabled={isLoading}
              rows={1}
            />

            <div className={`flex items-center gap-0.5 shrink-0 ${isComposer ? "" : "pb-1"}`}>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isLoading ? (
                      <Button
                        onClick={onStopGeneration}
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10"
                        aria-label="Stop generating"
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
                        aria-label={isListening ? "Stop voice input" : "Start voice input"}
                        aria-pressed={isListening}
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
                    onClick={() => { play('send'); onSend(); }}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all disabled:opacity-40"
                    disabled={!message.trim() && !selectedFile}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )
              ) : isLoading ? (
                <Button
                  onClick={onStopGeneration}
                  size="icon"
                  className="h-9 w-9 rounded-full bg-destructive/80 hover:bg-destructive text-white shadow-lg shadow-destructive/20"
                  aria-label="Stop generating"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => { play('send'); onSend(); }}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-white text-black hover:bg-white/90 shadow-lg transition-all duration-300 disabled:opacity-10 disabled:bg-white/5 disabled:text-white/20 hover:scale-105 active:scale-95"
                    disabled={!message.trim() && !selectedFile}
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <ViralShareButton />
                </>
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
