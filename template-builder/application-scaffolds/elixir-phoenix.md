# Elixir Phoenix API Template

## Overview
Highly concurrent, fault-tolerant REST API using Elixir with Phoenix Framework, featuring Ecto ORM, Guardian JWT authentication, and real-time capabilities via Phoenix Channels.

## Quick Start
```bash
# Install Phoenix
mix archive.install hex phx_new

# Create project
mix phx.new my_phoenix_api --no-html --no-assets --binary-id
cd my_phoenix_api

# Setup database
mix ecto.create
mix ecto.migrate

# Start server
mix phx.server
```

## Project Structure
```
my_phoenix_api/
├── config/
│   ├── config.exs
│   ├── dev.exs
│   ├── prod.exs
│   ├── runtime.exs
│   └── test.exs
├── lib/
│   ├── my_phoenix_api/
│   │   ├── application.ex
│   │   ├── repo.ex
│   │   ├── accounts/
│   │   │   ├── accounts.ex
│   │   │   ├── user.ex
│   │   │   └── user_token.ex
│   │   ├── items/
│   │   │   ├── items.ex
│   │   │   └── item.ex
│   │   └── guardian.ex
│   └── my_phoenix_api_web/
│       ├── endpoint.ex
│       ├── router.ex
│       ├── telemetry.ex
│       ├── controllers/
│       │   ├── auth_controller.ex
│       │   ├── user_controller.ex
│       │   ├── item_controller.ex
│       │   ├── health_controller.ex
│       │   └── fallback_controller.ex
│       ├── plugs/
│       │   ├── auth_pipeline.ex
│       │   └── rate_limiter.ex
│       └── channels/
│           ├── user_socket.ex
│           └── item_channel.ex
├── priv/
│   └── repo/
│       └── migrations/
├── test/
│   ├── support/
│   └── my_phoenix_api_web/
├── mix.exs
├── mix.lock
├── Dockerfile
└── docker-compose.yml
```

## Configuration

### mix.exs
```elixir
defmodule MyPhoenixApi.MixProject do
  use Mix.Project

  def project do
    [
      app: :my_phoenix_api,
      version: "0.1.0",
      elixir: "~> 1.16",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {MyPhoenixApi.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.7.10"},
      {:phoenix_ecto, "~> 4.4"},
      {:ecto_sql, "~> 3.11"},
      {:postgrex, ">= 0.0.0"},
      {:phoenix_live_dashboard, "~> 0.8.2"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.6"},
      {:guardian, "~> 2.3"},
      {:bcrypt_elixir, "~> 3.1"},
      {:cors_plug, "~> 3.0"},
      {:hammer, "~> 6.1"},
      {:open_api_spex, "~> 3.18"},
      {:ex_machina, "~> 2.7", only: :test}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"]
    ]
  end
end
```

### config/config.exs
```elixir
import Config

config :my_phoenix_api,
  ecto_repos: [MyPhoenixApi.Repo],
  generators: [binary_id: true]

config :my_phoenix_api, MyPhoenixApiWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Phoenix.Endpoint.Cowboy2Adapter,
  render_errors: [
    formats: [json: MyPhoenixApiWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: MyPhoenixApi.PubSub,
  live_view: [signing_salt: "your_signing_salt"]

config :my_phoenix_api, MyPhoenixApi.Guardian,
  issuer: "my_phoenix_api",
  secret_key: System.get_env("GUARDIAN_SECRET_KEY") || "change_me_in_production"

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

import_config "#{config_env()}.exs"
```

### config/runtime.exs
```elixir
import Config

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :my_phoenix_api, MyPhoenixApi.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: maybe_ipv6

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "example.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :my_phoenix_api, MyPhoenixApiWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [
      ip: {0, 0, 0, 0, 0, 0, 0, 0},
      port: port
    ],
    secret_key_base: secret_key_base

  config :my_phoenix_api, MyPhoenixApi.Guardian,
    secret_key: System.get_env("GUARDIAN_SECRET_KEY") || secret_key_base
end
```

## Core Implementation

