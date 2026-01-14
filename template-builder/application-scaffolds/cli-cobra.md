# Go CLI with Cobra

## Overview

Production-ready Go command-line interface using Cobra with Viper configuration, featuring subcommands, persistent flags, environment variable binding, shell completions, configuration management, colored output, and comprehensive testing with testify.

## Quick Start

```bash
# Create project
mkdir my-cli && cd my-cli
go mod init github.com/yourname/my-cli

# Install dependencies
go get github.com/spf13/cobra@latest
go get github.com/spf13/viper@latest
go get github.com/fatih/color@latest
go get github.com/briandowns/spinner@latest
go get github.com/AlecAivazis/survey/v2@latest
go get github.com/olekukonko/tablewriter@latest
go get github.com/schollz/progressbar/v3@latest

# Install cobra-cli for scaffolding
go install github.com/spf13/cobra-cli@latest

# Generate root command
cobra-cli init

# Generate subcommand
cobra-cli add init

# Build and run
go build -o my-cli .
./my-cli --help
```

## Project Structure

```
my-cli/
├── cmd/
│   ├── root.go                  # Root command
│   ├── init.go                  # Init command
│   ├── config.go                # Config command group
│   ├── config_get.go            # Config get subcommand
│   ├── config_set.go            # Config set subcommand
│   ├── generate.go              # Generate command
│   └── version.go               # Version command
├── internal/
│   ├── config/
│   │   └── config.go            # Configuration manager
│   ├── generator/
│   │   └── generator.go         # Code generator
│   ├── ui/
│   │   ├── prompt.go            # Interactive prompts
│   │   ├── spinner.go           # Progress spinner
│   │   └── table.go             # Table output
│   └── utils/
│       ├── fs.go                # File system utilities
│       └── validation.go        # Input validation
├── templates/
│   └── default/
│       └── main.go.tmpl
├── pkg/
│   └── version/
│       └── version.go           # Version info
├── main.go
├── go.mod
├── go.sum
├── Makefile
├── goreleaser.yaml
└── CLAUDE.md
```

## Configuration Files

### go.mod

```go
module github.com/yourname/my-cli

go 1.22

require (
    github.com/AlecAivazis/survey/v2 v2.3.7
    github.com/briandowns/spinner v1.23.0
    github.com/fatih/color v1.16.0
    github.com/olekukonko/tablewriter v0.0.5
    github.com/schollz/progressbar/v3 v3.14.2
    github.com/spf13/cobra v1.8.0
    github.com/spf13/viper v1.18.2
    github.com/stretchr/testify v1.9.0
)
```

### Makefile

```makefile
.PHONY: build test lint clean install release

BINARY_NAME=my-cli
VERSION=$(shell git describe --tags --always --dirty)
BUILD_TIME=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS=-ldflags "-X github.com/yourname/my-cli/pkg/version.Version=$(VERSION) -X github.com/yourname/my-cli/pkg/version.BuildTime=$(BUILD_TIME)"

build:
	go build $(LDFLAGS) -o $(BINARY_NAME) .

build-all:
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(BINARY_NAME)-linux-amd64 .
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o $(BINARY_NAME)-darwin-amd64 .
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o $(BINARY_NAME)-darwin-arm64 .
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o $(BINARY_NAME)-windows-amd64.exe .

test:
	go test -v -race -coverprofile=coverage.out ./...

test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

lint:
	golangci-lint run

clean:
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_NAME)-*
	rm -f coverage.out coverage.html

install:
	go install $(LDFLAGS) .

release:
	goreleaser release --clean

snapshot:
	goreleaser release --snapshot --clean
```

### goreleaser.yaml

