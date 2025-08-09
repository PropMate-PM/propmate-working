#!/usr/bin/env node

/**
 * PropMate Security Monitoring Dashboard
 * 
 * Real-time security monitoring and alerting system.
 * Run with: node security-monitoring-dashboard.js
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  alertEmail: process.env.ALERT_EMAIL || 'admin@propmate.com',
  monitoringInterval: parseInt(process.env.MONITORING_INTERVAL) || 300000, // 5 minutes
  enableSlackAlerts: process.env.SLACK_WEBHOOK_URL ? true : false,
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} [${new Date().toISOString()}] ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} [${new Date().toISOString()}] ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} [${new Date().toISOString()}] ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} [${new Date().toISOString()}] ${msg}`),
  alert: (msg) => console.log(`${colors.red}${colors.bright}🚨${colors.reset} [${new Date().toISOString()}] ${msg}`),
  header: (msg) => console.log(`\n${colors.magenta}${colors.bright}=== ${msg} ===${colors.reset}\n`)
};

// Create admin client
function createAdminClient() {
  return createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

/**
 * Security monitoring checks
 */
class SecurityMonitor {
  constructor() {
    this.supabase = createAdminClient();
    this.alertsSent = new Set(); // Prevent duplicate alerts
    this.lastCheck = new Date();
  }

  /**
   * Check for critical fraud alerts
   */
  async checkFraudAlerts() {
    try {
      const { data: criticalAlerts, error } = await this.supabase
        .from('fraud_alerts')
        .select('*')
        .eq('status', 'open')
        .eq('severity', 'critical')
        .gte('created_at', new Date(Date.now() - config.monitoringInterval).toISOString());

      if (error) {
        log.error(`Failed to check fraud alerts: ${error.message}`);
        return;
      }

      if (criticalAlerts && criticalAlerts.length > 0) {
        for (const alert of criticalAlerts) {
          if (!this.alertsSent.has(alert.id)) {
            await this.sendAlert('CRITICAL_FRAUD_ALERT', {
              alertId: alert.id,
              alertType: alert.alert_type,
              severity: alert.severity,
              details: alert.details,
              userId: alert.user_id,
              createdAt: alert.created_at
            });
            this.alertsSent.add(alert.id);
          }
        }
      }

      // Check for high volume of fraud alerts
      const { data: recentAlerts, error: recentError } = await this.supabase
        .from('fraud_alerts')
        .select('count')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

      if (!recentError && recentAlerts && recentAlerts[0]?.count > 10) {
        await this.sendAlert('HIGH_FRAUD_VOLUME', {
          count: recentAlerts[0].count,
          timeframe: '1 hour'
        });
      }

    } catch (error) {
      log.error(`Fraud alert monitoring failed: ${error.message}`);
    }
  }

  /**
   * Check for suspicious login activity
   */
  async checkSuspiciousLogins() {
    try {
      // Check for failed login attempts
      const { data: failedLogins, error } = await this.supabase
        .from('audit_log')
        .select('*')
        .eq('action_type', 'login_failed')
        .gte('timestamp', new Date(Date.now() - config.monitoringInterval).toISOString());

      if (error) {
        log.error(`Failed to check login attempts: ${error.message}`);
        return;
      }

      if (failedLogins && failedLogins.length > 5) {
        // Group by IP address
        const ipCounts = failedLogins.reduce((acc, log) => {
          const ip = log.ip_address || 'unknown';
          acc[ip] = (acc[ip] || 0) + 1;
          return acc;
        }, {});

        for (const [ip, count] of Object.entries(ipCounts)) {
          if (count > 3) {
            await this.sendAlert('SUSPICIOUS_LOGIN_ACTIVITY', {
              ipAddress: ip,
              failedAttempts: count,
              timeframe: `${config.monitoringInterval / 60000} minutes`
            });
          }
        }
      }

      // Check for admin logins from new IPs
      const { data: adminLogins, error: adminError } = await this.supabase
        .from('audit_log')
        .select('*')
        .eq('action_type', 'login_success')
        .gte('timestamp', new Date(Date.now() - config.monitoringInterval).toISOString());

      if (!adminError && adminLogins) {
        for (const login of adminLogins) {
          // Check if this is an admin user
          const { data: adminRole } = await this.supabase
            .from('admin_roles')
            .select('role')
            .eq('user_id', login.user_id)
            .eq('is_active', true)
            .single();

          if (adminRole && login.ip_address) {
            // This would require storing known admin IPs
            // For now, just log admin logins
            log.info(`Admin login detected: ${login.details?.email} from ${login.ip_address}`);
          }
        }
      }

    } catch (error) {
      log.error(`Login monitoring failed: ${error.message}`);
    }
  }