### lib/my_phoenix_api/application.ex
```elixir
defmodule MyPhoenixApi.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      MyPhoenixApiWeb.Telemetry,
      MyPhoenixApi.Repo,
      {Phoenix.PubSub, name: MyPhoenixApi.PubSub},
      MyPhoenixApiWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: MyPhoenixApi.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    MyPhoenixApiWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
```

### lib/my_phoenix_api/accounts/user.ex
```elixir
defmodule MyPhoenixApi.Accounts.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @roles ~w(user admin)

  schema "users" do
    field :email, :string
    field :password, :string, virtual: true, redact: true
    field :password_hash, :string, redact: true
    field :name, :string
    field :role, :string, default: "user"
    field :is_active, :boolean, default: true

    has_many :items, MyPhoenixApi.Items.Item

    timestamps(type: :utc_datetime)
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :name, :role, :is_active])
    |> validate_required([:email, :name])
    |> validate_email()
    |> validate_inclusion(:role, @roles)
  end

  def registration_changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :password, :name])
    |> validate_required([:email, :password, :name])
    |> validate_email()
    |> validate_password()
    |> hash_password()
  end

  def password_changeset(user, attrs) do
    user
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> validate_password()
    |> hash_password()
  end

  defp validate_email(changeset) do
    changeset
    |> validate_required([:email])
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+$/, message: "must have the @ sign and no spaces")
    |> validate_length(:email, max: 160)
    |> unsafe_validate_unique(:email, MyPhoenixApi.Repo)
    |> unique_constraint(:email)
  end

  defp validate_password(changeset) do
    changeset
    |> validate_required([:password])
    |> validate_length(:password, min: 8, max: 72)
  end

  defp hash_password(changeset) do
    case changeset do
      %Ecto.Changeset{valid?: true, changes: %{password: password}} ->
        put_change(changeset, :password_hash, Bcrypt.hash_pwd_salt(password))

      _ ->
        changeset
    end
  end

  def verify_password(%__MODULE__{password_hash: hash}, password) when is_binary(password) do
    Bcrypt.verify_pass(password, hash)
  end

  def verify_password(_, _), do: Bcrypt.no_user_verify()

  def admin?(%__MODULE__{role: "admin"}), do: true
  def admin?(_), do: false
end
```

### lib/my_phoenix_api/accounts/accounts.ex
```elixir
defmodule MyPhoenixApi.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias MyPhoenixApi.Repo
  alias MyPhoenixApi.Accounts.User

  def list_users(params \\ %{}) do
    page = Map.get(params, "page", 1)
    per_page = Map.get(params, "per_page", 20) |> min(100)
    offset = (page - 1) * per_page

    query = from(u in User, order_by: [desc: u.inserted_at])

    total = Repo.aggregate(query, :count)
    users = query |> limit(^per_page) |> offset(^offset) |> Repo.all()

    %{
      users: users,
      total: total,
      page: page,
      per_page: per_page,
      total_pages: ceil(total / per_page)
    }
  end

  def get_user!(id), do: Repo.get!(User, id)

  def get_user(id), do: Repo.get(User, id)

  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  def create_user(attrs \\ %{}) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  def update_user_password(%User{} = user, attrs) do
    user
    |> User.password_changeset(attrs)
    |> Repo.update()
  end

  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  def authenticate_user(email, password) do
    user = get_user_by_email(email)

    cond do
      user && user.is_active && User.verify_password(user, password) ->
        {:ok, user}

      user ->
        {:error, :invalid_credentials}

      true ->
        Bcrypt.no_user_verify()
        {:error, :invalid_credentials}
    end
  end

  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end
end
```

### lib/my_phoenix_api/items/item.ex
```elixir
defmodule MyPhoenixApi.Items.Item do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  @statuses ~w(draft published archived)

  schema "items" do
    field :title, :string
    field :description, :string
    field :status, :string, default: "draft"
    field :price, :decimal, default: Decimal.new("0.00")
    field :metadata, :map, default: %{}
    field :deleted_at, :utc_datetime

    belongs_to :user, MyPhoenixApi.Accounts.User

    timestamps(type: :utc_datetime)
  end

  def changeset(item, attrs) do
    item
    |> cast(attrs, [:title, :description, :status, :price, :metadata])
    |> validate_required([:title])
    |> validate_length(:title, min: 1, max: 255)
    |> validate_inclusion(:status, @statuses)
    |> validate_number(:price, greater_than_or_equal_to: 0)
  end

  def create_changeset(item, attrs, user) do
    item
    |> changeset(attrs)
    |> put_assoc(:user, user)
  end

  def soft_delete_changeset(item) do
    change(item, deleted_at: DateTime.utc_now())
  end
end
```

