---
layout: post
title: "Ubuntu 24.04 Server Hardening: A Practical 16-Step Guide"
date: 2026-08-31
description: "Harden a fresh Ubuntu 24.04 LTS server without locking yourself out: secure SSH, configure UFW and Fail2ban, enable updates, auditing, backups, and monitoring."
excerpt: "A practical, ordered checklist for turning a fresh Ubuntu 24.04 server into a defensible baseline—without losing SSH access along the way."
image: /assets/images/posts/ubuntu-server-hardening.jpg
image_alt: "An orange server protected by layered shields, a firewall, monitoring, an access key, and an encrypted backup vault"
---

A fresh Ubuntu server is reasonably secure, but it is not ready to be forgotten
on the public internet. Secure defaults help; a defensible server also needs a
small attack surface, controlled access, timely patches, useful logs, and a
recovery plan.

This guide turns a new **Ubuntu 24.04 LTS** server into a practical baseline in
16 ordered steps. Each step explains why it matters and how to check the result.
It is a baseline, not a universal policy: a Docker host, VPN gateway, database,
and web server do not have identical requirements.

> Keep your current SSH session open while changing access or firewall settings.
> Test every change from a second terminal before closing the working session.
> Also confirm that your provider offers a serial or VNC console in case SSH
> becomes unavailable.

## The checklist

| # | Control | Priority |
|---|---------|----------|
| 1 | Take a recovery snapshot | Essential |
| 2 | Create a non-root administrator | Essential |
| 3 | Restrict SSH access | Essential |
| 4 | Enable a default-deny firewall | Essential |
| 5 | Rate-limit repeated login failures | Essential |
| 6 | Enable automatic security updates | Essential |
| 7 | Review kernel and network settings | Recommended |
| 8 | Confirm AppArmor is enforcing | Recommended |
| 9 | Enable system auditing and persistent logs | Recommended |
| 10 | Review temporary and world-writable storage | Recommended |
| 11 | Remove unused services | Recommended |
| 12 | Add a second SSH factor | Advanced |
| 13 | Run security audits | Advanced |
| 14 | Automate encrypted off-site backups | Essential |
| 15 | Centralize monitoring and alerts | Recommended |
| 16 | Establish a maintenance routine | Recommended |

## 1. Create a recovery point

Take a full disk snapshot from the hosting provider before changing the server.
Record the public IP address and verify that you can reach the provider's
out-of-band console without SSH. A snapshot is not a backup strategy, but it is
the quickest way to recover from a bad firewall or boot configuration.

## 2. Create a non-root administrator

Using a named account creates a useful audit trail and prevents routine commands
from running with unrestricted privileges.

```bash
adduser adminuser
usermod -aG sudo adminuser
install -d -m 700 -o adminuser -g adminuser /home/adminuser/.ssh
nano /home/adminuser/.ssh/authorized_keys
chown adminuser:adminuser /home/adminuser/.ssh/authorized_keys
chmod 600 /home/adminuser/.ssh/authorized_keys
```

Paste your public key into `authorized_keys`, then test from another terminal:

```bash
ssh adminuser@SERVER_IP
sudo whoami
```

The second command should print `root`. Do not continue until both commands work.

## 3. Restrict SSH access

Create a backup and add a small configuration drop-in instead of rewriting the
distribution's main file:

```bash
sudo cp -a /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
sudo nano /etc/ssh/sshd_config.d/99-hardening.conf
```

```text
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin no
PubkeyAuthentication yes
X11Forwarding no
MaxAuthTries 4
AllowUsers adminuser
```

Validate the complete configuration before reloading SSH:

```bash
sudo sshd -t
sudo systemctl reload ssh
```

Open another terminal and confirm that key login works. Then confirm a
password-only attempt is refused:

```bash
ssh adminuser@SERVER_IP
ssh -o PubkeyAuthentication=no adminuser@SERVER_IP
```

Changing port 22 can reduce log noise, but it does not replace authentication or
a firewall. If you change the port, update the firewall before reloading SSH.

## 4. Enable a default-deny firewall

