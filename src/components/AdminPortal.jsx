import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Convert name to proper case (title case)
const toProperCase = (name) => {
  if (!name || name === '-' || name === 'N/A') return name;
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const REFRESH_INTERVAL_MS = 15000;
const PAGE_SIZE = 50;
const MAX_ENTRIES = 500;

export default function AdminPortal() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [boundedCount, setBoundedCount] = useState(0);
  const [totalSuccessful, setTotalSuccessful] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [totalFoundRate, setTotalFoundRate] = useState('0.0');
  const pageRef = useRef(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Math.max(1, boundedCount) / PAGE_SIZE)),
    [boundedCount]
  );

  const fetchEnquiries = useCallback(async (showSpinner = false, nextPage) => {
    const targetPage = Math.max(nextPage ?? pageRef.current ?? 1, 1);
    if (showSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
        const response = await fetch(`/api/admin-enquiries?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch enquiries (${response.status})`);
      }

      const payload = await response.json();
      if (payload.status !== 'success') {
        throw new Error(payload.error || 'Unexpected response from admin API');
      }

      const fetchedTotal = payload.totalCount || 0;
      const boundedTotal = Math.min(fetchedTotal, MAX_ENTRIES);

      setEnquiries(payload.data || []);
      setTotalCount(fetchedTotal);
      setBoundedCount(boundedTotal);
      setTotalSuccessful(payload.totalSuccessful || 0);
      setTotalFailed(payload.totalFailed || 0);
      setTotalFoundRate(payload.totalFoundRate || '0.0');

      const safePage = Math.min(
        Math.max(payload.page || targetPage, 1),
        Math.max(1, Math.ceil(Math.max(1, boundedTotal) / PAGE_SIZE))
      );
      setPage(safePage);
      pageRef.current = safePage;
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
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    fetchEnquiries(true, 1);
    const interval = setInterval(() => fetchEnquiries(false, pageRef.current), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchEnquiries]);

  const stats = useMemo(() => {
    // Get the latest ID from enquiries (highest ID = latest)
    const latestId = enquiries.length > 0 
      ? Math.max(...enquiries.map(e => e.id || 0))
      : 0;

    return {
      total: latestId || totalCount, // Use latest ID, fallback to totalCount
      successful: totalSuccessful,
      failed: totalFailed,
      foundRate: totalFoundRate,
    };
  }, [enquiries, totalCount, totalSuccessful, totalFailed, totalFoundRate]);

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
            onClick={() => fetchEnquiries(true, page)}
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
              <p className="value">{stats.total.toLocaleString()}</p>
            </div>
            <div className="admin-stat-card">
              <p className="label">Successful</p>
              <p className="value success">{stats.successful.toLocaleString()}</p>
            </div>
            <div className="admin-stat-card">
              <p className="label">Failed</p>
              <p className="value danger">{stats.failed.toLocaleString()}</p>
            </div>
            <div className="admin-stat-card">
              <p className="label">Found Rate</p>
              <p className="value accent">{stats.foundRate}%</p>
            </div>
          </div>

          {enquiries.length === 0 ? (
            <div className="admin-no-data">No enquiries recorded yet.</div>
          ) : (
            <div className="admin-table">
              <div className="admin-table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>RA Number</th>
                      <th>Name</th>
                      <th>Search Date</th>
                      <th>Time (IST)</th>
                      <th>Status</th>
                      <th>Room</th>
                      <th>Venue</th>
                      <th>Floor</th>
                      <th>Time (ms)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((enquiry) => (
                      <tr key={enquiry.id}>
                        <td>{enquiry.id}</td>
                        <td className="mono">{enquiry.register_number}</td>
                        <td>{toProperCase(enquiry.student_name || '-')}</td>
                        <td>{enquiry.search_date || '-'}</td>
                        <td className="timestamp">{formatIST(enquiry.searched_at)}</td>
                        <td>
                          <span className={`admin-badge ${enquiry.results_found ? 'success' : 'danger'}`}>
                            {enquiry.results_found ? '✓ Found' : '✗ Not Found'}
                          </span>
                        </td>
                        <td className="mono">
                          {(enquiry.rooms || []).length === 0
                            ? '-'
                            : enquiry.rooms[0]}
                        </td>
                        <td className="mono">
                          {(enquiry.venues || []).length === 0
                            ? '-'
                            : enquiry.venues[0]}
                        </td>
                        <td className="mono">
                          {(enquiry.floors || []).length === 0
                            ? '-'
                            : enquiry.floors[0]}
                        </td>
                        <td className="mono">
                          {enquiry.performance_time !== null && enquiry.performance_time !== undefined
                            ? `${enquiry.performance_time}ms`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="admin-pagination">
                <button
                  type="button"
                  className="feedfill-button secondary"
                  disabled={page <= 1 || refreshing}
                  onClick={() => fetchEnquiries(true, page - 1)}
                >
                  Previous
                </button>
                <span className="admin-page-info">
                  Page {page} of {totalPages} · Showing {(page - 1) * PAGE_SIZE + 1} –{' '}
                  {Math.min(page * PAGE_SIZE, boundedCount)} of {boundedCount} records
                </span>
                <button
                  type="button"
                  className="feedfill-button secondary"
                  disabled={page >= totalPages || refreshing}
                  onClick={() => fetchEnquiries(true, page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