### lib/my_phoenix_api/items/items.ex
```elixir
defmodule MyPhoenixApi.Items do
  @moduledoc """
  The Items context.
  """

  import Ecto.Query, warn: false
  alias MyPhoenixApi.Repo
  alias MyPhoenixApi.Items.Item

  def list_items(user_id, params \\ %{}) do
    page = Map.get(params, "page", 1) |> to_integer(1)
    per_page = Map.get(params, "per_page", 20) |> to_integer(20) |> min(100)
    offset = (page - 1) * per_page

    query =
      from(i in Item,
        where: i.user_id == ^user_id and is_nil(i.deleted_at),
        order_by: [desc: i.inserted_at]
      )

    query = apply_filters(query, params)

    total = Repo.aggregate(query, :count)
    items = query |> limit(^per_page) |> offset(^offset) |> Repo.all()

    %{
      items: items,
      total: total,
      page: page,
      per_page: per_page,
      total_pages: ceil(total / max(per_page, 1))
    }
  end

  defp apply_filters(query, params) do
    query
    |> filter_by_status(params)
    |> filter_by_price(params)
    |> filter_by_search(params)
    |> apply_sorting(params)
  end

  defp filter_by_status(query, %{"status" => status}) when status in ~w(draft published archived) do
    where(query, [i], i.status == ^status)
  end

  defp filter_by_status(query, _), do: query

  defp filter_by_price(query, params) do
    query
    |> maybe_filter_min_price(params)
    |> maybe_filter_max_price(params)
  end

  defp maybe_filter_min_price(query, %{"min_price" => min_price}) do
    where(query, [i], i.price >= ^Decimal.new(to_string(min_price)))
  end

  defp maybe_filter_min_price(query, _), do: query

  defp maybe_filter_max_price(query, %{"max_price" => max_price}) do
    where(query, [i], i.price <= ^Decimal.new(to_string(max_price)))
  end

  defp maybe_filter_max_price(query, _), do: query

  defp filter_by_search(query, %{"search" => search}) when is_binary(search) and search != "" do
    search_term = "%#{search}%"
    where(query, [i], ilike(i.title, ^search_term) or ilike(i.description, ^search_term))
  end

  defp filter_by_search(query, _), do: query

  defp apply_sorting(query, %{"sort_by" => field, "sort_dir" => dir}) do
    direction = if dir == "asc", do: :asc, else: :desc
    field_atom = String.to_existing_atom(field)

    if field_atom in [:title, :price, :status, :inserted_at, :updated_at] do
      order_by(query, [i], [{^direction, field(i, ^field_atom)}])
    else
      query
    end
  rescue
    ArgumentError -> query
  end

  defp apply_sorting(query, _), do: query

  defp to_integer(val, default) when is_binary(val) do
    case Integer.parse(val) do
      {int, _} -> int
      :error -> default
    end
  end

  defp to_integer(val, _) when is_integer(val), do: val
  defp to_integer(_, default), do: default

  def get_item!(id), do: Repo.get!(Item, id)

  def get_item(id), do: Repo.get(Item, id)

  def get_item_for_user!(id, user_id) do
    Repo.one!(
      from(i in Item,
        where: i.id == ^id and i.user_id == ^user_id and is_nil(i.deleted_at)
      )
    )
  end

  def get_item_for_user(id, user_id) do
    Repo.one(
      from(i in Item,
        where: i.id == ^id and i.user_id == ^user_id and is_nil(i.deleted_at)
      )
    )
  end

  def create_item(attrs, user) do
    %Item{}
    |> Item.create_changeset(attrs, user)
    |> Repo.insert()
  end

  def update_item(%Item{} = item, attrs) do
    item
    |> Item.changeset(attrs)
    |> Repo.update()
  end

  def delete_item(%Item{} = item) do
    item
    |> Item.soft_delete_changeset()
    |> Repo.update()
  end

  def publish_item(%Item{} = item) do
    update_item(item, %{status: "published"})
  end

  def archive_item(%Item{} = item) do
    update_item(item, %{status: "archived"})
  end

  def get_stats(user_id) do
    query = from(i in Item, where: i.user_id == ^user_id and is_nil(i.deleted_at))

    %{
      total: Repo.aggregate(query, :count),
      draft: Repo.aggregate(where(query, status: "draft"), :count),
      published: Repo.aggregate(where(query, status: "published"), :count),
      archived: Repo.aggregate(where(query, status: "archived"), :count)
    }
  end
end
```