```yaml
version: 1

project_name: my-cli

before:
  hooks:
    - go mod tidy
    - go generate ./...

builds:
  - id: my-cli
    main: .
    binary: my-cli
    env:
      - CGO_ENABLED=0
    goos:
      - linux
      - darwin
      - windows
    goarch:
      - amd64
      - arm64
    ldflags:
      - -s -w
      - -X github.com/yourname/my-cli/pkg/version.Version={{.Version}}
      - -X github.com/yourname/my-cli/pkg/version.BuildTime={{.Date}}

archives:
  - id: default
    format: tar.gz
    name_template: "{{ .ProjectName }}_{{ .Version }}_{{ .Os }}_{{ .Arch }}"
    format_overrides:
      - goos: windows
        format: zip
    files:
      - LICENSE
      - README.md

checksum:
  name_template: "checksums.txt"

changelog:
  sort: asc
  filters:
    exclude:
      - "^docs:"
      - "^test:"
      - "^chore:"

brews:
  - name: my-cli
    repository:
      owner: yourname
      name: homebrew-tap
    homepage: https://github.com/yourname/my-cli
    description: A production-ready CLI application
    license: MIT
    install: |
      bin.install "my-cli"
      bash_completion.install "completions/my-cli.bash" => "my-cli"
      zsh_completion.install "completions/my-cli.zsh" => "_my-cli"
      fish_completion.install "completions/my-cli.fish"

nfpms:
  - id: packages
    package_name: my-cli
    vendor: Your Name
    homepage: https://github.com/yourname/my-cli
    maintainer: Your Name <you@example.com>
    description: A production-ready CLI application
    license: MIT
    formats:
      - deb
      - rpm
    bindir: /usr/bin
```

## Core Implementation

### main.go

```go
package main

import (
    "github.com/yourname/my-cli/cmd"
)

func main() {
    cmd.Execute()
}
```

### cmd/root.go

```go
package cmd

import (
    "fmt"
    "os"
    "path/filepath"

    "github.com/fatih/color"
    "github.com/spf13/cobra"
    "github.com/spf13/viper"

    "github.com/yourname/my-cli/internal/config"
)

var (
    cfgFile string
    verbose bool
    quiet   bool
    format  string
)

var rootCmd = &cobra.Command{
    Use:   "my-cli",
    Short: "A production-ready CLI application",
    Long: `my-cli is a powerful command-line tool for project scaffolding,
code generation, and development workflows.

Complete documentation is available at https://github.com/yourname/my-cli`,
    PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
        return initConfig()
    },
    SilenceUsage:  true,
    SilenceErrors: true,
}

func Execute() {
    if err := rootCmd.Execute(); err != nil {
        color.Red("Error: %v", err)
        os.Exit(1)
    }
}

func init() {
    // Global flags
    rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.my-cli.yaml)")
    rootCmd.PersistentFlags().BoolVarP(&verbose, "verbose", "v", false, "verbose output")
    rootCmd.PersistentFlags().BoolVarP(&quiet, "quiet", "q", false, "suppress output")
    rootCmd.PersistentFlags().StringVar(&format, "format", "text", "output format (text, json, yaml)")

    // Bind flags to viper
    viper.BindPFlag("verbose", rootCmd.PersistentFlags().Lookup("verbose"))
    viper.BindPFlag("quiet", rootCmd.PersistentFlags().Lookup("quiet"))
    viper.BindPFlag("format", rootCmd.PersistentFlags().Lookup("format"))

    // Add commands
    rootCmd.AddCommand(versionCmd)
    rootCmd.AddCommand(initCmd)
    rootCmd.AddCommand(configCmd)
    rootCmd.AddCommand(generateCmd)

    // Completion command
    rootCmd.AddCommand(&cobra.Command{
        Use:   "completion [bash|zsh|fish|powershell]",
        Short: "Generate shell completion scripts",
        Long: `To load completions:

Bash:
  $ source <(my-cli completion bash)
  # To load completions for each session, execute once:
  # Linux:
  $ my-cli completion bash > /etc/bash_completion.d/my-cli
  # macOS:
  $ my-cli completion bash > $(brew --prefix)/etc/bash_completion.d/my-cli

Zsh:
  $ my-cli completion zsh > "${fpath[1]}/_my-cli"

Fish:
  $ my-cli completion fish | source
  $ my-cli completion fish > ~/.config/fish/completions/my-cli.fish

PowerShell:
  PS> my-cli completion powershell | Out-String | Invoke-Expression
`,
        DisableFlagsInUseLine: true,
        ValidArgs:             []string{"bash", "zsh", "fish", "powershell"},
        Args:                  cobra.MatchAll(cobra.ExactArgs(1), cobra.OnlyValidArgs),
        RunE: func(cmd *cobra.Command, args []string) error {
            switch args[0] {
            case "bash":
                return rootCmd.GenBashCompletion(os.Stdout)
            case "zsh":
                return rootCmd.GenZshCompletion(os.Stdout)
            case "fish":
                return rootCmd.GenFishCompletion(os.Stdout, true)
            case "powershell":
                return rootCmd.GenPowerShellCompletionWithDesc(os.Stdout)
            }
            return nil
        },
    })
}

