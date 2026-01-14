# Ansible Playbook Template

> Production-ready Ansible playbooks for server configuration, application deployment, and infrastructure automation

## Overview

This template provides comprehensive Ansible configurations with:
- Role-based structure
- Inventory management
- Vault for secrets
- Common server setup
- Application deployment
- Docker/Kubernetes deployment

## Quick Start

```bash
# Run playbook
ansible-playbook -i inventory/production playbooks/site.yml

# Run with vault password
ansible-playbook -i inventory/production playbooks/site.yml --ask-vault-pass

# Dry run
ansible-playbook -i inventory/production playbooks/site.yml --check

# Limit to specific hosts
ansible-playbook -i inventory/production playbooks/site.yml --limit webservers
```

## Project Structure

```
ansible/
├── ansible.cfg
├── inventory/
│   ├── production/
│   │   ├── hosts.yml
│   │   └── group_vars/
│   │       ├── all.yml
│   │       ├── webservers.yml
│   │       └── vault.yml
│   └── staging/
├── playbooks/
│   ├── site.yml
│   ├── webservers.yml
│   ├── databases.yml
│   └── deploy.yml
├── roles/
│   ├── common/
│   ├── docker/
│   ├── nginx/
│   ├── app/
│   └── monitoring/
├── group_vars/
│   └── all.yml
└── requirements.yml
```

## ansible.cfg

```ini
[defaults]
inventory = inventory/production
remote_user = deploy
private_key_file = ~/.ssh/deploy_key
host_key_checking = False
retry_files_enabled = False
timeout = 30
forks = 10

# Roles path
roles_path = roles:~/.ansible/roles

# Logging
log_path = logs/ansible.log

# Callback plugins
callback_whitelist = profile_tasks, timer
stdout_callback = yaml

# Vault
vault_password_file = .vault_password

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
pipelining = True
ssh_args = -o ControlMaster=auto -o ControlPersist=60s -o UserKnownHostsFile=/dev/null
control_path = /tmp/ansible-%%r@%%h:%%p

[diff]
always = True
context = 3
```

## Inventory (inventory/production/hosts.yml)

```yaml
---
all:
  vars:
    ansible_python_interpreter: /usr/bin/python3
    env: production

  children:
    webservers:
      hosts:
        web1.example.com:
          ansible_host: 10.0.1.10
        web2.example.com:
          ansible_host: 10.0.1.11
        web3.example.com:
          ansible_host: 10.0.1.12
      vars:
        http_port: 80
        https_port: 443

    databases:
      hosts:
        db1.example.com:
          ansible_host: 10.0.2.10
          postgres_role: primary
        db2.example.com:
          ansible_host: 10.0.2.11
          postgres_role: replica
      vars:
        postgres_port: 5432

    redis:
      hosts:
        redis1.example.com:
          ansible_host: 10.0.3.10

    monitoring:
      hosts:
        monitor.example.com:
          ansible_host: 10.0.4.10

    loadbalancers:
      hosts:
        lb1.example.com:
          ansible_host: 10.0.0.10
        lb2.example.com:
          ansible_host: 10.0.0.11
```

## Group Variables (group_vars/all.yml)

```yaml
---
# Global variables
project_name: myapp
domain: example.com
admin_email: admin@example.com

# SSH
ssh_port: 22
ssh_users:
  - name: deploy
    groups: ["sudo", "docker"]
    shell: /bin/bash
    ssh_keys:
      - "ssh-rsa AAAA... deploy@company"

# System packages
common_packages:
  - curl
  - wget
  - vim
  - htop
  - git
  - unzip
  - jq
  - tree

# Security
firewall_allowed_tcp_ports:
  - "{{ ssh_port }}"
  - 80
  - 443

# Docker
docker_edition: ce
docker_users:
  - deploy

# Application
app_user: app
app_group: app
app_directory: /opt/app
app_repo: git@github.com:org/myapp.git
app_version: main

# Environment variables (non-sensitive)
app_env:
  NODE_ENV: production
  LOG_LEVEL: info
  PORT: 3000
```

## Vault Variables (group_vars/vault.yml)

```yaml
---
# Encrypted with: ansible-vault encrypt group_vars/vault.yml

vault_database_password: "supersecretpassword"
vault_redis_password: "redispassword"
vault_app_secret_key: "appsecretkey123"
vault_ssl_certificate: |
  -----BEGIN CERTIFICATE-----
  ...
  -----END CERTIFICATE-----
vault_ssl_private_key: |
  -----BEGIN PRIVATE KEY-----
  ...
  -----END PRIVATE KEY-----
```

## Main Playbook (playbooks/site.yml)