  /**
   * Check database health and performance
   */
  async checkDatabaseHealth() {
    try {
      // Test database connectivity
      const startTime = Date.now();
      const { data, error } = await this.supabase
        .from('cashback_submissions')
        .select('count')
        .limit(1);
      const responseTime = Date.now() - startTime;

      if (error) {
        await this.sendAlert('DATABASE_ERROR', {
          error: error.message,
          code: error.code
        });
        return;
      }

      if (responseTime > 5000) { // 5 seconds
        await this.sendAlert('DATABASE_SLOW_RESPONSE', {
          responseTime: `${responseTime}ms`,
          threshold: '5000ms'
        });
      }

      // Check for old pending requests
      const { data: oldPending, error: pendingError } = await this.supabase
        .from('cashback_submissions')
        .select('count')
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!pendingError && oldPending && oldPending[0]?.count > 20) {
        await this.sendAlert('OLD_PENDING_REQUESTS', {
          count: oldPending[0].count,
          age: '7+ days'
        });
      }

    } catch (error) {
      log.error(`Database health check failed: ${error.message}`);
    }
  }

  /**
   * Check for unusual submission patterns
   */
  async checkSubmissionPatterns() {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      
      // Check submission volume
      const { data: recentSubmissions, error } = await this.supabase
        .from('cashback_submissions')
        .select('*')
        .gte('created_at', oneHourAgo.toISOString());

      if (error) {
        log.error(`Failed to check submissions: ${error.message}`);
        return;
      }

      if (recentSubmissions && recentSubmissions.length > 50) {
        await this.sendAlert('HIGH_SUBMISSION_VOLUME', {
          count: recentSubmissions.length,
          timeframe: '1 hour',
          threshold: 50
        });
      }

      // Check for duplicate wallet addresses
      if (recentSubmissions) {
        const walletCounts = recentSubmissions.reduce((acc, sub) => {
          acc[sub.wallet_address] = (acc[sub.wallet_address] || 0) + 1;
          return acc;
        }, {});

        for (const [wallet, count] of Object.entries(walletCounts)) {
          if (count > 1) {
            await this.sendAlert('DUPLICATE_WALLET_USAGE', {
              walletAddress: wallet.substring(0, 10) + '...',
              submissionCount: count,
              timeframe: '1 hour'
            });
          }
        }
      }

    } catch (error) {
      log.error(`Submission pattern check failed: ${error.message}`);
    }
  }

  /**
   * Check system resources and limits
   */
  async checkSystemLimits() {
    try {
      // Check rate limit violations
      const { data: rateLimits, error } = await this.supabase
        .from('rate_limits')
        .select('*')
        .not('blocked_until', 'is', null)
        .gte('updated_at', new Date(Date.now() - config.monitoringInterval).toISOString());

      if (!error && rateLimits && rateLimits.length > 10) {
        await this.sendAlert('HIGH_RATE_LIMIT_VIOLATIONS', {
          blockedCount: rateLimits.length,
          timeframe: `${config.monitoringInterval / 60000} minutes`
        });
      }

      // Check email communication volume
      const { data: emailVolume, error: emailError } = await this.supabase
        .from('user_communications')
        .select('count')
        .gte('sent_at', new Date(Date.now() - 3600000).toISOString());

      if (!emailError && emailVolume && emailVolume[0]?.count > 100) {
        log.warning(`High email volume: ${emailVolume[0].count} emails in last hour`);
      }

    } catch (error) {
      log.error(`System limits check failed: ${error.message}`);
    }
  }

  /**
   * Send alert notification
   */
  async sendAlert(alertType, details) {
    const alertKey = `${alertType}_${JSON.stringify(details)}`;
    
    // Prevent duplicate alerts within 1 hour
    if (this.alertsSent.has(alertKey)) {
      return;
    }

    this.alertsSent.add(alertKey);
    setTimeout(() => this.alertsSent.delete(alertKey), 3600000); // Remove after 1 hour

    log.alert(`${alertType}: ${JSON.stringify(details, null, 2)}`);

    // Send Slack notification if configured
    if (config.enableSlackAlerts) {
      await this.sendSlackAlert(alertType, details);
    }

    // Log alert to audit trail
    await this.supabase.rpc('log_audit_event', {
      user_uuid: null,
      action_type_param: 'security_alert',
      details_param: JSON.stringify({
        alert_type: alertType,
        details: details,
        timestamp: new Date().toISOString()
      })
    });
  }

  /**
   * Send Slack alert
   */
  async sendSlackAlert(alertType, details) {
    try {
      const payload = {
        text: `🚨 PropMate Security Alert: ${alertType}`,
        attachments: [
          {
            color: alertType.includes('CRITICAL') ? 'danger' : 'warning',
            fields: [
              {
                title: 'Alert Type',
                value: alertType,
                short: true
              },
              {
                title: 'Time',
                value: new Date().toISOString(),
                short: true
              },
              {
                title: 'Details',
                value: JSON.stringify(details, null, 2),
                short: false
              }
            ]
          }
        ]
      };

      // In a real implementation, you would use fetch or axios
      console.log('Slack Alert Payload:', JSON.stringify(payload, null, 2));
      
    } catch (error) {
      log.error(`Failed to send Slack alert: ${error.message}`);
    }
  }

  /**
   * Generate security report
   */
  async generateDailyReport() {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      log.header('Daily Security Report');

      // Get fraud alerts summary
      const { data: fraudSummary } = await this.supabase
        .from('fraud_alerts')
        .select('severity, status, count(*)')
        .gte('created_at', yesterday.toISOString())
        .group('severity, status');

      log.info('Fraud Alerts (Last 24h):');
      if (fraudSummary && fraudSummary.length > 0) {
        fraudSummary.forEach(item => {
          log.info(`  ${item.severity} ${item.status}: ${item.count}`);
        });
      } else {
        log.success('  No fraud alerts');
      }

      // Get login activity
      const { data: loginActivity } = await this.supabase
        .from('audit_log')
        .select('action_type, count(*)')
        .in('action_type', ['login_success', 'login_failed'])
        .gte('timestamp', yesterday.toISOString())
        .group('action_type');

      log.info('Login Activity (Last 24h):');
      if (loginActivity && loginActivity.length > 0) {
        loginActivity.forEach(item => {
          log.info(`  ${item.action_type}: ${item.count}`);
        });
      } else {
        log.info('  No login activity');
      }

      // Get submission stats
      const { data: submissionStats } = await this.supabase
        .from('cashback_submissions')
        .select('status, count(*)')
        .gte('created_at', yesterday.toISOString())
        .group('status');

      log.info('Submissions (Last 24h):');
      if (submissionStats && submissionStats.length > 0) {
        submissionStats.forEach(item => {
          log.info(`  ${item.status}: ${item.count}`);
        });
      } else {
        log.info('  No new submissions');
      }

      log.success('Daily security report completed');

    } catch (error) {
      log.error(`Failed to generate daily report: ${error.message}`);
    }
  }

  /**
   * Run all monitoring checks
   */
  async runMonitoringCycle() {
    log.info('Starting security monitoring cycle...');

    try {
      await Promise.all([
        this.checkFraudAlerts(),
        this.checkSuspiciousLogins(),
        this.checkDatabaseHealth(),
        this.checkSubmissionPatterns(),
        this.checkSystemLimits()
      ]);

      log.success('Security monitoring cycle completed');
    } catch (error) {
      log.error(`Monitoring cycle failed: ${error.message}`);
    }
  }
}

