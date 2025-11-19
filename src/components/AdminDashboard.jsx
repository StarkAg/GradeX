import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    successful: 0,
    failed: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadEnquiries();
  }, []);

  const loadEnquiries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin-enquiries?limit=500');
      if (!response.ok) {
        throw new Error('Failed to fetch enquiries');
      }
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.error || 'Failed to load data');
      }
      
      const data = result.data || [];
      setEnquiries(data);
      
      // Calculate stats
      const total = data.length;
      const successful = data.filter(e => e.results_found).length;
      const failed = total - successful;
      const successRate = total > 0 ? ((successful / total) * 100).toFixed(1) : 0;
      
      setStats({ total, successful, failed, successRate });
    } catch (err) {
      setError(err.message);
      console.error('Error loading enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const toIST = (utcString) => {
    if (!utcString) return '-';
    const date = new Date(utcString);
    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
    return istDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const exportCSV = () => {
    if (enquiries.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['ID', 'RA Number', 'Student Name', 'Search Date', 'Time (IST)', 'Status', 'Results', 'Campuses'];
    const rows = enquiries.map(e => [
      e.id,
      e.register_number,
      e.student_name || '',
      e.search_date || '',
      toIST(e.searched_at),
      e.results_found ? 'Found' : 'Not Found',
      e.result_count || 0,
      (e.campuses || []).join(', '),
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enquiries-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isMobile = window.innerWidth < 768;

  return (
    <div style={{
      width: '100%',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px',
      minHeight: '100vh',
      background: '#020202',
      color: '#fff',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        paddingBottom: '24px',
        borderBottom: '1px solid #333',
        marginBottom: '24px',
      }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '32px', marginBottom: '8px' }}>
          📊 GradeX Admin
        </h1>
        <p style={{ color: '#888', fontSize: '14px' }}>Student Search Analytics</p>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#7f1d1d',
          color: '#fca5a5',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #333',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Total Searches</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0ea5e9' }}>{stats.total}</div>
        </div>
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #333',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Successful</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.successful}</div>
        </div>
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #333',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Failed</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ef4444' }}>{stats.failed}</div>
        </div>
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #333',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>Success Rate</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#0ea5e9' }}>{stats.successRate}%</div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <button
          onClick={loadEnquiries}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: '#0ea5e9',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            opacity: loading ? 0.6 : 1,
          }}
        >
          🔄 Refresh
        </button>
        <button
          onClick={exportCSV}
          disabled={loading || enquiries.length === 0}
          style={{
            padding: '12px 24px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading || enquiries.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            opacity: loading || enquiries.length === 0 ? 0.6 : 1,
          }}
        >
          📥 Export CSV
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          Loading enquiries...
        </div>
      )}

      {/* Enquiries Table */}
      {!loading && enquiries.length > 0 && (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '1px solid #333',
          overflowX: 'auto',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: isMobile ? '11px' : '13px',
          }}>
            <thead>
              <tr style={{ background: '#0ea5e9' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>RA Number</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Search Date</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Time (IST)</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Results</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600' }}>Campuses</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  style={{
                    borderBottom: '1px solid #333',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#252525';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '12px 8px' }}>{enquiry.id}</td>
                  <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '11px' }}>
                    {enquiry.register_number}
                  </td>
                  <td style={{ padding: '12px 8px' }}>{enquiry.student_name || '-'}</td>
                  <td style={{ padding: '12px 8px' }}>{enquiry.search_date || '-'}</td>
                  <td style={{ padding: '12px 8px', fontSize: '11px', color: '#888' }}>
                    {toIST(enquiry.searched_at)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: enquiry.results_found ? '#065f46' : '#7f1d1d',
                      color: enquiry.results_found ? '#6ee7b7' : '#fca5a5',
                    }}>
                      {enquiry.results_found ? '✓ Found' : '✗ Not Found'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{enquiry.result_count || 0}</td>
                  <td style={{ padding: '12px 8px' }}>
                    {(enquiry.campuses || []).map((campus, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          padding: '2px 6px',
                          margin: '2px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          background: '#1e3a8a',
                          color: '#93c5fd',
                        }}
                      >
                        {campus}
                      </span>
                    ))}
                    {(!enquiry.campuses || enquiry.campuses.length === 0) && '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && enquiries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          No enquiries found
        </div>
      )}
    </div>
  );
}

