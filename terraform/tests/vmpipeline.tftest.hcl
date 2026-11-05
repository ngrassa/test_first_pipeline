# Tests unitaires Terraform (terraform test, Terraform >= 1.7)
# Le provider AWS est simulé : aucun identifiant AWS ni ressource réelle nécessaire.

mock_provider "aws" {
  override_data {
    target = data.aws_ami.ubuntu_2404
    values = {
      id = "ami-0123456789abcdef0"
    }
  }

  override_data {
    target = data.aws_vpc.default
    values = {
      id = "vpc-0123456789abcdef0"
    }
  }
}

# ---------------------------------------------------------------------------
# Instance EC2
# ---------------------------------------------------------------------------
run "instance_configuration_par_defaut" {
  command = plan

  assert {
    condition     = aws_instance.vmpipeline.instance_type == "t2.large"
    error_message = "Le type d'instance par défaut doit être t2.large."
  }

  assert {
    condition     = aws_instance.vmpipeline.ami == "ami-0123456789abcdef0"
    error_message = "L'instance doit utiliser l'AMI Ubuntu 24.04 retournée par la data source."
  }

  assert {
    condition     = aws_instance.vmpipeline.key_name == "vockey"
    error_message = "La paire de clés par défaut doit être vockey."
  }

  assert {
    condition     = aws_instance.vmpipeline.associate_public_ip_address == true
    error_message = "L'instance doit avoir une IP publique."
  }

  assert {
    condition     = aws_instance.vmpipeline.tags["Name"] == "vmpipeline"
    error_message = "L'instance doit être taguée Name=vmpipeline."
  }
}

run "disque_racine_gp3_chiffre" {
  command = plan

  assert {
    condition     = aws_instance.vmpipeline.root_block_device[0].volume_size == 20
    error_message = "Le disque racine doit faire 20 Go par défaut."
  }

  assert {
    condition     = aws_instance.vmpipeline.root_block_device[0].volume_type == "gp3"
    error_message = "Le disque racine doit être de type gp3."
  }

  assert {
    condition     = aws_instance.vmpipeline.root_block_device[0].encrypted == true
    error_message = "Le disque racine doit être chiffré."
  }
}

run "imdsv2_obligatoire" {
  command = plan

  assert {
    condition     = aws_instance.vmpipeline.metadata_options[0].http_tokens == "required"
    error_message = "IMDSv2 doit être obligatoire (http_tokens = required)."
  }
}

run "user_data_installe_nginx" {
  command = plan

  assert {
    condition     = strcontains(aws_instance.vmpipeline.user_data, "apt-get install -y nginx")
    error_message = "Le user_data doit installer Nginx."
  }

  assert {
    condition     = strcontains(aws_instance.vmpipeline.user_data, "Mon premier pipeline")
    error_message = "La page web doit contenir le texte 'Mon premier pipeline'."
  }
}

# ---------------------------------------------------------------------------
# Security group
# ---------------------------------------------------------------------------
run "security_group_ports_ouverts" {
  command = plan

  assert {
    condition     = length(aws_security_group.vmpipeline_sg.ingress) == 2
    error_message = "Le security group doit avoir exactement 2 règles entrantes (SSH, HTTP)."
  }

  assert {
    condition     = contains([for r in aws_security_group.vmpipeline_sg.ingress : r.from_port], 22)
    error_message = "Le port 22 (SSH) doit être ouvert."
  }

  assert {
    condition     = contains([for r in aws_security_group.vmpipeline_sg.ingress : r.from_port], 80)
    error_message = "Le port 80 (HTTP) doit être ouvert."
  }

  assert {
    condition     = aws_security_group.vmpipeline_sg.vpc_id == "vpc-0123456789abcdef0"
    error_message = "Le security group doit être créé dans le VPC par défaut."
  }
}

run "ssh_restreint_a_un_cidr" {
  command = plan

  variables {
    ssh_cidr = "203.0.113.0/24"
  }

  assert {
    condition = alltrue([
      for r in aws_security_group.vmpipeline_sg.ingress :
      contains(r.cidr_blocks, "203.0.113.0/24") && length(r.cidr_blocks) == 1 if r.from_port == 22
    ])
    error_message = "La règle SSH doit utiliser la variable ssh_cidr."
  }
}

# ---------------------------------------------------------------------------
# Outputs
# ---------------------------------------------------------------------------
run "outputs" {
  command = apply # apply simulé par le mock provider

  assert {
    condition     = startswith(output.web_url, "http://")
    error_message = "web_url doit commencer par http://"
  }

  assert {
    condition     = strcontains(output.ssh_command, "ubuntu@")
    error_message = "ssh_command doit utiliser l'utilisateur ubuntu."
  }
}

# ---------------------------------------------------------------------------
# Validation des variables (cas d'erreur attendus)
# ---------------------------------------------------------------------------
run "rejette_cidr_invalide" {
  command = plan

  variables {
    ssh_cidr = "pas-un-cidr"
  }

  expect_failures = [var.ssh_cidr]
}

run "rejette_disque_trop_petit" {
  command = plan

  variables {
    disk_size_gb = 4
  }

  expect_failures = [var.disk_size_gb]
}

run "rejette_region_invalide" {
  command = plan

  variables {
    region = "europe"
  }

  expect_failures = [var.region]
}