/**
 * Start monitoring daemon
 */
async function startMonitoring() {
  console.log(`${colors.magenta}${colors.bright}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           PropMate Security Monitoring Dashboard         ║');
  console.log('║              Real-time Security Monitoring              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Check configuration
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    log.error('Missing required environment variables:');
    log.error('  VITE_SUPABASE_URL');
    log.error('  SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const monitor = new SecurityMonitor();

  log.info(`Security monitoring started`);
  log.info(`Monitoring interval: ${config.monitoringInterval / 1000} seconds`);
  log.info(`Alert email: ${config.alertEmail}`);
  log.info(`Slack alerts: ${config.enableSlackAlerts ? 'Enabled' : 'Disabled'}`);

  // Run initial check
  await monitor.runMonitoringCycle();

  // Schedule regular monitoring
  const monitoringInterval = setInterval(async () => {
    await monitor.runMonitoringCycle();
  }, config.monitoringInterval);

  // Generate daily report at midnight
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) - now;
  
  setTimeout(() => {
    monitor.generateDailyReport();
    
    // Schedule daily reports
    setInterval(() => {
      monitor.generateDailyReport();
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log.info('Shutting down security monitoring...');
    clearInterval(monitoringInterval);
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log.info('Shutting down security monitoring...');
    clearInterval(monitoringInterval);
    process.exit(0);
  });
}

// Start monitoring if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMonitoring().catch(console.error);
}

export { SecurityMonitor, startMonitoring };