### lib/my_phoenix_api/guardian.ex
```elixir
defmodule MyPhoenixApi.Guardian do
  use Guardian, otp_app: :my_phoenix_api

  alias MyPhoenixApi.Accounts

  def subject_for_token(%{id: id}, _claims) do
    {:ok, to_string(id)}
  end

  def subject_for_token(_, _) do
    {:error, :no_resource_id}
  end

  def resource_from_claims(%{"sub" => id}) do
    case Accounts.get_user(id) do
      nil -> {:error, :resource_not_found}
      user -> {:ok, user}
    end
  end

  def resource_from_claims(_claims) do
    {:error, :no_claims_sub}
  end

  def after_encode_and_sign(resource, claims, token, _options) do
    with {:ok, _} <- Guardian.DB.after_encode_and_sign(resource, claims["typ"], claims, token) do
      {:ok, token}
    end
  end

  def on_verify(claims, token, _options) do
    with {:ok, _} <- Guardian.DB.on_verify(claims, token) do
      {:ok, claims}
    end
  end

  def on_revoke(claims, token, _options) do
    with {:ok, _} <- Guardian.DB.on_revoke(claims, token) do
      {:ok, claims}
    end
  end
end
```

### lib/my_phoenix_api_web/router.ex
```elixir
defmodule MyPhoenixApiWeb.Router do
  use MyPhoenixApiWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
    plug MyPhoenixApiWeb.Plugs.RateLimiter
  end

  pipeline :authenticated do
    plug MyPhoenixApiWeb.Plugs.AuthPipeline
  end

  pipeline :admin do
    plug MyPhoenixApiWeb.Plugs.EnsureAdmin
  end

  # Health routes
  scope "/health", MyPhoenixApiWeb do
    pipe_through :api

    get "/", HealthController, :check
    get "/ready", HealthController, :ready
    get "/live", HealthController, :live
  end

  # API routes
  scope "/api/v1", MyPhoenixApiWeb do
    pipe_through :api

    # Auth routes (public)
    post "/auth/register", AuthController, :register
    post "/auth/login", AuthController, :login
    post "/auth/refresh", AuthController, :refresh
  end

  scope "/api/v1", MyPhoenixApiWeb do
    pipe_through [:api, :authenticated]

    # Auth routes (authenticated)
    post "/auth/logout", AuthController, :logout

    # User routes
    get "/users/me", UserController, :show
    put "/users/me", UserController, :update
    delete "/users/me", UserController, :delete
    put "/users/me/password", UserController, :change_password

    # Item routes
    resources "/items", ItemController, except: [:new, :edit]
    post "/items/:id/publish", ItemController, :publish
    post "/items/:id/archive", ItemController, :archive
    get "/items-stats", ItemController, :stats
  end

  # Admin routes
  scope "/api/v1/admin", MyPhoenixApiWeb do
    pipe_through [:api, :authenticated, :admin]

    resources "/users", UserController, only: [:index, :show, :update, :delete]
  end

  # Enable LiveDashboard in development
  if Application.compile_env(:my_phoenix_api, :dev_routes) do
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through [:fetch_session, :protect_from_forgery]
      live_dashboard "/dashboard", metrics: MyPhoenixApiWeb.Telemetry
    end
  end
end
```

