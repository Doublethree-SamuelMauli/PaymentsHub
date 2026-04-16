#!/usr/bin/env bash
# Roda dentro do EC2 (3.23.24.36) como usuario com sudo (ubuntu).
# Pre-requisito: paymentshub-standalone.tar.gz, ecosystem.config.js
# e paymentshub.nginx.conf ja em /tmp/.
set -euo pipefail

APP_DIR=/var/www/paymentshub-site
NGINX_AVAIL=/etc/nginx/sites-available/paymentshub.conf
NGINX_ENABLED=/etc/nginx/sites-enabled/paymentshub.conf

echo "==> 1/6  Preparando diretorio $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

echo "==> 2/6  Descompactando bundle"
tar xzf /tmp/paymentshub-standalone.tar.gz -C /tmp/
rsync -a --delete /tmp/standalone/ "$APP_DIR/"

echo "==> 3/6  Instalando ecosystem.config.js"
cp /tmp/ecosystem.config.js "$APP_DIR/ecosystem.config.js"

echo "==> 4/6  Subindo no PM2"
cd "$APP_DIR"
pm2 delete paymentshub-site 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo "==> 5/6  Configurando Nginx"
sudo cp /tmp/paymentshub.nginx.conf "$NGINX_AVAIL"
[ -L "$NGINX_ENABLED" ] || sudo ln -s "$NGINX_AVAIL" "$NGINX_ENABLED"
sudo nginx -t
sudo systemctl reload nginx

echo "==> 6/6  Emitindo SSL via certbot (Let's Encrypt)"
sudo certbot --nginx -d paymentshub.doublethree.com.br --non-interactive --agree-tos -m contato@doublethree.com.br --redirect

echo
echo "OK. Verificar:"
echo "  curl -I https://paymentshub.doublethree.com.br"
echo "  pm2 status"
echo "  pm2 logs paymentshub-site --lines 20"
