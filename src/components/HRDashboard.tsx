import React from "react";
import { useWorkspace } from "./WorkspaceContext";
import EnterpriseHrms from "./EnterpriseHrms";

export default function HRDashboard() {
  const { user, refreshSession } = useWorkspace();

  if (!user) return null;

  return (
    <EnterpriseHrms currentUser={user} triggerRefresh={refreshSession} />
  );
}
