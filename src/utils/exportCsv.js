/**
 * Exports user study logs and performance history to a CSV file.
 * Utilizes Blob and URL.createObjectURL for memory-efficient client-side downloads.
 *
 * @param {Array} logs - Array of DailyLog objects
 * @param {string} examName - Optional active exam name for metadata
 */
export function exportStudyDataToCsv(logs = [], examName = 'Exam Prep') {
  if (!Array.isArray(logs) || logs.length === 0) {
    // Generate empty structure with headers if no logs exist
    logs = [];
  }

  const headers = [
    'Date',
    'Minutes Studied',
    'Topics Completed',
    'Target Topics',
    'Target Met',
    'Review Count',
    'Exam Name',
  ];

  const rows = logs.map((log) => {
    const date = log.date || new Date().toISOString().split('T')[0];
    const minutes = log.timeStudiedMinutes || 0;
    const completed = log.topicsCompleted || log.completedTopicIds?.length || 0;
    const target = log.targetTopics || 0;
    const met = completed >= target && target > 0 ? 'YES' : 'NO';
    const reviews = log.reviewsCompleted || 0;

    return [
      `"${date}"`,
      minutes,
      completed,
      target,
      `"${met}"`,
      reviews,
      `"${(examName || 'Exam').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `study-tracker-history-${timestamp}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