Allow the SSH port first, followed only by services the machine is intended to
publish:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Do not add ports 80 and 443 unless the server actually handles web traffic. On a
cloud platform, align UFW with the provider's security groups or network firewall
instead of assuming one replaces the other.

## 5. Block repeated login failures

Key-only SSH removes password guessing, while Fail2ban still limits noisy,
repeated failures and can protect other services later.

```bash
sudo apt update
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.d/sshd.local
```

```ini
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
```

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd
```

If trusted users share a NAT address, consider an `ignoreip` entry so one person
cannot temporarily block everyone behind the same public IP.

## 6. Enable automatic security updates

Apply the current updates, install the updater, and enable its periodic job:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install unattended-upgrades apt-listchanges -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
sudo unattended-upgrade --dry-run --debug
```

Review `/etc/apt/apt.conf.d/50unattended-upgrades`. Security updates should be
allowed, unused dependencies may be removed, and automatic reboot behavior must
match the service's availability requirements. An update that needs a restart is
not fully deployed until the affected process—or the server—has restarted.

## 7. Review kernel and network settings

Create `/etc/sysctl.d/99-hardening.conf` with settings appropriate to the host:

```text
# Disable routing only when this server is not a router, VPN gateway, or container host.
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# Reject source-routed packets and ICMP redirects.
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Keep SYN cookies and useful malformed-packet logging enabled.
net.ipv4.tcp_syncookies = 1
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
```

Apply and inspect the result:

```bash
sudo sysctl --system
sudo sysctl net.ipv4.tcp_syncookies net.ipv4.conf.all.accept_redirects
```

Do not blindly enable strict reverse-path filtering on hosts with asymmetric
routing, multiple interfaces, policy routing, or some VPN setups. Likewise,
Docker and Kubernetes hosts normally require forwarding.

## 8. Confirm AppArmor is enforcing

AppArmor limits what a compromised process can access beyond normal Unix file
permissions.

```bash
sudo apt install apparmor apparmor-utils -y
sudo systemctl enable --now apparmor
sudo aa-status
```

Review profiles in complain mode rather than converting them all at once. A
profile should be enforced only after its denials have been tested against the
real workload.

## 9. Enable auditing and persistent logs

Auditd records security-relevant changes that ordinary application logs may
miss:

```bash
sudo apt install auditd audispd-plugins -y
sudo systemctl enable --now auditd
sudo nano /etc/audit/rules.d/hardening.rules
```

```text
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k sudoers
-w /etc/sudoers.d/ -p wa -k sudoers
-w /etc/ssh/sshd_config -p wa -k sshd_config
-w /etc/ssh/sshd_config.d/ -p wa -k sshd_config
```

```bash
sudo augenrules --load
sudo auditctl -l
sudo aureport --summary
```

For systemd-journald, set `Storage=persistent` in
`/etc/systemd/journald.conf`, restart it, and check disk limits so logs cannot
consume the filesystem.

## 10. Review temporary and world-writable storage

Find unusual world-writable files and directories on the root filesystem:

```bash
sudo find / -xdev -type f -perm -0002 -print
sudo find / -xdev -type d -perm -0002 ! -perm -1000 -print
```

Review every result; do not delete matches automatically. Mount options such as
`nodev`, `nosuid`, and `noexec` can reduce risk on `/tmp` or `/dev/shm`, but
`noexec` may break installers, build tools, and applications. Test changes in a
maintenance window and keep console access available.

To restrict core dumps from privileged programs:

```bash
echo 'fs.suid_dumpable = 0' | sudo tee /etc/sysctl.d/60-suid-dumpable.conf
sudo sysctl --system
```

## 11. Remove unused services and ports

Inventory what listens on the network and what starts at boot:

```bash
sudo ss -tulpn
systemctl list-unit-files --state=enabled
```

Disable a service only after identifying why it is installed and confirming the
workload does not need it. Common candidates on a headless machine include CUPS,
Bluetooth, and Avahi, but package choices vary by image:

