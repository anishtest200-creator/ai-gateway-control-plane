import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Text,
} from '@fluentui/react-components';
import {
  DataUsage24Regular,
  DataUsage24Filled,
  Flow24Regular,
  Flow24Filled,
  Shield24Regular,
  Shield24Filled,
  Key24Regular,
  Key24Filled,
  Grid24Regular,
  Grid24Filled,
  DocumentBulletList24Regular,
  DocumentBulletList24Filled,
  Folder24Regular,
  Folder24Filled,
  People24Regular,
  People24Filled,
  Play24Regular,
  Play24Filled,
  DocumentText24Regular,
  QuestionCircle24Regular,
  Alert24Regular,
  CommentMultiple24Regular,
  SignOut24Regular,
  ChevronDown24Regular,
  Settings24Regular,
  PlugConnected24Regular,
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'hidden',
  },
  topBar: {
    height: '40px',
    backgroundColor: '#0A0A0A',
    borderBottom: '1px solid rgba(212, 168, 67, 0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    flexShrink: 0,
    zIndex: 100,
  },
  topBarBrand: {
    color: '#E8E8E8',
    fontSize: '16px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    letterSpacing: '-0.3px',
  },
  topBarBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#D4A843',
    backgroundColor: 'rgba(212, 168, 67, 0.12)',
    padding: '1px 6px',
    borderRadius: '3px',
    letterSpacing: '0.3px',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    position: 'relative',
  },
  topBarIconBtn: {
    color: '#999',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    '&:hover': {
      color: '#fff',
      backgroundColor: '#1A1A1A',
    },
  },
  notifBadge: {
    position: 'absolute',
    top: '2px',
    right: '2px',
    backgroundColor: '#EF4444',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  profileBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    color: '#ccc',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '4px',
    fontFamily: 'inherit',
    '&:hover': {
      backgroundColor: '#1A1A1A',
      color: '#fff',
    },
  },
  profileAvatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#D4A843',
    color: '#0A0A0A',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  profileName: {
    fontSize: '13px',
    whiteSpace: 'nowrap',
  },
  profileDropdown: {
    position: 'absolute',
    top: '36px',
    right: '0',
    backgroundColor: '#141414',
    border: '1px solid rgba(212, 168, 67, 0.15)',
    borderRadius: '6px',
    padding: '12px 0',
    minWidth: '220px',
    zIndex: 1000,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  profileDropdownInfo: {
    padding: '4px 16px 12px',
  },
  profileDropdownName: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
  },
  profileDropdownEmail: {
    color: '#999',
    fontSize: '12px',
  },
  profileDropdownOrg: {
    color: '#888',
    fontSize: '11px',
    marginTop: '2px',
  },
  profileDropdownDivider: {
    height: '1px',
    backgroundColor: 'rgba(212, 168, 67, 0.15)',
    margin: '4px 0',
  },
  profileDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    color: '#ccc',
    fontSize: '13px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    '&:hover': {
      backgroundColor: '#1A1A1A',
      color: '#fff',
    },
  },
  bodyRow: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '220px',
    backgroundColor: '#0A0A0A',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    flexShrink: 0,
  },
  logo: {
    display: 'none',
  },
  logoIcon: {
    color: '#D4A843',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    color: '#ccc',
    fontSize: '13px',
    fontWeight: 600,
  },
  nav: {
    padding: '16px 0',
    flex: 1,
    overflowY: 'auto',
  },
  navSection: {
    padding: '4px 16px 8px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#B8923A',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 20px',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'none',
    transition: 'all 0.15s',
    borderLeft: '3px solid transparent',
    '&:hover': {
      backgroundColor: '#1A1A1A',
      color: '#fff',
    },
  },
  navItemActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 20px',
    color: '#D4A843',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'none',
    backgroundColor: 'rgba(212, 168, 67, 0.08)',
    borderLeft: '3px solid #D4A843',
    fontWeight: 600,
  },
  content: {
    flex: 1,
    overflow: 'auto',
    backgroundColor: '#0A0A0A',
  },
  header: {
    backgroundColor: '#111111',
    padding: '10px 20px',
    borderBottom: '1px solid rgba(212, 168, 67, 0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  envIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#aaa',
  },
  envDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4ADE80',
  },
  main: {
    padding: '16px 20px',
  },
  sidebarFooter: {
    borderTop: '1px solid rgba(212, 168, 67, 0.10)',
    padding: '8px 0',
    flexShrink: 0,
  },
  sidebarFooterItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '7px 20px',
    color: '#888',
    cursor: 'pointer',
    fontSize: '12px',
    textDecoration: 'none',
    transition: 'all 0.15s',
    backgroundColor: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    '&:hover': {
      backgroundColor: '#1A1A1A',
      color: '#ccc',
    },
  },
});

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactElement;
  activeIcon: React.ReactElement;
  section?: string;
}

