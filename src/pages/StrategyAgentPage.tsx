import { Navigate } from "react-router-dom";

/** Redirect legacy /strategy → unified Shadow Execution */
const StrategyAgentPage = () => (
  <Navigate to="/execute?mode=strategy_report" replace />
);

export default StrategyAgentPage;