```bash
sudo systemctl disable --now cups
sudo systemctl disable --now bluetooth
sudo systemctl disable --now avahi-daemon
sudo apt autoremove --purge
```

Re-run `ss -tulpn`; every remaining listener should have an owner and a reason.

## 12. Add a second factor to SSH

For high-value systems, require both a key and a time-based one-time password:

```bash
sudo apt install libpam-google-authenticator -y
google-authenticator
```

Store the emergency codes offline. Add this to `/etc/pam.d/sshd`:

```text
auth required pam_google_authenticator.so
```

Then update the SSH drop-in:

```text
KbdInteractiveAuthentication yes
AuthenticationMethods publickey,keyboard-interactive
PasswordAuthentication no
```

Run `sudo sshd -t`, reload SSH, and verify key plus OTP login in a second window.
Keep the original connection open until the complete flow succeeds.

## 13. Run security audits

Lynis provides a broad configuration review. Rootkit scanners can provide another
signal, but their findings need interpretation and do not prove a machine is
clean.

```bash
sudo apt install lynis rkhunter -y
sudo rkhunter --propupd
sudo rkhunter --check --sk
sudo lynis audit system
```

Only run `rkhunter --propupd` after establishing that the server itself is
trusted; that command accepts the current file properties as the baseline.

## 14. Automate encrypted off-site backups

Hardening cannot prevent a failed disk, destructive deployment, stolen account,
or ransomware. Use the 3-2-1 principle: three copies, two storage types, and one
copy off-site. Restic encrypts data before uploading it:

```bash
sudo apt install restic -y
export RESTIC_REPOSITORY='s3:https://OBJECT_STORAGE_ENDPOINT/BUCKET'
export RESTIC_PASSWORD_FILE='/root/.config/restic/password'
restic init
restic backup /etc /home /var/www
restic snapshots
```

Do not place the repository password directly in a globally readable cron entry
or shell history. Use a root-readable environment file or secret manager, then
schedule backups and retention with a systemd timer. Back up application data in
a consistent state—databases generally need a native dump or snapshot.

Test a restore regularly:

```bash
mkdir /tmp/restic-restore-test
restic restore latest --target /tmp/restic-restore-test
```

Inspect restored files, then remove the test directory when finished. A backup
that has never been restored is only an assumption.

## 15. Centralize monitoring and alerts

Local logs may disappear with the server. Send authentication and audit events
to another host or a managed logging service. At minimum, alert on:

- repeated Fail2ban bans and failed `sudo` attempts;
- unexpected listening ports or new privileged users;
- low disk space and filesystem errors;
- failed backups and failed unattended upgrades;
- AppArmor denials and audit rule changes.

A daily summary from Logwatch is a useful small-server starting point:

```bash
sudo apt install logwatch -y
sudo logwatch --detail high --range today
```

Monitoring is valuable only when an alert reaches someone who can respond.

## 16. Make hardening a routine

Configuration drifts as software is installed, firewall rules change, and keys
accumulate. Put these checks on the calendar:

| Cadence | Check |
|---------|-------|
| Weekly | Review firewall rules, Fail2ban activity, failed units, and backup results. |
| Monthly | Confirm automatic updates are succeeding and inspect listening ports. |
| Quarterly | Restore representative files and review every authorized SSH key. |
| Quarterly | Re-run Lynis and compare new findings with the previous report. |
| Yearly | Review the server's purpose, exposed services, owners, and recovery plan. |

## Final verification

Before calling the baseline complete, capture the output of these commands in a
private operations record:

```bash
sudo sshd -t
sudo ufw status verbose
sudo fail2ban-client status sshd
sudo ss -tulpn
sudo aa-status
sudo auditctl -l
systemctl --failed
sudo unattended-upgrade --dry-run
```

Hardening is not a single command or a perfect score. It is a layered system:
prevent unnecessary access, limit what a successful intrusion can do, preserve
evidence, detect changes, and maintain a tested path back to working service.

This guide targets Ubuntu 24.04 LTS. Re-check package behavior and defaults before
using it on another release, and adapt every control to the server's actual role.