func initConfig() error {
    if cfgFile != "" {
        viper.SetConfigFile(cfgFile)
    } else {
        home, err := os.UserHomeDir()
        if err != nil {
            return err
        }

        // Search config in home directory
        viper.AddConfigPath(home)
        viper.AddConfigPath(filepath.Join(home, ".config", "my-cli"))
        viper.AddConfigPath(".")
        viper.SetConfigName(".my-cli")
        viper.SetConfigType("yaml")
    }

    // Environment variables
    viper.SetEnvPrefix("MY_CLI")
    viper.AutomaticEnv()

    // Read config
    if err := viper.ReadInConfig(); err != nil {
        if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
            return err
        }
    }

    if verbose {
        if viper.ConfigFileUsed() != "" {
            fmt.Fprintf(os.Stderr, "Using config file: %s\n", viper.ConfigFileUsed())
        }
    }

    return nil
}
```

### cmd/init.go

```go
package cmd

import (
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "time"

    "github.com/AlecAivazis/survey/v2"
    "github.com/briandowns/spinner"
    "github.com/fatih/color"
    "github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
    Use:   "init [name]",
    Short: "Initialize a new project",
    Long:  `Initialize a new project with the specified template and options.`,
    Args:  cobra.MaximumNArgs(1),
    RunE:  runInit,
    Example: `  my-cli init my-project
  my-cli init my-project --template api
  my-cli init my-project --no-git`,
}

var (
    template   string
    noGit      bool
    noInstall  bool
    force      bool
    pkgManager string
)

func init() {
    initCmd.Flags().StringVarP(&template, "template", "t", "default", "template to use")
    initCmd.Flags().BoolVar(&noGit, "no-git", false, "skip git initialization")
    initCmd.Flags().BoolVar(&noInstall, "no-install", false, "skip dependency installation")
    initCmd.Flags().BoolVarP(&force, "force", "f", false, "overwrite existing directory")
    initCmd.Flags().StringVarP(&pkgManager, "package-manager", "p", "npm", "package manager (npm, yarn, pnpm, bun)")
}

func runInit(cmd *cobra.Command, args []string) error {
    var projectName string

    // Interactive mode if name not provided
    if len(args) == 0 {
        answers := struct {
            Name       string
            Template   string
            PkgManager string
            Git        bool
            Install    bool
        }{}

        questions := []*survey.Question{
            {
                Name: "name",
                Prompt: &survey.Input{
                    Message: "Project name:",
                    Default: "my-project",
                },
                Validate: survey.Required,
            },
            {
                Name: "template",
                Prompt: &survey.Select{
                    Message: "Template:",
                    Options: []string{"default", "api", "library", "fullstack"},
                    Default: "default",
                },
            },
            {
                Name: "pkgManager",
                Prompt: &survey.Select{
                    Message: "Package manager:",
                    Options: []string{"npm", "yarn", "pnpm", "bun"},
                    Default: "npm",
                },
            },
            {
                Name: "git",
                Prompt: &survey.Confirm{
                    Message: "Initialize git repository?",
                    Default: true,
                },
            },
            {
                Name: "install",
                Prompt: &survey.Confirm{
                    Message: "Install dependencies?",
                    Default: true,
                },
            },
        }

        if err := survey.Ask(questions, &answers); err != nil {
            return err
        }

        projectName = answers.Name
        template = answers.Template
        pkgManager = answers.PkgManager
        noGit = !answers.Git
        noInstall = !answers.Install
    } else {
        projectName = args[0]
    }

    projectPath, err := filepath.Abs(projectName)
    if err != nil {
        return err
    }

    // Check if directory exists
    if _, err := os.Stat(projectPath); err == nil {
        if !force {
            var overwrite bool
            prompt := &survey.Confirm{
                Message: fmt.Sprintf("Directory %s already exists. Overwrite?", projectName),
                Default: false,
            }
            if err := survey.AskOne(prompt, &overwrite); err != nil {
                return err
            }
            if !overwrite {
                color.Yellow("Operation cancelled")
                return nil
            }
        }
        if err := os.RemoveAll(projectPath); err != nil {
            return err
        }
    }

    // Create spinner
    s := spinner.New(spinner.CharSets[11], 100*time.Millisecond)
    s.Color("cyan")

    // Create project structure
    s.Suffix = " Creating project structure..."
    s.Start()
    if err := createProjectStructure(projectPath, projectName, template); err != nil {
        s.Stop()
        return err
    }
    s.Stop()
    color.Green("✔ Created project structure")

    // Initialize git
    if !noGit {
        s.Suffix = " Initializing git repository..."
        s.Start()
        if err := initGit(projectPath); err != nil {
            s.Stop()
            color.Yellow("⚠ Failed to initialize git: %v", err)
        } else {
            s.Stop()
            color.Green("✔ Initialized git repository")
        }
    }

    // Install dependencies
    if !noInstall {
        s.Suffix = " Installing dependencies..."
        s.Start()
        if err := installDeps(projectPath, pkgManager); err != nil {
            s.Stop()
            color.Yellow("⚠ Failed to install dependencies: %v", err)
        } else {
            s.Stop()
            color.Green("✔ Installed dependencies")
        }
    }

    // Print success message
    fmt.Println()
    color.Green("✨ Project %s created successfully!", projectName)
    fmt.Println()
    color.White("Next steps:")
    fmt.Printf("  cd %s\n", projectName)
    if noInstall {
        fmt.Printf("  %s install\n", pkgManager)
    }
    fmt.Printf("  %s run dev\n", pkgManager)

    return nil
}

