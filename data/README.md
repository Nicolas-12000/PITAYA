# Datos Kaggle (local, no versionados)

**Dataset:** [madislemsalu/facebook-ad-campaign](https://www.kaggle.com/datasets/madislemsalu/facebook-ad-campaign)

**Archivo esperado:** `data/raw/facebook-ad-campaign.csv`

## Cómo descargar

### Opción A — kagglehub (recomendada para el repo)

Requiere cuenta Kaggle y API token (`~/.kaggle/kaggle.json` o variable de entorno según [Kaggle API](https://github.com/Kaggle/kaggle-api)).

```bash
make install
cd backend && uv sync --extra data
make download    # copia el CSV al path estándar
make ingest
make train
```

Equivalente Kaggle UI (**elegir “kagglehub - pandas”**, no Hugging Face):

```python
import kagglehub
from kagglehub import KaggleDatasetAdapter

df = kagglehub.load_dataset(
    KaggleDatasetAdapter.PANDAS,
    "madislemsalu/facebook-ad-campaign",
    "data.csv",
)
```

`make download` hace eso, normaliza columnas y guarda `data/raw/facebook-ad-campaign.csv`.

### Opción B — Kaggle CLI

```bash
mkdir -p data/raw
kaggle datasets download -d madislemsalu/facebook-ad-campaign -p data/raw --unzip
# Renombrar o enlazar al archivo único .csv como facebook-ad-campaign.csv
make ingest
```

### Opción C — Manual

Descargar el zip desde la web de Kaggle, extraer el CSV aquí y renombrar a `facebook-ad-campaign.csv`.
