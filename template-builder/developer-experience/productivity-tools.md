# Productivity Tools Template

## Overview
Comprehensive productivity setup with terminal multiplexers, command-line tools, automation utilities, and developer workflows.

## Quick Start
```bash
# Essential tools
brew install tmux fzf ripgrep fd bat eza jq

# Terminal improvements
brew install starship zoxide atuin
```

## Tmux Configuration

### ~/.tmux.conf
```bash
# ~/.tmux.conf - Tmux configuration

# Prefix key
unbind C-b
set -g prefix C-a
bind C-a send-prefix

# General settings
set -g default-terminal "screen-256color"
set -ga terminal-overrides ",xterm-256color:Tc"
set -g mouse on
set -g history-limit 50000
set -g base-index 1
setw -g pane-base-index 1
set -g renumber-windows on
set -g set-clipboard on

# Faster key repetition
set -s escape-time 0
set -g repeat-time 500

# Window and pane management
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"
bind c new-window -c "#{pane_current_path}"
unbind '"'
unbind %

# Vim-like pane navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# Vim-like pane resizing
bind -r H resize-pane -L 5
bind -r J resize-pane -D 5
bind -r K resize-pane -U 5
bind -r L resize-pane -R 5

# Window navigation
bind -r C-h previous-window
bind -r C-l next-window

# Copy mode (vim-like)
setw -g mode-keys vi
bind -T copy-mode-vi v send -X begin-selection
bind -T copy-mode-vi y send -X copy-pipe-and-cancel "pbcopy"
bind -T copy-mode-vi MouseDragEnd1Pane send -X copy-pipe-and-cancel "pbcopy"

# Reload config
bind r source-file ~/.tmux.conf \; display "Config reloaded!"

# Session management
bind S command-prompt -p "New session:" "new-session -A -s '%%'"
bind K confirm-before -p "Kill session #S? (y/n)" kill-session

# Status bar
set -g status-position top
set -g status-interval 1
set -g status-style bg=default,fg=white

set -g status-left-length 40
set -g status-left "#[fg=blue,bold]#S #[fg=white]│ "

set -g status-right-length 100
set -g status-right "#[fg=cyan]%H:%M #[fg=white]│ #[fg=yellow]%Y-%m-%d"

# Window status
setw -g window-status-format " #I:#W "
setw -g window-status-current-format "#[fg=black,bg=blue,bold] #I:#W "

# Pane borders
set -g pane-border-style fg=brightblack
set -g pane-active-border-style fg=blue

# Plugins (TPM)
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @plugin 'tmux-plugins/tmux-yank'

# Plugin settings
set -g @resurrect-capture-pane-contents 'on'
set -g @continuum-restore 'on'

# Initialize TPM (keep at bottom)
run '~/.tmux/plugins/tpm/tpm'
```

## FZF Configuration

### ~/.fzf.zsh
```bash
# ~/.fzf.zsh - FZF configuration

# Setup fzf
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Use fd instead of find
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'

# Preview settings
export FZF_DEFAULT_OPTS="
  --height 60%
  --layout=reverse
  --border
  --preview '([[ -f {} ]] && (bat --style=numbers --color=always {} || cat {})) || ([[ -d {} ]] && (eza --tree --level=2 --color=always {} || tree -C {})) || echo {} 2> /dev/null | head -200'
  --preview-window=right:50%:wrap
  --bind 'ctrl-/:toggle-preview'
  --bind 'ctrl-y:execute-silent(echo -n {} | pbcopy)'
  --bind 'ctrl-e:execute(code {+})'
"

# Use fd for path completion
_fzf_compgen_path() {
  fd --hidden --follow --exclude ".git" . "$1"
}

_fzf_compgen_dir() {
  fd --type d --hidden --follow --exclude ".git" . "$1"
}

# Custom functions
# Find file and open in editor
fe() {
  local file
  file=$(fzf --query="$1" --select-1 --exit-0)
  [ -n "$file" ] && ${EDITOR:-vim} "$file"
}

# Find directory and cd
fcd() {
  local dir
  dir=$(fd --type d --hidden --follow --exclude ".git" . ${1:-.} | fzf)
  [ -n "$dir" ] && cd "$dir"
}

# Find in git log
flog() {
  git log --oneline --color=always | fzf --ansi --preview 'git show --color=always {1}'
}

# Find branch and checkout
fbr() {
  local branches branch
  branches=$(git branch -a --color=always | grep -v HEAD)
  branch=$(echo "$branches" | fzf --ansi | sed 's/.* //' | sed 's#remotes/origin/##')
  [ -n "$branch" ] && git checkout "$branch"
}

# Kill process
fkill() {
  local pid
  pid=$(ps -ef | sed 1d | fzf -m | awk '{print $2}')
  [ -n "$pid" ] && echo "$pid" | xargs kill -${1:-9}
}

# Search environment variables
fenv() {
  printenv | fzf
}

# Search history
fh() {
  eval $(history | fzf --tac | sed 's/ *[0-9]* *//')
}
```

