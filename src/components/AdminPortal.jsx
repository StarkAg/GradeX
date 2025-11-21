import React, { useCallback, useEffect, useMemo, useState } from 'react';

const REFRESH_INTERVAL_MS = 15000;

export default function AdminPortal() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchEnquiries = useCallback(async (showSpinner = false) => {
    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/admin-enquiries?limit=500', {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch enquiries (${response.status})`);
      }

      const payload = await response.json();
      if (payload.status !== 'success') {
        throw new Error(payload.error || 'Unexpected response from admin API');
      }

      setEnquiries(payload.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Unable to load enquiries');
    } finally {
      if (showSpinner) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchEnquiries(true);
    const interval = setInterval(() => fetchEnquiries(false), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchEnquiries]);

  const stats = useMemo(() => {
    const total = enquiries.length;
    const successful = enquiries.filter(e => e.results_found).length;
    const failed = total - successful;
    const successRate = total ? ((successful / total) * 100).toFixed(1) : '0.0';
    return { total, successful, failed, successRate };
  }, [enquiries]);

  const formatIST = useCallback((timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }, []);

  return (
    <section className="admin-portal">
      <div className="admin-hero">
        <div>
          <p className="feedfill-eyebrow">Internal dashboard</p>
          <h2>GradeX Admin Console</h2>
          <p className="feedfill-description">
            Monitor live seat-search activity, export logs, and keep an eye on failures at a glance.
            This page refreshes automatically every {REFRESH_INTERVAL_MS / 1000}s.
          </p>
        </div>
        <div className="admin-actions">
          <button
            className="feedfill-button"
            type="button"
            onClick={() => fetchEnquiries(true)}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Manual Refresh'}
          </button>
          {lastUpdated && (
            <span className="admin-last-updated">
              Last updated {formatIST(lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading">Loading enquiries…</div>
      ) : (
        <>
          <div className="admin-stats">
            <div className="admin-stat-card">
              <p className="label">Total Searches</p>
              <p className="value">{stats.total}</p>
            </div>
            <div className="admin-stat-card">
              <p className="label">Successful</p>
              <p className="value success">{stats.successful}</p>
            </div>
            <div className="admin-stat-card">
              <p className="label">Failed</p>
              <p className="value danger">{stats.failed}</p>
            </div>
            <div className="admin-stat-card">
              <p className="label">Success Rate</p>
              <p className="value accent">{stats.successRate}%</p>
            </div>
          </div>

          {enquiries.length === 0 ? (
            <div className="admin-no-data">No enquiries recorded yet.</div>
          ) : (
            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>RA Number</th>
                    <th>Name</th>
                    <th>Search Date</th>
                    <th>Time (IST)</th>
                    <th>Status</th>
                    <th>Results</th>
                    <th>Campuses</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>{enquiry.id}</td>
                      <td className="mono">{enquiry.register_number}</td>
                      <td>{enquiry.student_name || '-'}</td>
                      <td>{enquiry.search_date || '-'}</td>
                      <td className="timestamp">{formatIST(enquiry.searched_at)}</td>
                      <td>
                        <span className={`admin-badge ${enquiry.results_found ? 'success' : 'danger'}`}>
                          {enquiry.results_found ? '✓ Found' : '✗ Not Found'}
                        </span>
                      </td>
                      <td>{enquiry.result_count || 0}</td>
                      <td className="campus-cell">
                        {(enquiry.campuses || []).length === 0
                          ? '-'
                          : enquiry.campuses.map((campus) => (
                              <span key={campus} className="admin-badge campus">
                                {campus}
                              </span>
                            ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