### lib/my_phoenix_api_web/plugs/auth_pipeline.ex
```elixir
defmodule MyPhoenixApiWeb.Plugs.AuthPipeline do
  use Guardian.Plug.Pipeline,
    otp_app: :my_phoenix_api,
    module: MyPhoenixApi.Guardian,
    error_handler: MyPhoenixApiWeb.Plugs.AuthErrorHandler

  plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
  plug Guardian.Plug.EnsureAuthenticated
  plug Guardian.Plug.LoadResource, allow_blank: false
end

defmodule MyPhoenixApiWeb.Plugs.AuthErrorHandler do
  import Plug.Conn

  @behaviour Guardian.Plug.ErrorHandler

  @impl Guardian.Plug.ErrorHandler
  def auth_error(conn, {type, _reason}, _opts) do
    message =
      case type do
        :unauthenticated -> "Authentication required"
        :invalid_token -> "Invalid token"
        :token_expired -> "Token expired"
        _ -> "Authentication error"
      end

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(401, Jason.encode!(%{success: false, error: %{code: 401, message: message}}))
    |> halt()
  end
end

defmodule MyPhoenixApiWeb.Plugs.EnsureAdmin do
  import Plug.Conn
  alias MyPhoenixApi.Accounts.User

  def init(opts), do: opts

  def call(conn, _opts) do
    user = Guardian.Plug.current_resource(conn)

    if User.admin?(user) do
      conn
    else
      conn
      |> put_resp_content_type("application/json")
      |> send_resp(403, Jason.encode!(%{success: false, error: %{code: 403, message: "Admin access required"}}))
      |> halt()
    end
  end
end
```

### lib/my_phoenix_api_web/plugs/rate_limiter.ex
```elixir
defmodule MyPhoenixApiWeb.Plugs.RateLimiter do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    case check_rate_limit(conn) do
      {:ok, _count} ->
        conn

      {:error, _limit} ->
        conn
        |> put_resp_content_type("application/json")
        |> send_resp(429, Jason.encode!(%{success: false, error: %{code: 429, message: "Rate limit exceeded"}}))
        |> halt()
    end
  end

  defp check_rate_limit(conn) do
    ip = get_client_ip(conn)
    path = conn.request_path

    Hammer.check_rate("#{ip}:#{path}", 60_000, 100)
  end

  defp get_client_ip(conn) do
    forwarded_for = get_req_header(conn, "x-forwarded-for")

    case forwarded_for do
      [ip | _] -> ip
      [] -> conn.remote_ip |> :inet.ntoa() |> to_string()
    end
  end
end
```

### lib/my_phoenix_api_web/controllers/auth_controller.ex
```elixir
defmodule MyPhoenixApiWeb.AuthController do
  use MyPhoenixApiWeb, :controller

  alias MyPhoenixApi.Accounts
  alias MyPhoenixApi.Guardian

  action_fallback MyPhoenixApiWeb.FallbackController

  def register(conn, params) do
    with {:ok, user} <- Accounts.create_user(params),
         {:ok, access_token, _claims} <- Guardian.encode_and_sign(user, %{}, token_type: "access", ttl: {1, :hour}),
         {:ok, refresh_token, _claims} <- Guardian.encode_and_sign(user, %{}, token_type: "refresh", ttl: {7, :day}) do
      conn
      |> put_status(:created)
      |> render(:auth_response, user: user, access_token: access_token, refresh_token: refresh_token)
    end
  end

  def login(conn, %{"email" => email, "password" => password}) do
    with {:ok, user} <- Accounts.authenticate_user(email, password),
         {:ok, access_token, _claims} <- Guardian.encode_and_sign(user, %{}, token_type: "access", ttl: {1, :hour}),
         {:ok, refresh_token, _claims} <- Guardian.encode_and_sign(user, %{}, token_type: "refresh", ttl: {7, :day}) do
      render(conn, :auth_response, user: user, access_token: access_token, refresh_token: refresh_token)
    else
      {:error, :invalid_credentials} ->
        {:error, :unauthorized, "Invalid email or password"}
    end
  end

  def refresh(conn, %{"refresh_token" => refresh_token}) do
    with {:ok, _old_claims} <- Guardian.decode_and_verify(refresh_token, %{"typ" => "refresh"}),
         {:ok, user, _old_claims} <- Guardian.resource_from_token(refresh_token),
         {:ok, _old_stuff} <- Guardian.revoke(refresh_token),
         {:ok, access_token, _claims} <- Guardian.encode_and_sign(user, %{}, token_type: "access", ttl: {1, :hour}),
         {:ok, new_refresh_token, _claims} <- Guardian.encode_and_sign(user, %{}, token_type: "refresh", ttl: {7, :day}) do
      render(conn, :auth_response, user: user, access_token: access_token, refresh_token: new_refresh_token)
    else
      {:error, _reason} ->
        {:error, :unauthorized, "Invalid refresh token"}
    end
  end

  def logout(conn, _params) do
    token = Guardian.Plug.current_token(conn)

    with {:ok, _claims} <- Guardian.revoke(token) do
      render(conn, :message, message: "Logged out successfully")
    end
  end
end
```

