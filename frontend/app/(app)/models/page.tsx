import type { Metadata } from "next";
import { Suspense } from "react";

import { EmptyState, ErrorState } from "@/components/states/states";
import { PageHeader } from "@/components/ui/primitives";
import { load } from "@/lib/api/server";
import type { ModelsResponse } from "@/lib/api/types";

import { ModelsExplorer } from "./_components/ModelsExplorer";
import { ModelsSkeleton } from "./_components/ModelsSkeleton";

export const metadata: Metadata = { title: "Modelos" };

export default function ModelsPage() {
  return (
    <>
      <PageHeader
        title="Modelos de conversión"
        description="Clasificadores que estiman si un anuncio logra al menos una conversión aprobada. Entrenados offline (make train) con validación cruzada de 5 folds y un conjunto de prueba aparte."
      />
      <Suspense fallback={<ModelsSkeleton />}>
        <Models />
      </Suspense>
    </>
  );
}

async function Models() {
  const res = await load<ModelsResponse>("v1/models");
  if (!res.ok) return <ErrorState title="No pudimos cargar el manifiesto de modelos" message={res.message} />;
  if (res.data.status !== "ok") {
    return (
      <div className="rounded-lg border border-hairline bg-surface-1">
        <EmptyState title="Aún no hay modelos entrenados" mood="sleepy">
          Ejecuta <code className="font-mono">make train</code> en el backend para generar el manifiesto y los artefactos.
        </EmptyState>
      </div>
    );
  }
  return <ModelsExplorer manifest={res.data.manifest} />;
}