const navItems: NavItem[] = [
  {
    path: '/',
    label: 'Overview',
    icon: <Shield24Regular />,
    activeIcon: <Shield24Filled />,
    section: 'Overview',
  },
  {
    path: '/traffic',
    label: 'Traffic',
    icon: <DataUsage24Regular />,
    activeIcon: <DataUsage24Filled />,
    section: 'Operations',
  },
  {
    path: '/routing',
    label: 'Routing',
    icon: <Flow24Regular />,
    activeIcon: <Flow24Filled />,
  },
  {
    path: '/policies',
    label: 'Policies',
    icon: <Shield24Regular />,
    activeIcon: <Shield24Filled />,
  },
  {
    path: '/credentials',
    label: 'Secrets',
    icon: <Key24Regular />,
    activeIcon: <Key24Filled />,
  },
  {
    path: '/assets',
    label: 'Catalog',
    icon: <Grid24Regular />,
    activeIcon: <Grid24Filled />,
    section: 'Inventory',
  },
  {
    path: '/observability',
    label: 'Analytics',
    icon: <DataUsage24Regular />,
    activeIcon: <DataUsage24Filled />,
    section: 'Insights',
  },
  {
    path: '/logs',
    label: 'Audit Log',
    icon: <DocumentBulletList24Regular />,
    activeIcon: <DocumentBulletList24Filled />,
  },
  {
    path: '/namespaces',
    label: 'Namespaces',
    icon: <Folder24Regular />,
    activeIcon: <Folder24Filled />,
    section: 'Administration',
  },
  {
    path: '/access',
    label: 'Access Control',
    icon: <People24Regular />,
    activeIcon: <People24Filled />,
  },
  {
    path: '/compliance',
    label: 'Compliance',
    icon: <Shield24Regular />,
    activeIcon: <Shield24Filled />,
  },
  {
    path: '/test-console',
    label: 'Playground',
    icon: <Play24Regular />,
    activeIcon: <Play24Filled />,
  },
];

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/traffic': 'Traffic',
  '/routing': 'Routing',
  '/policies': 'Policies',
  '/credentials': 'Secrets',
  '/assets': 'Catalog',
  '/observability': 'Analytics',
  '/logs': 'Audit Log',
  '/namespaces': 'Namespaces',
  '/access': 'Access Control',
  '/compliance': 'Compliance',
  '/test-console': 'Playground',
};

const pageSubtitles: Record<string, string> = {
  '/': 'Gateway health, policy coverage, and alerts at a glance',
  '/traffic': 'Real-time request volume, latency, and error rates',
  '/routing': 'Multi-provider rules, failover chains, and load balancing',
  '/policies': 'Token limits, rate limits, and content safety guardrails',
  '/credentials': 'API keys, managed identities, and secret rotation',
  '/assets': 'Registered models, tools, and agents',
  '/observability': 'Usage metrics, cost attribution, and trend analysis',
  '/logs': 'Complete request and response audit trail',
  '/namespaces': 'Team boundaries, quotas, and isolation policies',
  '/access': 'Roles, permissions, and identity management',
  '/compliance': 'Framework mapping and evidence generation',
  '/test-console': 'Test routing rules and policy enforcement live',
};

