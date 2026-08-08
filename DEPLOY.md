# Deploying to Oracle Cloud (Always Free)

Runs the whole stack (PostgreSQL, Elasticsearch, backend, frontend, and a
Caddy reverse proxy that gets you free HTTPS) as Docker containers on a
single Oracle Cloud "Always Free" VM. Total cost: **$0/month**.

## 1. Create the VM

1. In the [Oracle Cloud Console](https://cloud.oracle.com/), create a Compute
   instance using an **Ampere A1 (ARM)** shape from the Always Free tier —
   e.g. 2 OCPU / 12 GB RAM. Ampere A1 gives you far more free RAM than the
   x86 Always Free shapes, which matters for running Elasticsearch. All the
   images this project uses (Postgres, Elasticsearch, Eclipse Temurin,
   Node) support ARM64, so this just works.
2. Pick Ubuntu as the image, and download/keep the SSH key pair Oracle
   generates.
3. Note the instance's public IP address.

## 2. Open ports 80 and 443

Oracle blocks everything but SSH (22) by default, in two places — both need
opening:

1. **Security List / Network Security Group**: in the VCN's subnet, add
   ingress rules for `0.0.0.0/0` → TCP `80` and TCP `443`.
2. **The VM's own firewall** (Ubuntu images ship with `iptables` rules that
   also block these ports): SSH in and run:
   ```bash
   sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```

## 3. Point a domain at the VM

Caddy needs a real domain name to issue a Let's Encrypt certificate (a bare
IP won't work). A free option is [DuckDNS](https://www.duckdns.org/): sign
in, create a subdomain (e.g. `word-log.duckdns.org`), and point it at the
VM's public IP. A domain you already own works too — just add an `A` record.

## 4. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in for the group change to take effect
```

## 5. Configure Google OAuth for the domain

In the same [Google Cloud OAuth client](https://console.cloud.google.com/apis/credentials)
used for local dev, add:

- Authorized JavaScript origin: `https://<your-domain>`
- Authorized redirect URI: `https://<your-domain>/api/auth/callback/google`

## 6. Deploy

```bash
git clone <this-repo-url> word-log
cd word-log
cp .env.prod.example .env
# edit .env: DOMAIN, AUTH_SECRET, GOOGLE_CLIENT_ID, AUTH_GOOGLE_SECRET, DB_PASSWORD

docker compose -f docker-compose.prod.yml up -d --build
```

First boot takes a few minutes (Elasticsearch starting, Caddy requesting a
certificate, Flyway migrating the database). Check status with:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

Once healthy, `https://<your-domain>` should show the sign-in page.

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Notes

- Only Caddy (80/443) is exposed to the internet. PostgreSQL, Elasticsearch,
  and the backend stay on the internal Docker network — the frontend talks
  to the backend server-side, so nothing but the reverse proxy needs a
  public port.
- Data lives in the `postgres_data` / `elasticsearch_data` Docker volumes.
  Back them up (e.g. `docker run --rm -v word-log_postgres_data:/data ...`)
  if you care about not losing your dictionary.
