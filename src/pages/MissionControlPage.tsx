import { Navigate, useSearchParams } from "react-router-dom";

/** Redirect legacy /missioncontrol → unified Shadow Execution */
const MissionControlPage = () => {
  const [params] = useSearchParams();
  const goal = params.get("goal");
  const to = goal ? `/execute?goal=${encodeURIComponent(goal)}` : "/execute";
  return <Navigate to={to} replace />;
};

export default MissionControlPage;
