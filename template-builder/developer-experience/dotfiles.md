# Dotfiles Template

## Overview
Comprehensive dotfiles management with shell configurations, tool configs, and automated setup scripts for consistent development environments.

## Quick Start
```bash
# Clone your dotfiles
git clone https://github.com/username/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./install.sh
```

## Directory Structure

```
~/.dotfiles/
├── install.sh           # Main installation script
├── Brewfile             # macOS package list
├── shell/
│   ├── .zshrc          # Zsh configuration
│   ├── .bashrc         # Bash configuration
│   ├── .aliases        # Shell aliases
│   ├── .functions      # Shell functions
│   └── .exports        # Environment variables
├── git/
│   ├── .gitconfig      # Git configuration
│   └── .gitignore_global
├── vim/
│   ├── .vimrc          # Vim configuration
│   └── .vim/
├── editor/
│   ├── .editorconfig   # Editor config
│   └── vscode/
├── config/
│   ├── starship.toml   # Starship prompt
│   ├── alacritty.yml   # Terminal config
│   └── tmux.conf       # Tmux configuration
└── scripts/
    ├── bootstrap.sh    # System bootstrap
    ├── symlink.sh      # Symlink manager
    └── macos.sh        # macOS defaults
```

## Installation Script

### install.sh
```bash
#!/usr/bin/env bash
# install.sh - Main dotfiles installation script

set -e

DOTFILES_DIR="$HOME/.dotfiles"
BACKUP_DIR="$HOME/.dotfiles_backup/$(date +%Y%m%d_%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if running on macOS or Linux
detect_os() {
  case "$(uname -s)" in
    Darwin) OS="macos" ;;
    Linux)  OS="linux" ;;
    *)      OS="unknown" ;;
  esac
  log_info "Detected OS: $OS"
}

# Backup existing dotfiles
backup_dotfiles() {
  log_info "Backing up existing dotfiles..."
  mkdir -p "$BACKUP_DIR"

  local files=(
    ".zshrc" ".bashrc" ".bash_profile"
    ".gitconfig" ".gitignore_global"
    ".vimrc" ".editorconfig"
    ".tmux.conf"
  )

  for file in "${files[@]}"; do
    if [ -f "$HOME/$file" ] && [ ! -L "$HOME/$file" ]; then
      cp "$HOME/$file" "$BACKUP_DIR/"
      log_info "Backed up $file"
    fi
  done

  log_success "Backup complete: $BACKUP_DIR"
}

# Create symlinks
create_symlinks() {
  log_info "Creating symlinks..."

  # Shell configs
  ln -sf "$DOTFILES_DIR/shell/.zshrc" "$HOME/.zshrc"
  ln -sf "$DOTFILES_DIR/shell/.bashrc" "$HOME/.bashrc"
  ln -sf "$DOTFILES_DIR/shell/.aliases" "$HOME/.aliases"
  ln -sf "$DOTFILES_DIR/shell/.functions" "$HOME/.functions"
  ln -sf "$DOTFILES_DIR/shell/.exports" "$HOME/.exports"

  # Git configs
  ln -sf "$DOTFILES_DIR/git/.gitconfig" "$HOME/.gitconfig"
  ln -sf "$DOTFILES_DIR/git/.gitignore_global" "$HOME/.gitignore_global"

  # Vim configs
  ln -sf "$DOTFILES_DIR/vim/.vimrc" "$HOME/.vimrc"
  ln -sf "$DOTFILES_DIR/vim/.vim" "$HOME/.vim"

  # Editor config
  ln -sf "$DOTFILES_DIR/editor/.editorconfig" "$HOME/.editorconfig"

  # Config directory
  mkdir -p "$HOME/.config"
  ln -sf "$DOTFILES_DIR/config/starship.toml" "$HOME/.config/starship.toml"

  # Tmux
  ln -sf "$DOTFILES_DIR/config/tmux.conf" "$HOME/.tmux.conf"

  log_success "Symlinks created"
}

# Install Homebrew (macOS)
install_homebrew() {
  if [ "$OS" != "macos" ]; then return; fi

  if ! command -v brew &> /dev/null; then
    log_info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  else
    log_info "Homebrew already installed"
  fi

  log_info "Installing packages from Brewfile..."
  brew bundle --file="$DOTFILES_DIR/Brewfile"

  log_success "Homebrew packages installed"
}

# Install packages (Linux)
install_linux_packages() {
  if [ "$OS" != "linux" ]; then return; fi

  log_info "Installing Linux packages..."

  if command -v apt-get &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y \
      zsh \
      git \
      vim \
      tmux \
      curl \
      wget \
      ripgrep \
      fd-find \
      fzf \
      jq \
      htop
  elif command -v dnf &> /dev/null; then
    sudo dnf install -y \
      zsh \
      git \
      vim \
      tmux \
      curl \
      wget \
      ripgrep \
      fd-find \
      fzf \
      jq \
      htop
  fi

  log_success "Linux packages installed"
}

# Install Oh My Zsh
install_oh_my_zsh() {
  if [ -d "$HOME/.oh-my-zsh" ]; then
    log_info "Oh My Zsh already installed"
    return
  fi

  log_info "Installing Oh My Zsh..."
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

  # Install plugins
  log_info "Installing Zsh plugins..."

  ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"

  # zsh-autosuggestions
  if [ ! -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ]; then
    git clone https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
  fi

  # zsh-syntax-highlighting
  if [ ! -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]; then
    git clone https://github.com/zsh-users/zsh-syntax-highlighting "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
  fi

  # zsh-completions
  if [ ! -d "$ZSH_CUSTOM/plugins/zsh-completions" ]; then
    git clone https://github.com/zsh-users/zsh-completions "$ZSH_CUSTOM/plugins/zsh-completions"
  fi

  log_success "Oh My Zsh installed with plugins"
}

# Install Starship prompt
install_starship() {
  if command -v starship &> /dev/null; then
    log_info "Starship already installed"
    return
  fi

  log_info "Installing Starship prompt..."
  curl -sS https://starship.rs/install.sh | sh -s -- -y

  log_success "Starship installed"
}

# Set default shell to Zsh
set_default_shell() {
  if [ "$SHELL" = "$(which zsh)" ]; then
    log_info "Zsh is already the default shell"
    return
  fi

  log_info "Setting Zsh as default shell..."
  chsh -s "$(which zsh)"

  log_success "Default shell set to Zsh"
}

# Configure macOS defaults
configure_macos() {
  if [ "$OS" != "macos" ]; then return; fi

  log_info "Configuring macOS defaults..."

  # Keyboard
  defaults write NSGlobalDomain KeyRepeat -int 2
  defaults write NSGlobalDomain InitialKeyRepeat -int 15

  # Finder
  defaults write com.apple.finder ShowPathbar -bool true
  defaults write com.apple.finder ShowStatusBar -bool true
  defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv"
  defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"

  # Dock
  defaults write com.apple.dock autohide -bool true
  defaults write com.apple.dock tilesize -int 48
  defaults write com.apple.dock show-recents -bool false

  # Screenshots
  defaults write com.apple.screencapture location -string "${HOME}/Screenshots"
  defaults write com.apple.screencapture type -string "png"

  # Restart affected apps
  killall Finder Dock 2>/dev/null || true

  log_success "macOS defaults configured"
}

# Main installation
main() {
  echo ""
  echo "╔════════════════════════════════════════╗"
  echo "║     Dotfiles Installation Script       ║"
  echo "╚════════════════════════════════════════╝"
  echo ""

  detect_os
  backup_dotfiles

  if [ "$OS" = "macos" ]; then
    install_homebrew
  else
    install_linux_packages
  fi

  install_oh_my_zsh
  install_starship
  create_symlinks
  set_default_shell

  if [ "$OS" = "macos" ]; then
    configure_macos
  fi

  log_success "Dotfiles installation complete!"
  log_info "Please restart your terminal or run: source ~/.zshrc"
}

main "$@"
```

