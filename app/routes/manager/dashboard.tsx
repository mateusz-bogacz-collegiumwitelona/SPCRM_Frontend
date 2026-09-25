import React, { useState } from 'react';
import { RoleGuard } from '~/lib/role-guard';
import { AuthGuard } from '~/lib/auth-guard';
import { BarChart3, Briefcase, Users } from 'lucide-react';

import { TeamAnalyticsTab } from '~/components/analytics/team-analytics-tab';
import { UserDashboardContent } from '~/components/user/user-dashboard-content';
import { ROLES } from '~/constants/roles';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState<'team' | 'personal'>('team');

  return (
    <AuthGuard>
      <RoleGuard allowedRoles={[ROLES.MANAGER]}>
        <div className="space-y-6">
          <div className="bg-blue-900 p-4 lg:p-6 text-white rounded-lg shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-200" />
              <h1 className="text-lg lg:text-2xl font-semibold">Panel Główny Menadżera</h1>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-6" aria-label="Tabs">
              <button
                type="button"
                onClick={() => setActiveTab('team')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'team'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Wyniki zespołu</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('personal')}
                className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'personal'
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Mój pulpit (Moje zadania i sprzedaż)</span>
              </button>
            </nav>
          </div>

          {activeTab === 'team' && <TeamAnalyticsTab />}
          {activeTab === 'personal' && <UserDashboardContent />}
        </div>
      </RoleGuard>
    </AuthGuard>
  );
}
