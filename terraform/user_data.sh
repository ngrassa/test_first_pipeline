#!/bin/bash
# Exécuté par cloud-init au premier démarrage de vmpipeline
set -eux

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y nginx

cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>vmpipeline</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f172a; color: #e2e8f0;
           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { text-align: center; padding: 40px 60px; background: #1e293b; border-radius: 12px; }
    h1 { color: #22c55e; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Mon premier pipeline réussi</h1>
    <p>Instance <strong>vmpipeline</strong> déployée par GitHub Actions + Terraform</p>
  </div>
</body>
</html>
EOF

systemctl enable nginx
systemctl restart nginx
