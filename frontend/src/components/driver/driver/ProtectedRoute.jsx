import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token || role !== "driver") {
    return <Navigate to="/driver/login" replace />;
  }

  return children;
};

export default ProtectedRoute;