func createProjectStructure(path, name, tmpl string) error {
    dirs := []string{
        "src",
        "tests",
    }

    for _, dir := range dirs {
        if err := os.MkdirAll(filepath.Join(path, dir), 0755); err != nil {
            return err
        }
    }

    // Create package.json
    pkgJSON := fmt.Sprintf(`{
  "name": "%s",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
`, name)

    if err := os.WriteFile(filepath.Join(path, "package.json"), []byte(pkgJSON), 0644); err != nil {
        return err
    }

    // Create main file
    mainTS := `console.log("Hello, World!");
`
    if err := os.WriteFile(filepath.Join(path, "src", "index.ts"), []byte(mainTS), 0644); err != nil {
        return err
    }

    // Create tsconfig.json
    tsConfig := `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
`
    if err := os.WriteFile(filepath.Join(path, "tsconfig.json"), []byte(tsConfig), 0644); err != nil {
        return err
    }

    return nil
}

func initGit(path string) error {
    commands := [][]string{
        {"git", "init"},
        {"git", "add", "."},
        {"git", "commit", "-m", "Initial commit"},
    }

    for _, args := range commands {
        cmd := exec.Command(args[0], args[1:]...)
        cmd.Dir = path
        if err := cmd.Run(); err != nil {
            return err
        }
    }

    return nil
}

func installDeps(path, pm string) error {
    var cmd *exec.Cmd

    switch pm {
    case "yarn":
        cmd = exec.Command("yarn")
    case "pnpm":
        cmd = exec.Command("pnpm", "install")
    case "bun":
        cmd = exec.Command("bun", "install")
    default:
        cmd = exec.Command("npm", "install")
    }

    cmd.Dir = path
    return cmd.Run()
}
```

### cmd/config.go

```go
package cmd

import (
    "fmt"
    "os"
    "path/filepath"

    "github.com/fatih/color"
    "github.com/olekukonko/tablewriter"
    "github.com/spf13/cobra"
    "github.com/spf13/viper"
)

var configCmd = &cobra.Command{
    Use:   "config",
    Short: "Manage CLI configuration",
    Long:  `View and modify CLI configuration settings.`,
}

var configGetCmd = &cobra.Command{
    Use:   "get [key]",
    Short: "Get configuration value(s)",
    Args:  cobra.MaximumNArgs(1),
    RunE:  runConfigGet,
}

var configSetCmd = &cobra.Command{
    Use:   "set <key> <value>",
    Short: "Set configuration value",
    Args:  cobra.ExactArgs(2),
    RunE:  runConfigSet,
}

var configListCmd = &cobra.Command{
    Use:     "list",
    Aliases: []string{"ls"},
    Short:   "List all configuration",
    RunE:    runConfigList,
}

var configPathCmd = &cobra.Command{
    Use:   "path",
    Short: "Show configuration file path",
    Run: func(cmd *cobra.Command, args []string) {
        home, _ := os.UserHomeDir()
        configPath := filepath.Join(home, ".my-cli.yaml")
        fmt.Println(configPath)
    },
}

