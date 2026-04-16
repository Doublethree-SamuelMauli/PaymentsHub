# Deploy PaymentsHub frontend

Pacote pronto para subir em `paymentshub.doublethree.com.br` no EC2 doublethree (3.23.24.36).

## Estado atual

- ✅ DNS Cloudflare: `paymentshub.doublethree.com.br A 3.23.24.36 proxied` — já criado e propagado
- ✅ Bundle Next.js standalone: `paymentshub-standalone.tar.gz` (~11M)
- ✅ Gmail SMTP wired (env `SMTP_USER`, `SMTP_PASS`, `MAIL_TO`)
- ⏳ SSH/SSM: as chaves em `~/Downloads/Manus*.pem` foram negadas (`Permission denied (publickey)`) e o profile AWS local não tem acesso à conta da doublethree. Deploy precisa ser feito por quem tem acesso ao servidor.

## Como concluir (do EC2)

```bash
# 1. Pegar o bundle (escolher um dos métodos)

# (a) Via S3 (se você puser o tar.gz no bucket doublethree-bs-1773977193):
URL=$(aws s3 presign s3://doublethree-bs-1773977193/paymentshub-standalone.tar.gz --region us-east-2 --expires-in 3600)
curl -s "$URL" -o /tmp/paymentshub-standalone.tar.gz

# (b) Via scp direto (se você tiver SSH local funcionando):
scp -i <sua-key> deploy/paymentshub-standalone.tar.gz ubuntu@3.23.24.36:/tmp/
scp -i <sua-key> deploy/paymentshub.nginx.conf       ubuntu@3.23.24.36:/tmp/
scp -i <sua-key> deploy/ecosystem.config.js.local   ubuntu@3.23.24.36:/tmp/ecosystem.config.js
scp -i <sua-key> deploy/install.sh                   ubuntu@3.23.24.36:/tmp/

# 2. Rodar o instalador
ssh -i <sua-key> ubuntu@3.23.24.36 'bash /tmp/install.sh'
```

## O que `install.sh` faz

1. `mkdir -p /var/www/paymentshub-site`
2. `tar xzf` do bundle e `rsync` para o diretório
3. Copia `ecosystem.config.js` (com as env vars de SMTP)
4. `pm2 start ecosystem.config.js` (porta 3100, fork mode)
5. Cria `/etc/nginx/sites-available/paymentshub.conf` apontando para `127.0.0.1:3100`
6. `nginx -t && systemctl reload nginx`
7. `certbot --nginx -d paymentshub.doublethree.com.br` (Let's Encrypt + redirect 80→443)

## Verificação pós-deploy

```bash
curl -I https://paymentshub.doublethree.com.br        # 200 OK
curl https://paymentshub.doublethree.com.br/api/demo  # 405 (POST only) — confirma API route ativa
pm2 status paymentshub-site
pm2 logs paymentshub-site --lines 20
```

## Smoke test do e-mail

```bash
curl -X POST https://paymentshub.doublethree.com.br/api/demo \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"voce@exemplo.com","company":"Exemplo","volume":"500 a 5.000/mês"}'
```

Verificar entrada na caixa `[email protected]` (e cópia em `voce@exemplo.com`).

## Segredos

A senha do Gmail (`lczo qral ctwg idpe`) está em `ecosystem.config.js.local` e é a mesma usada em `/var/www/doublethree-api/ecosystem.config.js`. Esse arquivo está no `.gitignore`.
