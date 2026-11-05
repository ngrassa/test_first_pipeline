terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend S3 : bucket/key/region fournis par le pipeline (terraform init -backend-config=...)
  backend "s3" {}
}

# Identifiants fournis par le pipeline (variables d'environnement AWS_*)
provider "aws" {
  region = var.region
}

# AMI Ubuntu 24.04 LTS officielle (Canonical) la plus récente
data "aws_ami" "ubuntu_2404" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_vpc" "default" {
  default = true
}

# Security group : SSH + HTTP entrants, tout sortant
resource "aws_security_group" "vmpipeline_sg" {
  name        = "vmpipeline-sg"
  description = "SSH et HTTP pour vmpipeline"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Tout le trafic sortant (apt, mises a jour)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "vmpipeline-sg" }
}

resource "aws_instance" "vmpipeline" {
  ami                         = data.aws_ami.ubuntu_2404.id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  vpc_security_group_ids      = [aws_security_group.vmpipeline_sg.id]
  associate_public_ip_address = true

  # Installation de Nginx + page web au premier démarrage
  user_data                   = file("${path.module}/user_data.sh")
  user_data_replace_on_change = true

  # IMDSv2 obligatoire (protection contre le vol de credentials via SSRF)
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  root_block_device {
    volume_size           = var.disk_size_gb
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = { Name = "vmpipeline" }
}