```yaml
---
- name: Configure all servers
  hosts: all
  become: yes
  roles:
    - common

- name: Configure web servers
  hosts: webservers
  become: yes
  roles:
    - docker
    - nginx
    - app

- name: Configure database servers
  hosts: databases
  become: yes
  roles:
    - postgres

- name: Configure Redis servers
  hosts: redis
  become: yes
  roles:
    - redis

- name: Configure monitoring
  hosts: monitoring
  become: yes
  roles:
    - monitoring
```

## Common Role (roles/common/tasks/main.yml)

```yaml
---
- name: Update apt cache
  apt:
    update_cache: yes
    cache_valid_time: 3600
  when: ansible_os_family == "Debian"

- name: Upgrade all packages
  apt:
    upgrade: safe
  when: ansible_os_family == "Debian"
  tags: [upgrade]

- name: Install common packages
  apt:
    name: "{{ common_packages }}"
    state: present
  when: ansible_os_family == "Debian"

- name: Set timezone
  timezone:
    name: "{{ timezone | default('UTC') }}"

- name: Configure NTP
  include_tasks: ntp.yml
  tags: [ntp]

- name: Configure SSH
  include_tasks: ssh.yml
  tags: [ssh]

- name: Configure firewall
  include_tasks: firewall.yml
  tags: [firewall]

- name: Create application user
  user:
    name: "{{ app_user }}"
    group: "{{ app_group }}"
    shell: /bin/bash
    create_home: yes
    system: yes

- name: Configure sysctl
  sysctl:
    name: "{{ item.name }}"
    value: "{{ item.value }}"
    state: present
    reload: yes
  loop:
    - { name: 'net.core.somaxconn', value: '65535' }
    - { name: 'net.ipv4.tcp_max_syn_backlog', value: '65535' }
    - { name: 'vm.swappiness', value: '10' }
    - { name: 'fs.file-max', value: '2097152' }
  tags: [sysctl]

- name: Set system limits
  pam_limits:
    domain: '*'
    limit_type: "{{ item.type }}"
    limit_item: "{{ item.item }}"
    value: "{{ item.value }}"
  loop:
    - { type: 'soft', item: 'nofile', value: '65535' }
    - { type: 'hard', item: 'nofile', value: '65535' }
    - { type: 'soft', item: 'nproc', value: '65535' }
    - { type: 'hard', item: 'nproc', value: '65535' }
  tags: [limits]
```

## Docker Role (roles/docker/tasks/main.yml)

```yaml
---
- name: Install Docker prerequisites
  apt:
    name:
      - apt-transport-https
      - ca-certificates
      - curl
      - gnupg
      - lsb-release
    state: present

- name: Add Docker GPG key
  apt_key:
    url: https://download.docker.com/linux/ubuntu/gpg
    state: present

- name: Add Docker repository
  apt_repository:
    repo: "deb [arch=amd64] https://download.docker.com/linux/ubuntu {{ ansible_distribution_release }} stable"
    state: present
    filename: docker

- name: Install Docker
  apt:
    name:
      - docker-ce
      - docker-ce-cli
      - containerd.io
      - docker-compose-plugin
    state: present
    update_cache: yes

- name: Start and enable Docker
  systemd:
    name: docker
    state: started
    enabled: yes

- name: Add users to docker group
  user:
    name: "{{ item }}"
    groups: docker
    append: yes
  loop: "{{ docker_users }}"

- name: Configure Docker daemon
  template:
    src: daemon.json.j2
    dest: /etc/docker/daemon.json
    owner: root
    group: root
    mode: '0644'
  notify: restart docker

- name: Create Docker networks
  docker_network:
    name: "{{ item }}"
    state: present
  loop: "{{ docker_networks | default(['app']) }}"

- name: Prune unused Docker objects (weekly)
  cron:
    name: "Docker prune"
    special_time: weekly
    job: "docker system prune -af --volumes"
    user: root
```

## App Role (roles/app/tasks/main.yml)

```yaml
---
- name: Create application directory
  file:
    path: "{{ app_directory }}"
    state: directory
    owner: "{{ app_user }}"
    group: "{{ app_group }}"
    mode: '0755'

- name: Clone application repository
  git:
    repo: "{{ app_repo }}"
    dest: "{{ app_directory }}"
    version: "{{ app_version }}"
    accept_hostkey: yes
  become_user: "{{ app_user }}"
  notify: restart app
  tags: [deploy]

- name: Copy environment file
  template:
    src: env.j2
    dest: "{{ app_directory }}/.env"
    owner: "{{ app_user }}"
    group: "{{ app_group }}"
    mode: '0600'
  notify: restart app
  tags: [config]

- name: Copy Docker Compose file
  template:
    src: docker-compose.yml.j2
    dest: "{{ app_directory }}/docker-compose.yml"
    owner: "{{ app_user }}"
    group: "{{ app_group }}"
    mode: '0644'
  notify: restart app
  tags: [config]

- name: Pull Docker images
  community.docker.docker_compose:
    project_src: "{{ app_directory }}"
    pull: yes
  become_user: "{{ app_user }}"
  tags: [deploy]

- name: Start application
  community.docker.docker_compose:
    project_src: "{{ app_directory }}"
    state: present
  become_user: "{{ app_user }}"
  tags: [deploy]

- name: Wait for application to start
  uri:
    url: "http://localhost:{{ app_port | default(3000) }}/health"
    status_code: 200
  register: result
  until: result.status == 200
  retries: 30
  delay: 5
  tags: [deploy]

- name: Run database migrations
  community.docker.docker_container_exec:
    container: "{{ project_name }}_app_1"
    command: npm run migrate
  when: run_migrations | default(false)
  tags: [migrate]
```

