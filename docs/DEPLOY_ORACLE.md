# Migração Railway → Oracle Cloud (Always Free)

Urgente: Railway free acaba em poucos dias. Roteiro na ordem em que deve ser executado — cada passo
depende do anterior. Arquivos de referência: `docker-compose.prod.yml`, `Caddyfile`,
`.env.prod.example` (raiz do repo).

## 0. Dados

O Postgres do Railway parou de responder (período gratuito encerrado), então não há dump de lá. O
banco novo é repovoado pelo seed (passo 6): usuário, categorias, itens fixos e os 361 lançamentos de
fev–set/2026. Lançamentos feitos direto em produção depois do seed não voltam.

Garantia extra: dump do banco local, guardado fora do repo.

```bash
docker exec orcamento-postgres-1 pg_dump -U postgres -F c orcamento > orcamento-local.dump
```

## 1. Criar a VM na Oracle

- console.cloud.oracle.com → Compute → Instances → Create instance.
- Imagem: Ubuntu (a mais recente LTS). Formato: **Ampere (ARM), VM.Standard.A1.Flex**, dentro do
  limite Always Free (até 4 OCPU / 24GB, mas 1 OCPU / 6GB já basta pra esse app).
- Rede: crie um IP público **reservado** (não efêmero) — se for efêmero, o IP muda ao reiniciar a VM
  e quebra o DNS depois.
- Baixe a chave SSH gerada na criação.

## 2. Abrir as portas 80 e 443 (nos dois lugares — é o erro mais comum)

**a) Security List da VCN** (painel Oracle): Networking → Virtual Cloud Networks → sua VCN →
Security Lists → Default Security List → Add Ingress Rules: `0.0.0.0/0`, TCP, portas 80 e 443.

**b) Firewall da própria VM** (as imagens Ubuntu da Oracle vêm com `iptables` bloqueando por padrão):

```bash
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save   # ou: sudo apt install iptables-persistent
```

## 3. Instalar Docker na VM

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Levar os arquivos pra VM

Mais simples: clonar o repo inteiro (só a API roda na VM; `apps/web` fica sem uso, mas o Dockerfile
precisa do contexto do monorepo pra copiar `packages/shared`).

```bash
git clone https://github.com/<seu-usuario>/orcamento.git
cd orcamento
cp .env.prod.example .env
nano .env   # preenche POSTGRES_PASSWORD, BETTER_AUTH_SECRET, RESEND_API_KEY etc.
```

## 5. Subir os containers

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f api   # confirma "Nest application successfully started"
```

Nesse ponto a API já está de pé, mas ainda sem HTTPS/DNS — o Caddy vai falhar em emitir o
certificado até o passo 7.

## 6. Popular o banco

As migrations já rodaram na subida da API. Preencha `SEED_USER_EMAIL` e `SEED_USER_PASSWORD` no
`.env` (a senha vira a do seu login) e rode o seed uma vez, dentro do container:

```bash
docker compose -f docker-compose.prod.yml exec api sh -c "cd apps/api && npx prisma db seed"
```

Esse caminho foi testado: migrate + seed na imagem de produção, depois login e `GET /expenses`.
O seed é idempotente. Depois de rodar, troque a senha pelo "Esqueci minha senha" se quiser, e
apague `SEED_USER_PASSWORD` do `.env` da VM.

Se em vez do seed você quiser restaurar o dump local:

```bash
docker compose -f docker-compose.prod.yml cp orcamento-local.dump postgres:/tmp/backup.dump
docker compose -f docker-compose.prod.yml exec postgres pg_restore -U orcamento -d orcamento --clean --if-exists --no-owner /tmp/backup.dump
```

## 7. Apontar o DNS

No registro.br, troque o registro de `api.orcamento.jeenyuhs.com.br` de CNAME (Railway) pra **A**,
apontando pro IP público reservado da VM. Propagação pode levar de minutos a algumas horas.

Depois que o DNS propagar, o Caddy detecta sozinho e emite o certificado Let's Encrypt na primeira
requisição HTTPS — confira com `docker compose -f docker-compose.prod.yml logs -f caddy`.

## 8. Testar de ponta a ponta

```bash
curl https://api.orcamento.jeenyuhs.com.br/api/auth/get-session
```

Depois, pelo site (`orcamento.jeenyuhs.com.br`, que continua na Vercel e não muda): login com a
senha atual, checar um lançamento, sair. `NEXT_PUBLIC_API_URL` na Vercel já aponta pro domínio da
API, não pro Railway — não deveria precisar de redeploy, mas confira o valor lá antes de considerar
pronto.

## 9. Desligar o Railway

Só depois do passo 8 confirmado. Cancele o serviço antes do fim do período gratuito.

## Backup contínuo (fazer logo depois de estabilizar)

Sem o Railway, o backup do banco passa a ser sua responsabilidade. Um cron simples resolve:

```bash
# crontab -e
0 3 * * * docker compose -f /home/ubuntu/orcamento/docker-compose.prod.yml exec -T postgres pg_dump -U orcamento orcamento > /home/ubuntu/backups/orcamento-$(date +\%F).sql
```

Idealmente copie esses dumps pra fora da VM (um bucket, outro serviço) — um backup que mora no
mesmo disco que pode falhar não protege contra a falha do disco.