## Shell Configuration

### shell/.zshrc
```bash
# ~/.zshrc - Zsh configuration

# Oh My Zsh configuration
export ZSH="$HOME/.oh-my-zsh"

# Theme
ZSH_THEME=""  # Using Starship prompt

# Plugins
plugins=(
  git
  docker
  docker-compose
  npm
  node
  python
  golang
  rust
  kubectl
  terraform
  aws
  zsh-autosuggestions
  zsh-syntax-highlighting
  zsh-completions
)

source $ZSH/oh-my-zsh.sh

# Load additional configs
[[ -f ~/.aliases ]] && source ~/.aliases
[[ -f ~/.functions ]] && source ~/.functions
[[ -f ~/.exports ]] && source ~/.exports
[[ -f ~/.localrc ]] && source ~/.localrc

# Starship prompt
eval "$(starship init zsh)"

# FZF
[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh

# Node Version Manager
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Bun
[ -s "$HOME/.bun/_bun" ] && source "$HOME/.bun/_bun"
export BUN_INSTALL="$HOME/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# pnpm
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Completion settings
autoload -Uz compinit
compinit

# History settings
HISTSIZE=50000
SAVEHIST=50000
HISTFILE=~/.zsh_history
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE
setopt SHARE_HISTORY

# Key bindings
bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down
```

