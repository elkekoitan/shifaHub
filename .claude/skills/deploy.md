---
name: Deploy Skill
description: Coolify deployment workflow - staging/production deploy, rollback, health check
---

# Deploy Skill

## Ne Zaman Tetiklenir
- `/deploy` komutu veya deployment talepleri
- Staging/production ortamina deploy islemleri
- Rollback gerektiren durumlarda

## Coolify Bilgileri
- **Dashboard:** http://185.255.95.111:8000
- **API Token:** Coolify env vars'ta
- **API Base:** http://185.255.95.111:8000/api/v1

## Deploy Workflow

### Staging Deploy (Otomatik)
1. `develop` branch'e push
2. GitHub Actions tetiklenir
3. Lint -> Typecheck -> Test -> Build
4. Coolify webhook tetiklenir
5. Docker image build + deploy
6. Health check

### Production Deploy (Manuel)
1. `main` branch'e merge
2. Git tag olustur: `git tag vX.Y.Z`
3. GitHub Actions tetiklenir (manual approval)
4. Coolify production webhook tetiklenir
5. Zero-downtime deploy
6. Health check + smoke test

### Rollback
```bash
# Coolify API ile rollback
curl -X POST http://185.255.95.111:8000/api/v1/applications/{uuid}/rollback \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json"
```

## Health Check Endpointleri
- Frontend: `https://app.shifahub.app/api/health`
- Backend: `https://api.shifahub.app/health`
- Evolution API: `https://wa.shifahub.app/`

## Post-Deploy Dogrulama
1. Health check endpoint'leri kontrol
2. Temel akislari test (giris, randevu listeleme)
3. Veritabani baglantisi kontrol
4. Redis baglantisi kontrol
5. MinIO erisim kontrol
6. Grafana metrikleri kontrol

## Coolify API Ornekleri
```bash
# Projeleri listele
curl -s http://185.255.95.111:8000/api/v1/projects \
  -H "Authorization: Bearer 1|l0aDJB6GqSMlavK2yczWkUePScAo4Kwsff4KKgrx3a3f177d"

# Servisleri listele
curl -s http://185.255.95.111:8000/api/v1/services \
  -H "Authorization: Bearer 1|l0aDJB6GqSMlavK2yczWkUePScAo4Kwsff4KKgrx3a3f177d"

# Deploy tetikle
curl -X POST http://185.255.95.111:8000/api/v1/applications/{uuid}/restart \
  -H "Authorization: Bearer 1|l0aDJB6GqSMlavK2yczWkUePScAo4Kwsff4KKgrx3a3f177d"
```
