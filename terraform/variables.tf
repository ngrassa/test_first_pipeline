variable "region" {
  type    = string
  default = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.region))
    error_message = "region doit etre une region AWS valide (ex: us-east-1)."
  }
}

variable "instance_type" {
  type    = string
  default = "t2.large"
}

variable "key_name" {
  description = "Paire de clés existante dans AWS"
  type        = string
  default     = "vockey"
}

variable "disk_size_gb" {
  type    = number
  default = 20

  validation {
    condition     = var.disk_size_gb >= 8 && var.disk_size_gb <= 100
    error_message = "disk_size_gb doit etre compris entre 8 et 100 Go."
  }
}

variable "ssh_cidr" {
  description = "Plage autorisée en SSH"
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = can(cidrhost(var.ssh_cidr, 0))
    error_message = "ssh_cidr doit etre un bloc CIDR valide (ex: 203.0.113.0/24)."
  }
}