## Zoxide Configuration

### ~/.zshrc (zoxide section)
```bash
# Zoxide - smarter cd
eval "$(zoxide init zsh)"

# Aliases
alias cd="z"
alias cdi="zi"  # Interactive selection

# Custom zoxide query
zq() {
  zoxide query -l "$@" | fzf --preview 'eza --tree --level=2 --color=always {}'
}
```

## Atuin (Shell History)

### ~/.config/atuin/config.toml
```toml
# Atuin configuration

# Database settings
db_path = "~/.local/share/atuin/history.db"

# Search settings
search_mode = "fuzzy"
filter_mode = "global"
filter_mode_shell_up_key_binding = "session"

# UI settings
style = "compact"
show_preview = true
max_preview_height = 4

# Sync settings (optional)
# sync_address = "https://api.atuin.sh"
# sync_frequency = "10m"

# Key bindings
[keys]
up = "search"
ctrl-r = "search"
```

## Git Productivity

### ~/.gitconfig additions
```ini
[alias]
    # Quick status
    s = status -sb

    # Interactive staging
    ia = add -i

    # Fuzzy checkout
    co = "!f() { git branch -a | fzf | xargs git checkout; }; f"

    # Fuzzy delete branch
    bd = "!f() { git branch | fzf -m | xargs git branch -D; }; f"

    # Interactive rebase
    ri = "!f() { git rebase -i $(git log --oneline | fzf | cut -d' ' -f1)^; }; f"

    # Show changed files in commit
    changed = "!f() { git log --oneline | fzf --preview 'git show --stat {1}' | cut -d' ' -f1; }; f"

    # Undo last commit
    undo = reset --soft HEAD~1

    # Amend without editing message
    amend = commit --amend --no-edit

    # Stash with message
    ss = stash push -m

    # List stashes with preview
    sl = "!f() { git stash list | fzf --preview 'git stash show -p $(echo {} | cut -d: -f1)'; }; f"

    # Apply stash interactively
    sa = "!f() { git stash list | fzf | cut -d: -f1 | xargs git stash apply; }; f"

    # Graph log
    graph = log --graph --oneline --all --decorate

    # Today's commits
    today = log --since=midnight --oneline --author='$(git config user.email)'

    # Weekly summary
    week = log --since='1 week ago' --oneline --author='$(git config user.email)'

    # Find commits by message
    find = "!f() { git log --oneline --all | fzf --query=\"$1\"; }; f"
```

## Useful Shell Functions

