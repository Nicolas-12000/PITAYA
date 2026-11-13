# Fixture de tests

`sample_ads.csv` es un **extracto de filas reales** del dataset [madislemsalu/facebook-ad-campaign](https://www.kaggle.com/datasets/madislemsalu/facebook-ad-campaign), después de la misma limpieza que `make ingest` (campañas 916/936/1178, reglas en `catalog/quality.py`).

No inventar filas en este archivo. Para regenerarlo tras un ingest del CSV completo:

```bash
make download && make ingest
make export-test-fixture   # o: uv run python -m pitaya.cli export_test_fixture --rows 80
```

Los tests de CI usan solo este extracto vía `tests/conftest.py` (ingest + train en directorio temporal).
