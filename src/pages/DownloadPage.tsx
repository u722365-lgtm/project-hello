import { Navigate } from "react-router-dom";

/** Legacy path — canonical downloads page is /downloads */
export default function DownloadPage() {
  return <Navigate to="/downloads" replace />;
}