func init() {
    configCmd.AddCommand(configGetCmd)
    configCmd.AddCommand(configSetCmd)
    configCmd.AddCommand(configListCmd)
    configCmd.AddCommand(configPathCmd)
}

func runConfigGet(cmd *cobra.Command, args []string) error {
    if len(args) == 0 {
        return runConfigList(cmd, args)
    }

    key := args[0]
    value := viper.Get(key)

    if value == nil {
        color.Yellow("Configuration key '%s' not found", key)
        return nil
    }

    fmt.Printf("%v\n", value)
    return nil
}

func runConfigSet(cmd *cobra.Command, args []string) error {
    key := args[0]
    value := args[1]

    viper.Set(key, value)

    home, err := os.UserHomeDir()
    if err != nil {
        return err
    }

    configPath := filepath.Join(home, ".my-cli.yaml")

    if err := viper.WriteConfigAs(configPath); err != nil {
        return err
    }

    color.Green("✔ Set %s = %s", key, value)
    return nil
}

func runConfigList(cmd *cobra.Command, args []string) error {
    settings := viper.AllSettings()

    if len(settings) == 0 {
        color.Yellow("No configuration found")
        return nil
    }

    table := tablewriter.NewWriter(os.Stdout)
    table.SetHeader([]string{"Key", "Value"})
    table.SetBorder(false)
    table.SetHeaderColor(
        tablewriter.Colors{tablewriter.FgCyanColor},
        tablewriter.Colors{tablewriter.FgCyanColor},
    )

    for key, value := range settings {
        table.Append([]string{key, fmt.Sprintf("%v", value)})
    }

    table.Render()
    return nil
}
```

### cmd/generate.go

```go
package cmd

import (
    "fmt"
    "os"
    "path/filepath"
    "strings"
    "text/template"

    "github.com/AlecAivazis/survey/v2"
    "github.com/fatih/color"
    "github.com/spf13/cobra"
)

var generateCmd = &cobra.Command{
    Use:     "generate <type>",
    Aliases: []string{"g", "gen"},
    Short:   "Generate code from templates",
    Long:    `Generate code files from templates including components, models, and services.`,
    ValidArgs: []string{"component", "model", "service", "hook"},
    Args:   cobra.ExactArgs(1),
    RunE:   runGenerate,
}

var (
    genName   string
    genOutput string
    genDryRun bool
)

func init() {
    generateCmd.Flags().StringVarP(&genName, "name", "n", "", "name of the generated item")
    generateCmd.Flags().StringVarP(&genOutput, "output", "o", ".", "output directory")
    generateCmd.Flags().BoolVar(&genDryRun, "dry-run", false, "show what would be generated")
}

func runGenerate(cmd *cobra.Command, args []string) error {
    genType := args[0]

    // Get name if not provided
    if genName == "" {
        prompt := &survey.Input{
            Message: fmt.Sprintf("%s name:", strings.Title(genType)),
        }
        if err := survey.AskOne(prompt, &genName, survey.WithValidator(survey.Required)); err != nil {
            return err
        }
    }

    if genDryRun {
        color.White("\nDry Run - Would generate:")
        fmt.Printf("  Type: %s\n", genType)
        fmt.Printf("  Name: %s\n", genName)
        fmt.Printf("  Output: %s\n", genOutput)
        return nil
    }

    switch genType {
    case "component":
        return generateComponent(genName, genOutput)
    case "model":
        return generateModel(genName, genOutput)
    case "service":
        return generateService(genName, genOutput)
    case "hook":
        return generateHook(genName, genOutput)
    default:
        return fmt.Errorf("unknown generator type: %s", genType)
    }
}

func generateComponent(name, output string) error {
    tmpl := `import React from 'react';

export interface {{.Name}}Props {
  children?: React.ReactNode;
}

export const {{.Name}}: React.FC<{{.Name}}Props> = ({ children }) => {
  return (
    <div className="{{.KebabName}}">
      {children}
    </div>
  );
};
`

    return generateFile(name, output, tmpl, ".tsx")
}

func generateModel(name, output string) error {
    tmpl := `export interface {{.Name}} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export function create{{.Name}}(data: Partial<{{.Name}}>): {{.Name}} {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  };
}
`

    return generateFile(name, output, tmpl, ".ts")
}