### lib/my_phoenix_api_web/controllers/item_controller.ex
```elixir
defmodule MyPhoenixApiWeb.ItemController do
  use MyPhoenixApiWeb, :controller

  alias MyPhoenixApi.Items
  alias MyPhoenixApi.Items.Item

  action_fallback MyPhoenixApiWeb.FallbackController

  def index(conn, params) do
    user = Guardian.Plug.current_resource(conn)
    result = Items.list_items(user.id, params)
    render(conn, :index, result: result)
  end

  def create(conn, %{"item" => item_params}) do
    user = Guardian.Plug.current_resource(conn)

    with {:ok, %Item{} = item} <- Items.create_item(item_params, user) do
      conn
      |> put_status(:created)
      |> render(:show, item: item)
    end
  end

  def show(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)

    case Items.get_item_for_user(id, user.id) do
      nil -> {:error, :not_found}
      item -> render(conn, :show, item: item)
    end
  end

  def update(conn, %{"id" => id, "item" => item_params}) do
    user = Guardian.Plug.current_resource(conn)

    with item when not is_nil(item) <- Items.get_item_for_user(id, user.id),
         {:ok, %Item{} = item} <- Items.update_item(item, item_params) do
      render(conn, :show, item: item)
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  def delete(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)

    with item when not is_nil(item) <- Items.get_item_for_user(id, user.id),
         {:ok, _item} <- Items.delete_item(item) do
      send_resp(conn, :no_content, "")
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  def publish(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)

    with item when not is_nil(item) <- Items.get_item_for_user(id, user.id),
         {:ok, %Item{} = item} <- Items.publish_item(item) do
      render(conn, :show, item: item)
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  def archive(conn, %{"id" => id}) do
    user = Guardian.Plug.current_resource(conn)

    with item when not is_nil(item) <- Items.get_item_for_user(id, user.id),
         {:ok, %Item{} = item} <- Items.archive_item(item) do
      render(conn, :show, item: item)
    else
      nil -> {:error, :not_found}
      error -> error
    end
  end

  def stats(conn, _params) do
    user = Guardian.Plug.current_resource(conn)
    stats = Items.get_stats(user.id)
    render(conn, :stats, stats: stats)
  end
end
```

### lib/my_phoenix_api_web/controllers/fallback_controller.ex
```elixir
defmodule MyPhoenixApiWeb.FallbackController do
  use MyPhoenixApiWeb, :controller

  def call(conn, {:error, %Ecto.Changeset{} = changeset}) do
    conn
    |> put_status(:unprocessable_entity)
    |> put_view(json: MyPhoenixApiWeb.ErrorJSON)
    |> render(:error, changeset: changeset)
  end

  def call(conn, {:error, :not_found}) do
    conn
    |> put_status(:not_found)
    |> put_view(json: MyPhoenixApiWeb.ErrorJSON)
    |> render(:"404")
  end

  def call(conn, {:error, :unauthorized}) do
    conn
    |> put_status(:unauthorized)
    |> put_view(json: MyPhoenixApiWeb.ErrorJSON)
    |> render(:"401")
  end

  def call(conn, {:error, :unauthorized, message}) do
    conn
    |> put_status(:unauthorized)
    |> put_view(json: MyPhoenixApiWeb.ErrorJSON)
    |> render(:error, message: message)
  end

  def call(conn, {:error, :forbidden}) do
    conn
    |> put_status(:forbidden)
    |> put_view(json: MyPhoenixApiWeb.ErrorJSON)
    |> render(:"403")
  end
end
```

