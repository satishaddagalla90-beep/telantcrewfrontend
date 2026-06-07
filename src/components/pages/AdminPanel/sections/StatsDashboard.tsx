import React, { useState, useEffect } from 'react';
import Icon from '../../../atoms/Icon';
import StatCard from '../../../atoms/StatCard/StatCard';
import { fetchStatsSummary, fetchStatsActivity } from '../../../../services/adminService';
import type { StatsSummary, StatsActivity } from '../../../../types/admin';

const StatsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<StatsSummary | null>(null);
  const [activity, setActivity] = useState<StatsActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [summaryData, activityData] = await Promise.all([
        fetchStatsSummary(),
        fetchStatsActivity(),
      ]);
      setSummary(summaryData);
      setActivity(activityData);
      setLoading(false);
    })();
  }, []);

  if (loading || !summary || !activity) {
    return (
      <div className="flex items-center justify-center py-16">
        <Icon name="loading" className="h-6 w-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-500">Loading statistics...</span>
      </div>
    );
  }

  const jobStatusData = [
    { status: 'Open', count: summary.jobs.open, color: 'bg-green-500' },
    { status: 'Closed', count: summary.jobs.closed, color: 'bg-red-500' },
    { status: 'On Hold', count: summary.jobs.onHold, color: 'bg-amber-500' },
  ];

  const recruitmentData = [
    { status: 'Mapped', count: summary.recruitment.mapped, color: 'bg-blue-500' },
    { status: 'Shortlisted', count: summary.recruitment.shortlisted, color: 'bg-indigo-500' },
    { status: 'Selected', count: summary.recruitment.selected, color: 'bg-green-500' },
    { status: 'Rejected', count: summary.recruitment.rejected, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={summary.users.total}
          icon="users"
          color="blue"
          subtitle={`${summary.users.active} active`}
        />
        <StatCard
          label="Active Jobs"
          value={summary.jobs.open}
          icon="briefcase"
          color="green"
          subtitle={`${summary.jobs.total} total`}
        />
        <StatCard
          label="Candidates"
          value={summary.candidates.total}
          icon="user"
          color="purple"
          subtitle={`${summary.candidates.active} active`}
        />
        <StatCard
          label="Clients"
          value={summary.clients.total}
          icon="buildings"
          color="indigo"
          subtitle={`${summary.clients.active} active`}
        />
        <StatCard
          label="Suppliers"
          value={summary.suppliers.total}
          icon="briefcase"
          color="yellow"
          subtitle={`${summary.suppliers.active} active`}
        />
        <StatCard
          label="Selected (Recruitment)"
          value={summary.recruitment.selected}
          icon="check"
          color="green"
          subtitle={`${summary.recruitment.total} total pipeline`}
        />
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Jobs by Status */}
        <div className="border rounded-xl bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="briefcase" size={16} className="text-gray-500" />
            Jobs by Status
          </h3>
          <div className="space-y-3">
            {jobStatusData.map(item => {
              const total = summary.jobs.total;
              const pct = total > 0 ? (item.count / total) * 100 : 0;

              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{item.status}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recruitment Pipeline */}
        <div className="border rounded-xl bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Icon name="users" size={16} className="text-gray-500" />
            Recruitment Pipeline
          </h3>
          <div className="space-y-3">
            {recruitmentData.map(item => {
              const total = summary.recruitment.total;
              const pct = total > 0 ? (item.count / total) * 100 : 0;

              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{item.status}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Records This Period */}
      <div className="border rounded-xl bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="chart" size={16} className="text-gray-500" />
          New Records ({activity.period})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Candidates', count: activity.newRecords.candidates },
            { label: 'Clients', count: activity.newRecords.clients },
            { label: 'Jobs', count: activity.newRecords.jobs },
            { label: 'Suppliers', count: activity.newRecords.suppliers },
          ].map(item => (
            <div
              key={item.label}
              className="text-center p-3 rounded-lg bg-gray-50 border"
            >
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Logins */}
      <div className="border rounded-xl bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Icon name="history" size={16} className="text-gray-500" />
          Recent Logins
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activity.recentLogins.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-gray-900">{item.user}</td>
                  <td className="py-2.5 text-gray-500">{item.email}</td>
                  <td className="py-2.5 text-gray-400 text-right whitespace-nowrap">
                    {item.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
