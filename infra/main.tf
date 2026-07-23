terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

resource "cloudflare_d1_database" "task_tracker_db" {
  account_id = var.cloudflare_account_id
  name       = "task-tracker-db"
}

resource "cloudflare_workers_script" "task_tracker_worker" {
  account_id = var.cloudflare_account_id
  name       = "task-tracker-cloud"
  content    = file("${path.module}/../dist/index.js")
  module     = true

  d1_database_binding {
    name        = "task_tracker_db"
    database_id = cloudflare_d1_database.task_tracker_db.id
  }
}