### priv/repo/migrations/20240101000000_create_users.exs
```elixir
defmodule MyPhoenixApi.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :string, null: false
      add :password_hash, :string, null: false
      add :name, :string, null: false
      add :role, :string, default: "user"
      add :is_active, :boolean, default: true

      timestamps(type: :utc_datetime)
    end

    create unique_index(:users, [:email])
  end
end
```

### priv/repo/migrations/20240101000001_create_items.exs
```elixir
defmodule MyPhoenixApi.Repo.Migrations.CreateItems do
  use Ecto.Migration

  def change do
    create table(:items, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string, null: false
      add :description, :text
      add :status, :string, default: "draft"
      add :price, :decimal, default: 0, precision: 10, scale: 2
      add :metadata, :map, default: %{}
      add :deleted_at, :utc_datetime
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create index(:items, [:user_id])
    create index(:items, [:status])
    create index(:items, [:deleted_at])
  end
end
```

## Docker Configuration

### Dockerfile
```dockerfile
ARG ELIXIR_VERSION=1.16.0
ARG OTP_VERSION=26.2
ARG DEBIAN_VERSION=bookworm-20231009-slim

ARG BUILDER_IMAGE="hexpm/elixir:${ELIXIR_VERSION}-erlang-${OTP_VERSION}-debian-${DEBIAN_VERSION}"
ARG RUNNER_IMAGE="debian:${DEBIAN_VERSION}"

FROM ${BUILDER_IMAGE} as builder

RUN apt-get update -y && apt-get install -y build-essential git \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*

WORKDIR /app

RUN mix local.hex --force && mix local.rebar --force

ENV MIX_ENV="prod"

COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV
RUN mkdir config

COPY config/config.exs config/${MIX_ENV}.exs config/
RUN mix deps.compile

COPY priv priv
COPY lib lib

RUN mix compile

COPY config/runtime.exs config/

RUN mix release

FROM ${RUNNER_IMAGE}

RUN apt-get update -y && apt-get install -y libstdc++6 openssl libncurses5 locales \
  && apt-get clean && rm -f /var/lib/apt/lists/*_*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

WORKDIR /app

RUN chown nobody /app

ENV MIX_ENV="prod"

COPY --from=builder --chown=nobody:root /app/_build/${MIX_ENV}/rel/my_phoenix_api ./

USER nobody

CMD ["/app/bin/server"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=ecto://postgres:postgres@postgres:5432/phoenixapi
      - SECRET_KEY_BASE=${SECRET_KEY_BASE}
      - GUARDIAN_SECRET_KEY=${GUARDIAN_SECRET_KEY}
      - PHX_HOST=localhost
      - PORT=4000
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: phoenixapi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

## CLAUDE.md Integration

```markdown
# Elixir Phoenix API

## Build Commands
- `mix phx.server` - Start development server
- `mix test` - Run all tests
- `mix ecto.migrate` - Run database migrations
- `mix deps.get` - Install dependencies

## Architecture
- Phoenix Framework for HTTP handling
- Ecto for database queries
- Guardian for JWT authentication
- Contexts for business logic organization

## Key Patterns
- Use contexts (Accounts, Items) for domain logic
- Changesets for validation
- Pattern matching in controllers
- Plug pipeline for middleware

## Database
- Ecto migrations in priv/repo/migrations
- Use `mix ecto.gen.migration name` to create
- Binary IDs (UUIDs) as primary keys
```

## AI Suggestions

1. **Add Phoenix Channels** - Implement real-time WebSocket connections
2. **Implement GenServers** - Use for background processing and state
3. **Add Oban for jobs** - Background job processing with persistence
4. **Implement Telemetry events** - Add custom metrics and tracing
5. **Add ExUnit property tests** - Use StreamData for property-based testing
6. **Implement LiveView admin** - Real-time admin dashboard
7. **Add GraphQL with Absinthe** - GraphQL API alongside REST
8. **Implement PubSub broadcasting** - Real-time updates across nodes
9. **Add Nebulex caching** - Distributed caching layer
10. **Implement rate limiting per user** - User-based throttling with Hammer
