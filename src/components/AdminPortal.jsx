import React, { useEffect, useRef } from 'react';

export default function AdminPortal() {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.focus();
    }
  }, []);

  return (
    <section className="admin-portal">
      <div className="admin-hero">
        <div>
          <p className="feedfill-eyebrow">Internal dashboard</p>
          <h2>GradeX Admin Console</h2>
          <p className="feedfill-description">
            Securely manage enquiries, seating imports, and diagnostics directly from the embedded console.
            The admin UI runs independently, so it can load faster and stay isolated from the public GradeX app.
          </p>
        </div>
        <a
          className="feedfill-button"
          href="/GradeX_Admin/index.html"
          target="_blank"
          rel="noreferrer noopener"
        >
          Open in New Tab
        </a>
      </div>

      <div className="admin-iframe-wrapper">
        <iframe
          ref={iframeRef}
          src="/GradeX_Admin/index.html"
          title="GradeX Admin"
          loading="lazy"
          allow="clipboard-write"
        />
      </div>
    </section>
  );
}

