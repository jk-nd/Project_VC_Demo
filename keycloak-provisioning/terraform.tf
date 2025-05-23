terraform {
  required_providers {
    keycloak = {
      source  = "mrparkers/keycloak"
      version = "4.4.0"
    }
  }
}

# Add variable for client secret
variable "client_secret" {
  type        = string
  description = "Client secret for the engine client"
  default     = "YOUR_CLIENT_SECRET"  # Default value, should be overridden in production
}

provider "keycloak" {
  client_id     = "admin-cli"
  username      = "admin"
  password      = "Keycloak123!"
  url           = "http://keycloak:11000"
  initial_login = true
  base_path     = ""  # Empty base path for master realm
  realm         = "master"  # Explicitly authenticate against master realm
}

# Create realm
resource "keycloak_realm" "projectvc_realm" {
  realm             = "projectvc-realm"
  enabled           = true
  display_name      = "Project VC Realm"
  display_name_html = "<strong>Project VC Realm</strong>"
}

# Create client
resource "keycloak_openid_client" "engine_client" {
  realm_id                     = keycloak_realm.projectvc_realm.id
  client_id                    = "engine-client"
  name                        = "Engine Client"
  enabled                     = true
  access_type                 = "PUBLIC"
  standard_flow_enabled       = true
  implicit_flow_enabled       = false
  direct_access_grants_enabled = true
  service_accounts_enabled    = false
  base_url                    = "http://localhost:5173"
  valid_redirect_uris = [
    "http://localhost:12000/*",
    "http://engine:12000/*",
    "http://localhost:5173/*",
    "http://localhost/*",
    "http://localhost/auth/realms/projectvc-realm/*",
    "http://localhost:5173/realms/projectvc-realm/*"
  ]
  web_origins = [
    "http://localhost:12000",
    "http://engine:12000",
    "http://localhost:5173",
    "http://localhost",
    "http://localhost/auth",
    "+"
  ]
  root_url = "http://localhost:5173"
}

# Add protocol mappers for the client
resource "keycloak_openid_client_default_scopes" "client_default_scopes" {
  realm_id  = keycloak_realm.projectvc_realm.id
  client_id = keycloak_openid_client.engine_client.id

  default_scopes = [
    "profile",
    "email",
    "roles",
    "web-origins"
  ]
}

# Create users
resource "keycloak_user" "alice" {
  realm_id = keycloak_realm.projectvc_realm.id
  username = "alice"
  enabled  = true
  email    = "alice@tech.nd"
  first_name = "Alice"

  initial_password {
    value = "alice"
    temporary = false
  }

  attributes = {
    organization = "CocaCola"
    Can_Issue    = "true"
  }
}

resource "keycloak_user" "bob" {
  realm_id = keycloak_realm.projectvc_realm.id
  username = "bob"
  enabled  = true
  email    = "bob@tech.nd"
  first_name = "Bob"

  initial_password {
    value = "bob"
    temporary = false
  }

  attributes = {
    organization = "Pepsi"
    Can_Issue    = "true"
  }
}

resource "keycloak_user" "charlie" {
  realm_id = keycloak_realm.projectvc_realm.id
  username = "charlie"
  enabled  = true
  email    = "charlie@tech.nd"
  first_name = "Charlie"

  initial_password {
    value = "charlie"
    temporary = false
  }

  attributes = {
    organization = "Fanta"
    Can_Issue    = "true"
  }
} 