### shell/.aliases
```bash
# ~/.aliases - Shell aliases

# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
alias ~="cd ~"
alias -- -="cd -"

# List files
alias ls="eza --icons"
alias ll="eza -la --icons"
alias la="eza -a --icons"
alias lt="eza --tree --level=2 --icons"
alias l="eza -l --icons"

# Git aliases
alias g="git"
alias gs="git status"
alias ga="git add"
alias gaa="git add --all"
alias gc="git commit -m"
alias gca="git commit --amend"
alias gco="git checkout"
alias gcb="git checkout -b"
alias gd="git diff"
alias gds="git diff --staged"
alias gl="git log --oneline -n 20"
alias gp="git push"
alias gpf="git push --force-with-lease"
alias gpl="git pull"
alias gf="git fetch"
alias gb="git branch"
alias gm="git merge"
alias gr="git rebase"
alias gst="git stash"
alias gstp="git stash pop"

# Docker
alias d="docker"
alias dc="docker compose"
alias dps="docker ps"
alias dpsa="docker ps -a"
alias di="docker images"
alias drm="docker rm"
alias drmi="docker rmi"
alias dprune="docker system prune -af"

# Kubernetes
alias k="kubectl"
alias kgp="kubectl get pods"
alias kgs="kubectl get services"
alias kgd="kubectl get deployments"
alias kga="kubectl get all"
alias kl="kubectl logs"
alias ke="kubectl exec -it"
alias kd="kubectl describe"
alias kaf="kubectl apply -f"
alias kdf="kubectl delete -f"

# Node.js
alias ni="npm install"
alias nid="npm install --save-dev"
alias nig="npm install -g"
alias nr="npm run"
alias ns="npm start"
alias nt="npm test"
alias nb="npm run build"
alias nu="npm update"

# pnpm
alias p="pnpm"
alias pi="pnpm install"
alias pa="pnpm add"
alias pad="pnpm add -D"
alias pr="pnpm run"
alias pd="pnpm dev"
alias pb="pnpm build"

# Python
alias py="python3"
alias pip="pip3"
alias venv="python3 -m venv"
alias activate="source venv/bin/activate"

# File operations
alias cp="cp -iv"
alias mv="mv -iv"
alias rm="rm -iv"
alias mkdir="mkdir -pv"

# Utilities
alias c="clear"
alias h="history"
alias j="jobs -l"
alias path="echo $PATH | tr ':' '\n'"
alias reload="source ~/.zshrc"
alias edit="$EDITOR"
alias ip="curl -s https://api.ipify.org && echo"
alias localip="ipconfig getifaddr en0"
alias weather="curl -s wttr.in"

# Quick edits
alias zshrc="$EDITOR ~/.zshrc"
alias aliases="$EDITOR ~/.aliases"
alias gitconfig="$EDITOR ~/.gitconfig"

# Process management
alias ports="lsof -i -P -n | grep LISTEN"
alias psg="ps aux | grep -v grep | grep -i"
alias killport="kill -9 \$(lsof -t -i:"

# Directory shortcuts
alias dev="cd ~/Development"
alias projects="cd ~/Projects"
alias downloads="cd ~/Downloads"
alias desktop="cd ~/Desktop"

# macOS specific
if [[ "$OSTYPE" == "darwin"* ]]; then
  alias showfiles="defaults write com.apple.finder AppleShowAllFiles -bool true && killall Finder"
  alias hidefiles="defaults write com.apple.finder AppleShowAllFiles -bool false && killall Finder"
  alias cleanup="find . -type f -name '*.DS_Store' -ls -delete"
  alias emptytrash="sudo rm -rfv /Volumes/*/.Trashes; sudo rm -rfv ~/.Trash/*"
  alias update="brew update && brew upgrade && brew cleanup"
fi
```