func generateService(name, output string) error {
    tmpl := `export class {{.Name}}Service {
  async findAll() {
    // Implementation
  }

  async findById(id: string) {
    // Implementation
  }

  async create(data: unknown) {
    // Implementation
  }

  async update(id: string, data: unknown) {
    // Implementation
  }

  async delete(id: string) {
    // Implementation
  }
}

export const {{.CamelName}}Service = new {{.Name}}Service();
`

    return generateFile(name, output, tmpl, ".service.ts")
}

func generateHook(name, output string) error {
    tmpl := `import { useState, useCallback } from 'react';

export function use{{.Name}}() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Implementation
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { state, loading, error, execute };
}
`

    return generateFile(name, output, tmpl, ".ts")
}

func generateFile(name, output, tmplStr, ext string) error {
    data := struct {
        Name      string
        CamelName string
        KebabName string
        SnakeName string
    }{
        Name:      name,
        CamelName: toCamelCase(name),
        KebabName: toKebabCase(name),
        SnakeName: toSnakeCase(name),
    }

    tmpl, err := template.New("").Parse(tmplStr)
    if err != nil {
        return err
    }

    // Create output directory
    if err := os.MkdirAll(output, 0755); err != nil {
        return err
    }

    filename := toCamelCase(name) + ext
    if ext == ".tsx" || ext == ".ts" && !strings.HasSuffix(ext, ".service.ts") {
        filename = name + ext
    }

    filePath := filepath.Join(output, filename)

    file, err := os.Create(filePath)
    if err != nil {
        return err
    }
    defer file.Close()

    if err := tmpl.Execute(file, data); err != nil {
        return err
    }

    color.Green("✔ Generated %s", filePath)
    return nil
}

func toCamelCase(s string) string {
    if len(s) == 0 {
        return s
    }
    return strings.ToLower(s[:1]) + s[1:]
}

func toKebabCase(s string) string {
    var result strings.Builder
    for i, r := range s {
        if i > 0 && r >= 'A' && r <= 'Z' {
            result.WriteRune('-')
        }
        result.WriteRune(r)
    }
    return strings.ToLower(result.String())
}

func toSnakeCase(s string) string {
    return strings.ReplaceAll(toKebabCase(s), "-", "_")
}
```

### cmd/version.go

```go
package cmd

import (
    "fmt"
    "runtime"

    "github.com/fatih/color"
    "github.com/spf13/cobra"

    "github.com/yourname/my-cli/pkg/version"
)

var versionCmd = &cobra.Command{
    Use:   "version",
    Short: "Print version information",
    Run: func(cmd *cobra.Command, args []string) {
        fmt.Printf("%s version %s\n", color.CyanString("my-cli"), color.GreenString(version.Version))
        fmt.Printf("  Build time: %s\n", version.BuildTime)
        fmt.Printf("  Go version: %s\n", runtime.Version())
        fmt.Printf("  OS/Arch:    %s/%s\n", runtime.GOOS, runtime.GOARCH)
    },
}
```

### pkg/version/version.go

```go
package version

var (
    // Version is set at build time
    Version = "dev"
    // BuildTime is set at build time
    BuildTime = "unknown"
)
```

### internal/ui/spinner.go

```go
package ui

import (
    "time"

    "github.com/briandowns/spinner"
)

type Spinner struct {
    s *spinner.Spinner
}

func NewSpinner(suffix string) *Spinner {
    s := spinner.New(spinner.CharSets[11], 100*time.Millisecond)
    s.Suffix = " " + suffix
    s.Color("cyan")
    return &Spinner{s: s}
}

func (sp *Spinner) Start() {
    sp.s.Start()
}

func (sp *Spinner) Stop() {
    sp.s.Stop()
}

func (sp *Spinner) UpdateSuffix(suffix string) {
    sp.s.Suffix = " " + suffix
}
```

### internal/ui/table.go

```go
package ui

import (
    "io"
    "os"

    "github.com/olekukonko/tablewriter"
)

type Table struct {
    table *tablewriter.Table
}

func NewTable(headers []string) *Table {
    return NewTableWithWriter(os.Stdout, headers)
}

func NewTableWithWriter(w io.Writer, headers []string) *Table {
    table := tablewriter.NewWriter(w)
    table.SetHeader(headers)
    table.SetBorder(false)
    table.SetAutoWrapText(false)
    table.SetHeaderAlignment(tablewriter.ALIGN_LEFT)
    table.SetAlignment(tablewriter.ALIGN_LEFT)

    return &Table{table: table}
}

