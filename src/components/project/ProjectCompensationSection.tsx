'use client';

import type { Commission, TeamMember } from '@/types';
import CommissionCalculator from '@/components/CommissionCalculator';
import CommissionTracker from '@/components/CommissionTracker';

export default function ProjectCompensationSection({
  clientId,
  projectId,
  projectTotalIncTax,
  commissions,
  teamMembers,
}: {
  clientId: number;
  projectId: number;
  projectTotalIncTax: number;
  commissions: Commission[];
  teamMembers: TeamMember[];
}) {
  const projectValues = { [projectId]: projectTotalIncTax };

  return (
    <div className="space-y-8">
      <div className="pro-card-hero">
        <CommissionCalculator
          clientId={clientId}
          projectId={projectId}
          commissions={commissions}
          projectTotal={projectTotalIncTax}
          teamMembers={teamMembers}
        />
      </div>

      <div className="pro-card-hero">
        <CommissionTracker commissions={commissions} projectValues={projectValues} />
      </div>
    </div>
  );
}