## Deploy Playbook (playbooks/deploy.yml)

```yaml
---
- name: Deploy application
  hosts: webservers
  serial: 1  # Rolling deployment
  become: yes

  pre_tasks:
    - name: Drain server from load balancer
      uri:
        url: "http://{{ lb_api }}/drain/{{ inventory_hostname }}"
        method: POST
      delegate_to: localhost
      when: lb_api is defined
      tags: [deploy]

    - name: Wait for connections to drain
      pause:
        seconds: 30
      tags: [deploy]

  tasks:
    - name: Pull latest code
      git:
        repo: "{{ app_repo }}"
        dest: "{{ app_directory }}"
        version: "{{ app_version | default('main') }}"
        force: yes
      become_user: "{{ app_user }}"
      tags: [deploy]

    - name: Pull new Docker images
      community.docker.docker_compose:
        project_src: "{{ app_directory }}"
        pull: yes
      become_user: "{{ app_user }}"
      tags: [deploy]

    - name: Restart application
      community.docker.docker_compose:
        project_src: "{{ app_directory }}"
        state: present
        restarted: yes
      become_user: "{{ app_user }}"
      tags: [deploy]

    - name: Wait for application health check
      uri:
        url: "http://localhost:{{ app_port }}/health"
        status_code: 200
      register: health
      until: health.status == 200
      retries: 60
      delay: 5
      tags: [deploy]

  post_tasks:
    - name: Re-enable server in load balancer
      uri:
        url: "http://{{ lb_api }}/enable/{{ inventory_hostname }}"
        method: POST
      delegate_to: localhost
      when: lb_api is defined
      tags: [deploy]

    - name: Wait for load balancer to register server
      pause:
        seconds: 10
      tags: [deploy]
```

## Requirements (requirements.yml)

```yaml
---
roles:
  - name: geerlingguy.docker
    version: 6.1.0
  - name: geerlingguy.postgresql
    version: 3.4.0
  - name: geerlingguy.redis
    version: 2.0.0
  - name: geerlingguy.nginx
    version: 3.2.0

collections:
  - name: community.docker
    version: 3.4.0
  - name: community.postgresql
    version: 3.2.0
  - name: ansible.posix
    version: 1.5.4
```

## CLAUDE.md Integration

```markdown
# Ansible Playbooks

## Commands
- `ansible-playbook playbooks/site.yml` - Run all playbooks
- `ansible-playbook playbooks/deploy.yml` - Deploy application
- `ansible-playbook playbooks/site.yml --check` - Dry run
- `ansible-vault encrypt group_vars/vault.yml` - Encrypt secrets
- `ansible-galaxy install -r requirements.yml` - Install roles

## Inventory
- `inventory/production/` - Production hosts
- `inventory/staging/` - Staging hosts
- Use `--limit` to target specific groups

## Tags
- `--tags deploy` - Only deployment tasks
- `--tags config` - Only configuration tasks
- `--skip-tags upgrade` - Skip system upgrades

## Vault
```bash
# Create vault password
echo "password" > .vault_password
chmod 600 .vault_password

# Encrypt file
ansible-vault encrypt group_vars/vault.yml

# Edit encrypted file
ansible-vault edit group_vars/vault.yml
```
```

## AI Suggestions

1. **Add Molecule testing** - Implement role testing with Molecule
2. **Configure AWX/Tower** - Add enterprise automation platform
3. **Add callback plugins** - Implement Slack/PagerDuty notifications
4. **Implement dynamic inventory** - Use cloud provider APIs
5. **Add Semaphore UI** - Open-source Ansible UI
6. **Configure facts caching** - Use Redis for fact caching
7. **Add custom modules** - Write Python modules for custom tasks
8. **Implement check mode** - Ensure all tasks support --check
9. **Add tags comprehensively** - Enable granular task execution
10. **Configure pull mode** - Use ansible-pull for large fleets