func (t *Table) AddRow(row []string) {
    t.table.Append(row)
}

func (t *Table) AddRows(rows [][]string) {
    for _, row := range rows {
        t.table.Append(row)
    }
}

func (t *Table) Render() {
    t.table.Render()
}

func (t *Table) SetColWidth(col int, width int) {
    t.table.SetColMinWidth(col, width)
}
```

## Testing

### cmd/init_test.go

```go
package cmd

import (
    "os"
    "path/filepath"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
)

func TestCreateProjectStructure(t *testing.T) {
    tmpDir, err := os.MkdirTemp("", "test-project-*")
    require.NoError(t, err)
    defer os.RemoveAll(tmpDir)

    projectPath := filepath.Join(tmpDir, "test-project")

    err = createProjectStructure(projectPath, "test-project", "default")
    require.NoError(t, err)

    // Check directory structure
    assert.DirExists(t, filepath.Join(projectPath, "src"))
    assert.DirExists(t, filepath.Join(projectPath, "tests"))

    // Check files
    assert.FileExists(t, filepath.Join(projectPath, "package.json"))
    assert.FileExists(t, filepath.Join(projectPath, "tsconfig.json"))
    assert.FileExists(t, filepath.Join(projectPath, "src", "index.ts"))
}

func TestToCamelCase(t *testing.T) {
    tests := []struct {
        input    string
        expected string
    }{
        {"Button", "button"},
        {"UserProfile", "userProfile"},
        {"API", "aPI"},
    }

    for _, tt := range tests {
        t.Run(tt.input, func(t *testing.T) {
            result := toCamelCase(tt.input)
            assert.Equal(t, tt.expected, result)
        })
    }
}

func TestToKebabCase(t *testing.T) {
    tests := []struct {
        input    string
        expected string
    }{
        {"Button", "button"},
        {"UserProfile", "user-profile"},
        {"APIService", "a-p-i-service"},
    }

    for _, tt := range tests {
        t.Run(tt.input, func(t *testing.T) {
            result := toKebabCase(tt.input)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

### cmd/root_test.go

```go
package cmd

import (
    "bytes"
    "testing"

    "github.com/stretchr/testify/assert"
)

func TestRootCommand(t *testing.T) {
    buf := new(bytes.Buffer)
    rootCmd.SetOut(buf)
    rootCmd.SetErr(buf)
    rootCmd.SetArgs([]string{"--help"})

    err := rootCmd.Execute()
    assert.NoError(t, err)
    assert.Contains(t, buf.String(), "my-cli")
}

func TestVersionCommand(t *testing.T) {
    buf := new(bytes.Buffer)
    rootCmd.SetOut(buf)
    rootCmd.SetErr(buf)
    rootCmd.SetArgs([]string{"version"})

    err := rootCmd.Execute()
    assert.NoError(t, err)
    assert.Contains(t, buf.String(), "version")
}
```

## CLAUDE.md Integration

```markdown
# Go CLI Project

## Commands
- `make build` - Build binary
- `make test` - Run tests
- `make lint` - Run linter
- `./my-cli --help` - Show help

## Architecture
- Cobra for CLI framework
- Viper for configuration
- Commands in cmd/
- Internal packages in internal/

## Adding Commands
1. Create cmd/yourcommand.go
2. Create cobra.Command variable
3. Add to rootCmd in init()

## Configuration
- Global: ~/.my-cli.yaml
- Local: .my-cli.yaml
- Environment: MY_CLI_* prefix

## Testing
Run `go test ./...`
Use testify for assertions
```

## AI Suggestions

1. **Shell Completions Distribution** - Package completion scripts with releases for brew, apt, rpm
2. **Config Migration** - Add automatic config migration when schema changes between versions
3. **Plugin System** - Implement Go plugin loading for third-party command extensions
4. **Update Command** - Add self-update using go-github-selfupdate
5. **Structured Logging** - Add zerolog/zap with JSON output for CI environments
6. **Telemetry Opt-in** - Implement anonymous usage telemetry with PostHog
7. **Command Aliases** - Support user-defined command aliases via configuration
8. **Interactive Mode** - Add REPL mode using go-prompt for continuous interaction
9. **Parallel Execution** - Use errgroup for parallel task execution with progress
10. **Profile Support** - Add config profiles for different environments (dev, staging, prod)