interface LayoutProps {
  onSignOut?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onSignOut }) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState<string[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const notifications = [
    { id: 'n1', type: 'warning' as const, text: 'Credential azure-openai-key-prod expires in 3 days', time: '2 hours ago', nav: '/credentials' },
    { id: 'n2', type: 'info' as const, text: 'New model gpt-4o-mini registered in ai-platform namespace', time: '5 hours ago', nav: '/assets' },
    { id: 'n3', type: 'error' as const, text: 'Rate limit exceeded for namespace research-sandbox (3 occurrences)', time: '1 day ago', nav: '/policies' },
  ];

  const visibleNotifs = notifications.filter((n) => !dismissedNotifs.includes(n.id));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (): string => {
    return pageTitles[location.pathname] || 'Traffic Dashboard';
  };

  let lastSection = '';

  return (
    <div className={styles.root}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarBrand} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <span style={{ color: '#D4A843', fontSize: 20 }}>⚡</span> Azure AI Gateway
          <span className={styles.topBarBadge}>Preview</span>
        </div>
        <div />
        <div className={styles.topBarRight} ref={profileRef}>
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button className={styles.topBarIconBtn} title="Notifications" onClick={() => setNotifOpen((v) => !v)}>
              <Alert24Regular style={{ fontSize: 18 }} />
              {visibleNotifs.length > 0 && <span className={styles.notifBadge}>{visibleNotifs.length}</span>}
            </button>
            {notifOpen && (
              <div style={{
                position: 'absolute',
                top: 36,
                right: 0,
                backgroundColor: '#141414',
                border: '1px solid rgba(212, 168, 67, 0.15)',
                borderRadius: 6,
                padding: '8px 0',
                minWidth: 340,
                zIndex: 1000,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}>
                <div style={{ padding: '4px 14px 8px', fontSize: 13, fontWeight: 600, color: '#fff' }}>Notifications</div>
                <div style={{ height: 1, backgroundColor: 'rgba(212, 168, 67, 0.15)', margin: '0 0 4px' }} />
                {visibleNotifs.length === 0 && (
                  <div style={{ padding: '16px 14px', fontSize: 12, color: '#999', textAlign: 'center' }}>No notifications</div>
                )}
                {visibleNotifs.map((n) => {
                  const dotColor = n.type === 'error' ? '#EF4444' : n.type === 'warning' ? '#F59E0B' : '#60A5FA';
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = '#1A1A1A'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
                      onClick={() => { setNotifOpen(false); navigate(n.nav); }}
                    >
                      <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0, marginTop: 5 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#E8E8E8', lineHeight: 1.4 }}>{n.text}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{n.time}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDismissedNotifs((prev) => [...prev, n.id]); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer',
                          fontSize: 14,
                          padding: '0 2px',
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                        title="Dismiss"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
                {visibleNotifs.length > 0 && (
                  <>
                    <div style={{ height: 1, backgroundColor: 'rgba(212, 168, 67, 0.15)', margin: '4px 0' }} />
                    <button
                      onClick={() => { setDismissedNotifs(notifications.map((n) => n.id)); }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'center',
                        background: 'transparent',
                        border: 'none',
                        color: '#D4A843',
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Mark all read
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <button className={styles.topBarIconBtn} title="Settings" onClick={() => navigate('/')}>
            <Settings24Regular style={{ fontSize: 18 }} />
          </button>
          <button
            className={styles.profileBtn}
            onClick={() => setProfileOpen((v) => !v)}
          >
            <div className={styles.profileAvatar}>AT</div>
            <span className={styles.profileName}>Anish T.</span>
            <ChevronDown24Regular style={{ fontSize: 14 }} />
          </button>
          {profileOpen && (
            <div className={styles.profileDropdown}>
              <div className={styles.profileDropdownInfo}>
                <div className={styles.profileDropdownName}>Anish Tallapureddy</div>
                <div className={styles.profileDropdownEmail}>anishta@microsoft.com</div>
                <div className={styles.profileDropdownOrg}>Contoso Corp</div>
              </div>
              <div className={styles.profileDropdownDivider} />
              <button className={styles.profileDropdownItem} onClick={() => { setProfileOpen(false); navigate('/'); }}>
                <Settings24Regular style={{ fontSize: 16 }} /> Settings
              </button>
              <button
                className={styles.profileDropdownItem}
                onClick={() => {
                  setProfileOpen(false);
                  onSignOut?.();
                }}
              >
                <SignOut24Regular style={{ fontSize: 16 }} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body Row: Sidebar + Content */}
      <div className={styles.bodyRow}>
        <div className={styles.sidebar}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>⚡</div>
          </div>
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const showSection = item.section && item.section !== lastSection;
              if (item.section) lastSection = item.section;
              const isActive = location.pathname === item.path;

              return (
                <React.Fragment key={item.path}>
                  {showSection && (
                    <div className={styles.navSection}>{item.section}</div>
                  )}
                  <div
                    className={isActive ? styles.navItemActive : styles.navItem}
                    onClick={() => navigate(item.path)}
                  >
                    {isActive ? item.activeIcon : item.icon}
                    <span>{item.label}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </nav>
          <div className={styles.sidebarFooter}>
            <button className={styles.sidebarFooterItem} onClick={() => { onSignOut?.(); setTimeout(() => window.location.href = '/docs', 100); }}>
              <DocumentText24Regular style={{ fontSize: 16 }} /> Docs
            </button>
            <button className={styles.sidebarFooterItem} onClick={() => { onSignOut?.(); setTimeout(() => window.location.href = '/docs', 100); }}>
              <PlugConnected24Regular style={{ fontSize: 16 }} /> API Reference
            </button>
            <button className={styles.sidebarFooterItem} onClick={() => window.open('https://github.com/anishta_microsoft/ai-gateway-control-plane/issues', '_blank')}>
              <QuestionCircle24Regular style={{ fontSize: 16 }} /> Support
            </button>
            <button className={styles.sidebarFooterItem} onClick={() => window.open('https://github.com/anishta_microsoft/ai-gateway-control-plane/issues', '_blank')}>
              <CommentMultiple24Regular style={{ fontSize: 16 }} /> Feedback
            </button>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div>
                <Text size={500} weight="semibold">
                  {getPageTitle()}
                </Text>
                {pageSubtitles[location.pathname] && (
                  <div style={{ marginTop: '2px' }}>
                    <Text size={200} style={{ color: '#999' }}>
                      {pageSubtitles[location.pathname]}
                    </Text>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.envIndicator}>
                <div className={styles.envDot} />
                Production
              </div>
              <Text size={200} style={{ color: '#999' }}>
                Contoso Corp
              </Text>
            </div>
          </div>
          <div className={styles.main}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
