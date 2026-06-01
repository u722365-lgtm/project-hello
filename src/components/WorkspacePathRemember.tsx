import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { rememberWorkspacePath } from "@/lib/persistentAuth";

const WORKSPACE_PREFIXES = ["/chatbot", "/workspace", "/ide", "/missioncontrol", "/settings", "/profile"];

/** Remember last in-app route so return visits open the same workspace. */
const WorkspacePathRemember = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (WORKSPACE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
      rememberWorkspacePath(path);
    }
  }, [location.pathname]);

  return null;
};

export default WorkspacePathRemember;
