variable "region" {
  type    = string
  default = "us-east-1"
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
}

variable "ssh_cidr" {
  description = "Plage autorisée en SSH"
  type        = string
  default     = "0.0.0.0/0"
}
