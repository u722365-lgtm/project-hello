import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserPresence } from "@/hooks/useRealtimePresence";

interface LiveCursorsProps {
  containerRef: React.RefObject<HTMLElement>;
  enabled?: boolean;
  otherUsers: UserPresence[];
  updateCursor: (position: { x: number; y: number }) => void;
}

export const LiveCursors = ({ containerRef, enabled = true, otherUsers, updateCursor }: LiveCursorsProps) => {
  // Track mouse movement
  useEffect(() => {
    if (!containerRef.current || !enabled) return;
    
    const container = containerRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      updateCursor({ x, y });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, [containerRef, updateCursor, enabled]);

  if (!enabled) return null;

  // Filter users who have a cursor position and are active recently (within 5 seconds)
  const now = Date.now();
  const activeCursors = otherUsers.filter(u => {
    if (!u.cursor) return false;
    const lastActive = new Date(u.lastActive).getTime();
    return now - lastActive < 5000;
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {activeCursors.map(user => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: `${user.cursor!.x}%`,
              y: `${user.cursor!.y}%`,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 500 }}
            className="absolute"
            style={{ 
              left: 0, 
              top: 0,
              transform: `translate(${user.cursor!.x}%, ${user.cursor!.y}%)`,
            }}
          >
            {/* Cursor Arrow */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.3))` }}
            >
              <path
                d="M5 3L19 12L12 13L8 21L5 3Z"
                fill={user.avatarColor}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            
            {/* User Label */}
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute left-5 top-5 px-2 py-0.5 rounded-full text-[10px] font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: user.avatarColor }}
            >
              {user.displayName}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
