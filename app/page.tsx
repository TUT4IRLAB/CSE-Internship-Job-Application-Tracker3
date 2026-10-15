
'use client';

import { useEffect, useState } from 'react';

type Application = {
  id: number;
  company: string;
  role: string;
  applied_on: string;
  status: string;
  url: string;
  notes: string;
};

type Job = {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  posted: string;
};

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const blank = () => ({
  company: '',
  role: '',
  applied_on: new Date().toLocaleDateString('en-CA'),
  status: 'applied',
  url: '',
  notes: '',
});

const statuses = ['applied', 'interview', 'offer', 'rejected'];

const labels: Record<string, string> = {
  applied: 'Applied',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export default function Home() {
  const [items, setItems] = useState<Application[]>([]);
  const [form, setForm] = useState(blank());
  const [editing, setEditing] = useState<number | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'tracker' | 'jobs'>('dashboard');
  const [filter, setFilter] = useState('all');
  const [applicationSearch, setApplicationSearch] = useState('');
  const [query, setQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    try {
      const r = await fetch(`${API}/api/applications`);
      if (!r.ok) throw Error('API unavailable');
      setItems(await r.json());
      setError('');
    } catch {
      setError('Could not load applications. Check your backend and database.');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const r = await fetch(
        `${API}/api/applications${editing ? '/' + editing : ''}`,
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );

      if (!r.ok) throw Error('Could not save');

      setSuccess(editing ? 'Application updated successfully!' : 'Application added successfully!');
      setForm(blank());
      setEditing(null);
      setShowForm(false);
      await refresh();
    } catch {
      setError('Unable to save application.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm('Are you sure you want to delete this application?')) return;

    try {
      const r = await fetch(`${API}/api/applications/${id}`, {
        method: 'DELETE',
      });
      if (!r.ok) throw Error();
      await refresh();
      setSuccess('Application deleted successfully.');
    } catch {
      setError('Delete failed.');
    }
  }

  function edit(x: Application) {
    setEditing(x.id);
    setForm({
      company: x.company,
      role: x.role,
      applied_on: x.applied_on.slice(0, 10),
      status: x.status,
      url: x.url || '',
      notes: x.notes || '',
    });
    setShowForm(true);
    setTab('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function searchJobs() {
    setLoading(true);
    setError('');

    try {
      const r = await fetch(`${API}/api/jobs?search=${encodeURIComponent(query)}`);
      if (!r.ok) throw Error();
      const data = await r.json();
      setJobs(data.jobs || []);
    } catch {
      setError('Job search unavailable. Try again later.');
    } finally {
      setLoading(false);
    }
  }

  function trackJob(j: Job) {
    setForm({
      ...blank(),
      company: j.company,
      role: j.title,
      url: j.url,
      notes: 'Found through CareerTrack job search. Not yet applied.',
    });
    setEditing(null);
    setShowForm(true);
    setTab('tracker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const total = items.length;
  const applied = items.filter(x => x.status === 'applied').length;
  const interviews = items.filter(x => x.status === 'interview').length;
  const offers = items.filter(x => x.status === 'offer').length;
  const rejected = items.filter(x => x.status === 'rejected').length;

  const visible = items.filter(x => {
    const matchesStatus = filter === 'all' || x.status === filter;
    const matchesSearch =
      x.company.toLowerCase().includes(applicationSearch.toLowerCase()) ||
      x.role.toLowerCase().includes(applicationSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = [
    { title: 'Total Applications', value: total, icon: '◈', color: 'blue' },
    { title: 'Applied', value: applied, icon: '↗', color: 'purple' },
    { title: 'Interviews', value: interviews, icon: '◷', color: 'orange' },
    { title: 'Offers', value: offers, icon: '★', color: 'green' },
  ];

  function applicationList(list: Application[]) {
    return (
      <div className="application-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">▤</div>
            <h3>No applications found</h3>
            <p>Add your first application or change your filters.</p>
          </div>
        ) : (
          list.map(x => (
            <div className="application-card" key={x.id}>
              <div className="company-avatar">
                {x.company.charAt(0).toUpperCase()}
              </div>

              <div className="application-info">
                <h3>{x.role}</h3>
                <p>{x.company}</p>
                <small>Applied: {x.applied_on.slice(0, 10)}</small>
                {x.notes && <p className="application-notes">{x.notes}</p>}
              </div>

              <div className="application-right">
                <span className={`status-badge ${x.status}`}>
                  {labels[x.status] || x.status}
                </span>
                <div className="card-actions">
                  <button onClick={() => edit(x)}>Edit</button>
                  <button className="delete-btn" onClick={() => remove(x.id)}>
                    Delete
                  </button>
                  {x.url && (
                    <a href={x.url} target="_blank" rel="noopener noreferrer">
                      View ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="career-app">
      <aside className="career-sidebar">
        <div className="career-logo">
          <div className="logo-symbol">✦</div>
          <span>Career<span className="logo-highlight">Track</span></span>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="career-navigation">
          <button
            className={tab === 'dashboard' ? 'active' : ''}
            onClick={() => setTab('dashboard')}
          >
            <span>▦</span> Dashboard
          </button>
          <button
            className={tab === 'tracker' ? 'active' : ''}
            onClick={() => setTab('tracker')}
          >
            <span>▤</span> My Applications
          </button>
          <button
            className={tab === 'jobs' ? 'active' : ''}
            onClick={() => setTab('jobs')}
          >
            <span>⌕</span> Find Jobs
          </button>
        </nav>

        <div className="sidebar-help">
          <strong>Ready for your next move?</strong>
          <p>Stay organised and keep moving towards your career goals.</p>
          <button onClick={() => setTab('jobs')}>Explore Jobs →</button>
        </div>

        <div className="sidebar-profile">
          <div className="profile-circle">CT</div>
          <div>
            <strong>CareerTrack</strong>
            <small>Student Workspace</small>
          </div>
        </div>
      </aside>

      <main className="career-main">
        <header className="career-topbar">
          <div>
            <span className="breadcrumb">Workspace / {tab === 'dashboard' ? 'Dashboard' : tab === 'tracker' ? 'Applications' : 'Find Jobs'}</span>
          </div>
          <div className="topbar-right">
            <span className="online-dot"></span>
            <span>CareerTrack Workspace</span>
            <div className="topbar-avatar">CT</div>
          </div>
        </header>

        <div className="career-content">
          {error && <div className="message-error" role="alert">{error}</div>}
          {success && (
            <div className="message-success">
              {success}
              <button onClick={() => setSuccess('')}>×</button>
            </div>
          )}

          {tab === 'dashboard' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="section-eyebrow">YOUR CAREER OVERVIEW</div>
                  <h1>Welcome to CareerTrack <span>✦</span></h1>
                  <p>Here&apos;s what&apos;s happening with your job search.</p>
                </div>
                <button
                  className="career-primary"
                  onClick={() => {
                    setEditing(null);
                    setForm(blank());
                    setShowForm(true);
                    setTab('tracker');
                  }}
                >
                  + New Application
                </button>
              </div>

              <div className="career-stats">
                {stats.map(s => (
                  <div className="career-stat-card" key={s.title}>
                    <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                    <span>{s.title}</span>
                    <strong>{s.value}</strong>
                    <small>Current records</small>
                  </div>
                ))}
              </div>

              <div className="dashboard-grid">
                <section className="career-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Application Overview</h2>
                      <p>Your applications by status</p>
                    </div>
                  </div>

                  <div className="chart-area">
                    {[
                      { name: 'Applied', count: applied, color: '#6366f1' },
                      { name: 'Interview', count: interviews, color: '#f59e0b' },
                      { name: 'Offer', count: offers, color: '#10b981' },
                      { name: 'Rejected', count: rejected, color: '#ef4444' },
                    ].map(s => (
                      <div className="chart-row" key={s.name}>
                        <span>{s.name}</span>
                        <div className="chart-track">
                          <div
                            className="chart-fill"
                            style={{
                              width: `${total ? (s.count / total) * 100 : 0}%`,
                              backgroundColor: s.color,
                            }}
                          ></div>
                        </div>
                        <strong>{s.count}</strong>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="career-panel quick-actions">
                  <h2>Quick Actions</h2>
                  <p>What would you like to do today?</p>

                  <button onClick={() => {
                    setForm(blank());
                    setEditing(null);
                    setShowForm(true);
                    setTab('tracker');
                  }}>
                    <span className="quick-icon">＋</span>
                    <span><strong>Add Application</strong><small>Track a new opportunity</small></span>
                    <span>→</span>
                  </button>

                  <button onClick={() => setTab('jobs')}>
                    <span className="quick-icon">⌕</span>
                    <span><strong>Find Opportunities</strong><small>Explore available jobs</small></span>
                    <span>→</span>
                  </button>

                  <button onClick={() => setTab('tracker')}>
                    <span className="quick-icon">▤</span>
                    <span><strong>Manage Applications</strong><small>Review your progress</small></span>
                    <span>→</span>
                  </button>
                </section>
              </div>

              <section className="career-panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Recent Applications</h2>
                    <p>Your latest tracked opportunities</p>
                  </div>
                  <button className="text-button" onClick={() => setTab('tracker')}>
                    View All →
                  </button>
                </div>
                {applicationList(items.slice(0, 5))}
              </section>
            </>
          )}

          {tab === 'tracker' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="section-eyebrow">APPLICATION MANAGEMENT</div>
                  <h1>My Applications</h1>
                  <p>Manage and monitor all your job applications.</p>
                </div>
                <button
                  className="career-primary"
                  onClick={() => {
                    setEditing(null);
                    setForm(blank());
                    setShowForm(!showForm);
                  }}
                >
                  {showForm ? 'Close Form' : '+ Add Application'}
                </button>
              </div>

              {showForm && (
                <section className="career-panel form-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>{editing ? 'Edit Application' : 'New Application'}</h2>
                      <p>Enter the details of your opportunity.</p>
                    </div>
                  </div>

                  <form onSubmit={save} className="career-form">
                    <div className="form-row">
                      <label>
                        Company Name
                        <input required maxLength={160} value={form.company}
                          onChange={e => setForm({ ...form, company: e.target.value })}
                          placeholder="e.g. Eskom" />
                      </label>
                      <label>
                        Job Position
                        <input required maxLength={160} value={form.role}
                          onChange={e => setForm({ ...form, role: e.target.value })}
                          placeholder="e.g. Graduate Intern" />
                      </label>
                    </div>

                    <div className="form-row">
                      <label>
                        Date Applied
                        <input type="date" required value={form.applied_on}
                          onChange={e => setForm({ ...form, applied_on: e.target.value })} />
                      </label>
                      <label>
                        Application Status
                        <select value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}>
                          {statuses.map(s => (
                            <option key={s} value={s}>{labels[s]}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      Job Posting URL
                      <input type="url" value={form.url}
                        onChange={e => setForm({ ...form, url: e.target.value })}
                        placeholder="https://example.com/job" />
                    </label>

                    <label>
                      Notes
                      <textarea rows={4} value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="Interview details, important dates, contacts..." />
                    </label>

                    <div className="form-actions">
                      <button className="career-primary" type="submit" disabled={saving}>
                        {saving ? 'Saving...' : editing ? 'Save Changes' : 'Save Application'}
                      </button>
                      <button type="button" className="career-secondary"
                        onClick={() => {
                          setShowForm(false);
                          setEditing(null);
                          setForm(blank());
                        }}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </section>
              )}

              <section className="career-panel">
                <div className="panel-heading">
                  <div>
                    <h2>All Applications <span className="count-badge">{items.length}</span></h2>
                    <p>Keep track of every opportunity.</p>
                  </div>
                </div>

                <div className="filter-bar">
                  <input
                    value={applicationSearch}
                    onChange={e => setApplicationSearch(e.target.value)}
                    placeholder="Search company or job title..."
                    aria-label="Search applications"
                  />
                  <select value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    {statuses.map(s => (
                      <option key={s} value={s}>{labels[s]}</option>
                    ))}
                  </select>
                </div>

                {applicationList(visible)}
              </section>
            </>
          )}

          {tab === 'jobs' && (
            <>
              <div className="page-heading">
                <div>
                  <div className="section-eyebrow">OPPORTUNITY DISCOVERY</div>
                  <h1>Find Your Next Opportunity</h1>
                  <p>Explore jobs and discover your next career move.</p>
                </div>
              </div>

              <section className="career-panel job-search-panel">
                <h2>Search Job Opportunities</h2>
                <p>Find remote job listings using the Remotive job search service.</p>

                <div className="job-search-bar">
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchJobs()}
                    placeholder="Job title, internship, graduate, engineering..."
                  />
                  <button className="career-primary" onClick={searchJobs} disabled={loading}>
                    {loading ? 'Searching...' : '⌕ Search Jobs'}
                  </button>
                </div>

                <div className="suggested-searches">
                  <span>Popular searches:</span>
                  {['Internship', 'Graduate', 'Developer', 'Engineering'].map(s => (
                    <button key={s} onClick={() => setQuery(s)}>{s}</button>
                  ))}
                </div>
              </section>

              <div className="jobs-results-heading">
                <h2>Available Opportunities</h2>
                <span>{jobs.length} results</span>
              </div>

              <div className="jobs-grid">
                {jobs.map(j => (
                  <article className="career-job-card" key={j.id}>
                    <div className="job-company-icon">
                      {j.company.charAt(0).toUpperCase()}
                    </div>
                    <h3>{j.title}</h3>
                    <p className="job-company-name">{j.company}</p>
                    <p className="job-location">⌖ {j.location}</p>
                    <div className="job-card-actions">
                      <button className="career-primary" onClick={() => trackJob(j)}>
                        Track Job
                      </button>
                      <a href={j.url} target="_blank" rel="noopener noreferrer">
                        View Job ↗
                      </a>
                    </div>
                  </article>
                ))}
              </div>

              {!jobs.length && (
                <div className="career-panel empty-state">
                  <div className="empty-icon">⌕</div>
                  <h3>No job results yet</h3>
                  <p>Search for a role to discover available opportunities.</p>
                </div>
              )}
            </>
          )}

          <footer className="career-footer">
            <span>© 2026 CareerTrack. Built for future professionals.</span>
            <span>TUT 4IR Research Lab · Project 17</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