### ~/.functions
```bash
# Quick project navigation
proj() {
  local project
  project=$(fd --type d --max-depth 2 . ~/Projects ~/Work 2>/dev/null | fzf)
  [ -n "$project" ] && cd "$project" && code .
}

# Create and enter directory
mkcd() {
  mkdir -p "$1" && cd "$1"
}

# Extract any archive
extract() {
  if [ -f "$1" ]; then
    case "$1" in
      *.tar.bz2)   tar xjf "$1"     ;;
      *.tar.gz)    tar xzf "$1"     ;;
      *.tar.xz)    tar xJf "$1"     ;;
      *.bz2)       bunzip2 "$1"     ;;
      *.rar)       unrar x "$1"     ;;
      *.gz)        gunzip "$1"      ;;
      *.tar)       tar xf "$1"      ;;
      *.tbz2)      tar xjf "$1"     ;;
      *.tgz)       tar xzf "$1"     ;;
      *.zip)       unzip "$1"       ;;
      *.Z)         uncompress "$1"  ;;
      *.7z)        7z x "$1"        ;;
      *)           echo "Cannot extract '$1'" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# Quick HTTP server
serve() {
  local port="${1:-8000}"
  echo "Serving on http://localhost:$port"
  python3 -m http.server "$port"
}

# Check what's using a port
port() {
  lsof -i ":$1"
}

# Kill process on port
killport() {
  lsof -ti ":$1" | xargs kill -9
}

# Quick notes
note() {
  local notes_dir="$HOME/Notes"
  mkdir -p "$notes_dir"
  if [ -z "$1" ]; then
    ${EDITOR:-vim} "$notes_dir"
  else
    ${EDITOR:-vim} "$notes_dir/$1.md"
  fi
}

# Today's note
today() {
  local notes_dir="$HOME/Notes/daily"
  mkdir -p "$notes_dir"
  ${EDITOR:-vim} "$notes_dir/$(date +%Y-%m-%d).md"
}

# Search in files
rgs() {
  rg --color=always "$1" | fzf --ansi
}

# Docker quick commands
dsh() { docker exec -it "$1" /bin/sh; }
dlogs() { docker logs -f "$1"; }
dstop() { docker stop $(docker ps -q); }
dclean() { docker system prune -af; }

# Git quick commit
qc() {
  git add -A
  git commit -m "$*"
}

# Open GitHub repo in browser
ghopen() {
  local url
  url=$(git remote get-url origin 2>/dev/null | sed 's/git@github.com:/https:\/\/github.com\//' | sed 's/\.git$//')
  [ -n "$url" ] && open "$url"
}

# Create PR
pr() {
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  gh pr create --title "${1:-$branch}" --body "${2:-}"
}

# Weather
weather() {
  curl -s "wttr.in/${1:-}"
}

# Cheat sheet
cheat() {
  curl "cheat.sh/$1"
}

# Calculator
calc() {
  echo "scale=4; $*" | bc
}

# JSON pretty print
json() {
  if [ -p /dev/stdin ]; then
    cat - | python3 -m json.tool
  else
    python3 -m json.tool "$1"
  fi
}

# Base64 encode/decode
b64e() { echo -n "$1" | base64; }
b64d() { echo -n "$1" | base64 -d; }

# URL encode/decode
urle() { python3 -c "import urllib.parse; print(urllib.parse.quote('$1'))"; }
urld() { python3 -c "import urllib.parse; print(urllib.parse.unquote('$1'))"; }

# Get public IP
myip() {
  curl -s https://api.ipify.org && echo
}

# Speed test
speedtest() {
  curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
}
```

## Automation Scripts

### scripts/dev-session.sh
```bash
#!/usr/bin/env bash
# Start a development tmux session

SESSION="dev"
PROJECT_DIR="${1:-$(pwd)}"

# Check if session exists
tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  # Create new session
  tmux new-session -d -s $SESSION -c "$PROJECT_DIR"

  # Window 1: Editor
  tmux rename-window -t $SESSION:1 'editor'
  tmux send-keys -t $SESSION:1 'nvim .' C-m

  # Window 2: Dev server
  tmux new-window -t $SESSION -n 'server' -c "$PROJECT_DIR"
  tmux send-keys -t $SESSION:2 'npm run dev' C-m

  # Window 3: Shell
  tmux new-window -t $SESSION -n 'shell' -c "$PROJECT_DIR"

  # Window 4: Git
  tmux new-window -t $SESSION -n 'git' -c "$PROJECT_DIR"
  tmux send-keys -t $SESSION:4 'git status' C-m

  # Select editor window
  tmux select-window -t $SESSION:1
fi

# Attach to session
tmux attach-session -t $SESSION
```

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "dev:tmux": "./scripts/dev-session.sh",
    "dev:watch": "nodemon --exec 'npm run dev'",
    "clean": "rm -rf .next node_modules",
    "fresh": "npm run clean && npm install && npm run dev",
    "open": "open http://localhost:3000",
    "open:db": "npx prisma studio",
    "logs": "tail -f logs/*.log",
    "profile": "node --inspect npm run dev"
  }
}
```

## CLAUDE.md Integration

```markdown
## Productivity Tools

### Tmux
- `Ctrl+A |` - Split vertical
- `Ctrl+A -` - Split horizontal
- `Ctrl+A c` - New window
- `Ctrl+A h/j/k/l` - Navigate panes
- `Ctrl+A [` - Copy mode

### FZF
- `Ctrl+T` - Find file
- `Alt+C` - Find directory
- `Ctrl+R` - Search history
- `fe` - Find and edit file
- `fbr` - Checkout branch

### Quick Commands
- `proj` - Jump to project
- `mkcd` - Make and cd
- `serve` - HTTP server
- `port 3000` - Check port
- `qc "message"` - Quick commit

### Development Session
```bash
npm run dev:tmux
```
```

## AI Suggestions

1. **Workflow automation** - Script common tasks
2. **Session templates** - Pre-configured layouts
3. **Smart suggestions** - Context-aware commands
4. **Command history** - Learn from usage
5. **Integration sync** - Connect tools together
6. **Performance monitoring** - Track tool usage
7. **Custom widgets** - Status bar enhancements
8. **Remote development** - SSH workflows
9. **Team sharing** - Share configurations
10. **Backup/restore** - Configuration management