### shell/.functions
```bash
# ~/.functions - Shell functions

# Create directory and cd into it
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
      *)           echo "'$1' cannot be extracted" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# Find file by name
ff() {
  find . -type f -iname "*$1*"
}

# Find directory by name
fd() {
  find . -type d -iname "*$1*"
}

# Search history
hs() {
  history | grep "$1"
}

# Create a new React component
component() {
  local name="$1"
  local dir="src/components/$name"

  mkdir -p "$dir"

  cat > "$dir/$name.tsx" << EOF
import React from 'react';

interface ${name}Props {
  className?: string;
}

export function ${name}({ className }: ${name}Props) {
  return (
    <div className={className}>
      ${name}
    </div>
  );
}
EOF

  cat > "$dir/index.ts" << EOF
export { ${name} } from './${name}';
EOF

  echo "Created component: $dir"
}

# Quick git commit with message
quickcommit() {
  git add -A
  git commit -m "$*"
}

# Git branch cleanup
gitclean() {
  git fetch -p
  git branch -vv | grep ': gone]' | awk '{print $1}' | xargs -r git branch -D
}

# Start new project
newproject() {
  local name="${1:-my-project}"

  npx create-next-app@latest "$name" \
    --typescript \
    --tailwind \
    --eslint \
    --app \
    --src-dir \
    --import-alias "@/*"

  cd "$name"
  git init
  echo "Project $name created!"
}

# Docker shell into container
dsh() {
  docker exec -it "$1" /bin/sh
}

# Docker logs follow
dlf() {
  docker logs -f "$1"
}

# Serve current directory
serve() {
  local port="${1:-8000}"
  python3 -m http.server "$port"
}

# Backup file
backup() {
  cp "$1" "${1}.backup.$(date +%Y%m%d_%H%M%S)"
}

# JSON pretty print
json() {
  if [ -p /dev/stdin ]; then
    cat - | python3 -m json.tool
  else
    python3 -m json.tool "$1"
  fi
}

# Quick notes
note() {
  local notes_dir="$HOME/Notes"
  mkdir -p "$notes_dir"

  if [ -z "$1" ]; then
    $EDITOR "$notes_dir"
  else
    $EDITOR "$notes_dir/$1.md"
  fi
}

# Kill process by port
killp() {
  local port="$1"
  local pid=$(lsof -ti :"$port")

  if [ -n "$pid" ]; then
    echo "Killing process $pid on port $port"
    kill -9 "$pid"
  else
    echo "No process found on port $port"
  fi
}

# Weather
weather() {
  curl "wttr.in/${1:-}"
}

# Cheat sheet
cheat() {
  curl "cheat.sh/$1"
}
```

### shell/.exports
```bash
# ~/.exports - Environment variables

# Default editor
export EDITOR="code --wait"
export VISUAL="$EDITOR"

# Language
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"

# History
export HISTSIZE=50000
export SAVEHIST=50000
export HISTCONTROL=ignoreboth:erasedups

# Path
export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/bin:$PATH"
export PATH="/usr/local/bin:$PATH"

# Node.js
export NODE_ENV="development"

# Go
export GOPATH="$HOME/go"
export PATH="$GOPATH/bin:$PATH"

# Rust
export PATH="$HOME/.cargo/bin:$PATH"

# Python
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1

# FZF
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_DEFAULT_OPTS='--height 40% --layout=reverse --border'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"

# Less
export LESS='-R'
export LESSHISTFILE=-

# GPG
export GPG_TTY=$(tty)

# Docker
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Kubernetes
export KUBECONFIG="$HOME/.kube/config"

# AWS
export AWS_PAGER=""

# Man pages
export MANPAGER="sh -c 'col -bx | bat -l man -p'"
```

## Git Configuration

