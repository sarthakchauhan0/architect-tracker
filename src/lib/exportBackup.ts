import { fetchCompleteBackupData } from './firebase';

export const downloadJsonBackup = async () => {
  const data = await fetchCompleteBackupData();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `architect-tracker-backup-${dateStr}.json`;
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadClientsCsv = async () => {
  const data = await fetchCompleteBackupData();
  const headers = [
    'Client ID',
    'Client Name',
    'Phone',
    'Email',
    'Project Name',
    'Project Type',
    'Status',
    'Site Address',
    'Start Date',
    'Estimated Completion',
    'Planned Visits',
    'Completed Visits',
    'Total Project Amount',
    'Total Paid',
    'Balance Remaining',
  ];

  const rows = data.clientsData.map((item) => {
    const totalPaid = item.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const balance = (Number(item.client.totalProjectAmount) || 0) - totalPaid;
    return [
      `"${item.client.id}"`,
      `"${item.client.name.replace(/"/g, '""')}"`,
      `"${item.client.phone || ''}"`,
      `"${item.client.email || ''}"`,
      `"${item.client.projectName.replace(/"/g, '""')}"`,
      `"${item.client.projectType || ''}"`,
      `"${item.client.status}"`,
      `"${(item.client.address || '').replace(/"/g, '""')}"`,
      `"${item.client.startDate || ''}"`,
      `"${item.client.estimatedCompletionDate || ''}"`,
      item.client.totalVisitsPlanned || 0,
      item.visits.length,
      item.client.totalProjectAmount || 0,
      totalPaid,
      balance,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `architect-clients-ledger-${dateStr}.csv`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