### git/.gitconfig
```ini
[user]
    name = Your Name
    email = your.email@example.com
    signingkey = YOUR_GPG_KEY

[core]
    editor = code --wait
    autocrlf = input
    excludesfile = ~/.gitignore_global
    pager = delta

[init]
    defaultBranch = main

[pull]
    rebase = true

[push]
    autoSetupRemote = true
    default = current

[fetch]
    prune = true

[rebase]
    autosquash = true

[merge]
    conflictstyle = diff3

[diff]
    colorMoved = default

[commit]
    gpgsign = true

[tag]
    gpgsign = true

[delta]
    navigate = true
    light = false
    line-numbers = true
    side-by-side = true

[alias]
    # Status
    s = status -sb
    st = status

    # Logging
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    ll = log --oneline -n 20
    last = log -1 HEAD --stat

    # Branches
    br = branch
    co = checkout
    cb = checkout -b
    bd = branch -d
    bD = branch -D

    # Commits
    ci = commit
    cm = commit -m
    ca = commit --amend
    can = commit --amend --no-edit

    # Diff
    df = diff
    dfs = diff --staged
    dc = diff --cached

    # Add
    aa = add --all
    ap = add -p

    # Push/Pull
    ps = push
    pf = push --force-with-lease
    pl = pull
    plr = pull --rebase

    # Stash
    ss = stash
    sp = stash pop
    sl = stash list

    # Reset
    unstage = reset HEAD --
    undo = reset --soft HEAD~1

    # Clean
    cleanup = !git branch --merged | grep -v '\\*\\|main\\|master\\|develop' | xargs -n 1 git branch -d

    # Misc
    aliases = config --get-regexp alias
    contributors = shortlog --summary --numbered

[credential]
    helper = osxkeychain

[filter "lfs"]
    clean = git-lfs clean -- %f
    smudge = git-lfs smudge -- %f
    process = git-lfs filter-process
    required = true

[url "git@github.com:"]
    insteadOf = https://github.com/
```

## Starship Prompt

### config/starship.toml
```toml
# ~/.config/starship.toml

format = """
$username\
$hostname\
$directory\
$git_branch\
$git_status\
$nodejs\
$python\
$rust\
$golang\
$docker_context\
$kubernetes\
$cmd_duration\
$line_break\
$character"""

[character]
success_symbol = "[❯](bold green)"
error_symbol = "[❯](bold red)"

[username]
style_user = "blue bold"
style_root = "red bold"
format = "[$user]($style) "
disabled = false
show_always = true

[hostname]
ssh_only = true
format = "at [$hostname](bold yellow) "

[directory]
truncation_length = 3
truncate_to_repo = true
style = "cyan bold"
format = "[$path]($style)[$read_only]($read_only_style) "

[git_branch]
symbol = " "
style = "purple bold"
format = "on [$symbol$branch]($style) "

[git_status]
conflicted = "⚔️ "
ahead = "⇡${count}"
behind = "⇣${count}"
diverged = "⇕⇡${ahead_count}⇣${behind_count}"
untracked = "?${count}"
stashed = "📦"
modified = "!${count}"
staged = "+${count}"
renamed = "»${count}"
deleted = "✖${count}"
style = "yellow"
format = '([\[$all_status$ahead_behind\]]($style) )'

[nodejs]
symbol = " "
style = "green"
format = "[$symbol($version )]($style)"

[python]
symbol = " "
style = "yellow"
format = '[${symbol}${pyenv_prefix}(${version} )(\($virtualenv\) )]($style)'

[rust]
symbol = " "
style = "red"
format = "[$symbol($version )]($style)"

[golang]
symbol = " "
style = "cyan"
format = "[$symbol($version )]($style)"

[docker_context]
symbol = " "
style = "blue"
format = "[$symbol$context]($style) "
only_with_files = true

[kubernetes]
symbol = "☸ "
style = "blue"
format = '[$symbol$context( \($namespace\))]($style) '
disabled = true

[cmd_duration]
min_time = 2_000
style = "yellow"
format = "took [$duration]($style) "

[time]
disabled = true
format = '🕙[\[ $time \]]($style) '
```

## CLAUDE.md Integration

```markdown
## Dotfiles

### Installation
```bash
git clone https://github.com/username/dotfiles ~/.dotfiles
cd ~/.dotfiles
./install.sh
```

### Structure
- `shell/` - Shell configurations (.zshrc, .aliases)
- `git/` - Git configuration
- `config/` - Tool configurations
- `scripts/` - Setup scripts

### Quick Commands
- `reload` - Reload shell config
- `aliases` - Edit aliases
- `gitconfig` - Edit git config

### Customization
- Local overrides: `~/.localrc`
- OS-specific: Detected automatically
```

## AI Suggestions

1. **Config sync** - Sync across machines
2. **Secret management** - Handle sensitive data
3. **OS detection** - Platform-specific configs
4. **Version control** - Track config changes
5. **Backup/restore** - Automated backups
6. **Plugin management** - Auto-update plugins
7. **Profile switching** - Work/personal profiles
8. **Documentation** - Self-documenting configs
9. **Health checks** - Verify installations
10. **Migration tools** - Import from other systems
