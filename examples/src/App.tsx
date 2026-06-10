import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, Tabs, TabsList, TabsTrigger } from "@moritzbrantner/ui";
import { useEffect, useState } from "react";

import {
  LayerEditorPanel,
  commitLayerEditorHistory,
  serializeLayerEditorDocument,
  type LayerEditorSelection,
} from "@moritzbrantner/layer-editor";

import { ExamplePreview } from "./example-preview";
import { LayerControls } from "./layer-controls";
import { createExampleHistories, createExampleLayer, loadExampleDocuments } from "./example-state";
import {
  exampleLabels,
  initialSelection,
  type ExampleDocument,
  type ExampleHistory,
  type ExampleHistories,
  type ExampleKey,
} from "./example-types";
import { renderLayerMeta } from "./example-utils";

export function App() {
  const examplesQuery = useQuery({
    queryFn: loadExampleDocuments,
    queryKey: ["layer-editor", "examples"],
  });
  const [activeExample, setActiveExample] = useState<ExampleKey>("geojson");
  const [histories, setHistories] = useState<ExampleHistories | null>(null);
  const [selections, setSelections] = useState<Record<ExampleKey, LayerEditorSelection>>({
    geojson: { layerIds: ["route"], primaryLayerId: "route" },
    image: { layerIds: ["caption"], primaryLayerId: "caption" },
    svg: { layerIds: ["wordmark"], primaryLayerId: "wordmark" },
  });

  useEffect(() => {
    if (examplesQuery.data && !histories) {
      setHistories(createExampleHistories(examplesQuery.data));
    }
  }, [examplesQuery.data, histories]);

  if (examplesQuery.isError) {
    return (
      <ShellMessage
        title="Examples failed to load"
        detail={examplesQuery.error instanceof Error ? examplesQuery.error.message : undefined}
      />
    );
  }

  if (!histories) {
    return <ShellMessage title="Loading examples" />;
  }

  const history = histories[activeExample];
  const document = history.present;
  const selection = selections[activeExample] ?? initialSelection;
  const selectedLayer =
    document.layers.find((layer) => layer.id === selection.primaryLayerId) ?? null;
  const setActiveDocument = (nextDocument: ExampleDocument) => {
    setHistories((currentHistories) =>
      currentHistories
        ? {
            ...currentHistories,
            [activeExample]: commitLayerEditorHistory(
              currentHistories[activeExample],
              nextDocument,
            ),
          }
        : currentHistories,
    );
  };
  const setActiveHistory = (nextHistory: ExampleHistory) => {
    setHistories((currentHistories) =>
      currentHistories
        ? {
            ...currentHistories,
            [activeExample]: nextHistory,
          }
        : currentHistories,
    );
  };

  return (
    <main className="min-h-screen bg-[#e8ece7] p-4 text-[#21302d] md:p-6">
      <header className="mx-auto mb-[18px] grid max-w-[1320px] gap-5 md:flex md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-[0.82rem] font-bold uppercase text-[#61726d]">
            @moritzbrantner/layer-editor
          </p>
          <h1 className="text-[clamp(2rem,5vw,4.2rem)] leading-[1.1] font-bold tracking-normal">
            Layer Editor Examples
          </h1>
        </div>
        <Tabs
          value={activeExample}
          onValueChange={(value) => setActiveExample(value as ExampleKey)}
        >
          <TabsList aria-label="Examples" className="grid grid-cols-3">
            {(Object.keys(exampleLabels) as ExampleKey[]).map((example) => (
              <TabsTrigger key={example} value={example}>
                {exampleLabels[example]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </header>

      <section
        className="mx-auto grid max-w-[1320px] grid-cols-1 gap-4 min-[960px]:grid-cols-[minmax(0,1fr)_360px]"
        aria-label={`${exampleLabels[activeExample]} example`}
      >
        <Card
          aria-label="Layer preview"
          className="min-h-0 overflow-hidden min-[960px]:min-h-[610px]"
        >
          <CardContent className="grid h-full items-center p-3 min-[960px]:p-6">
            <ExamplePreview document={document} example={activeExample} selection={selection} />
          </CardContent>
        </Card>

        <aside aria-label="Layer controls">
          <Card>
            <CardContent className="grid gap-4 p-3.5">
              <LayerEditorPanel
                createLayer={({ existingIds }) => createExampleLayer(activeExample, existingIds)}
                document={document}
                features={{ historyControls: true }}
                history={history}
                renderLayerMeta={renderLayerMeta}
                selection={selection}
                onHistoryChange={(nextHistory) => setActiveHistory(nextHistory as ExampleHistory)}
                onSelectionChange={(nextSelection) =>
                  setSelections((currentSelections) => ({
                    ...currentSelections,
                    [activeExample]: nextSelection,
                  }))
                }
              />
              <LayerControls
                document={document}
                layer={selectedLayer}
                onDocumentChange={setActiveDocument}
              />
            </CardContent>
          </Card>
        </aside>
      </section>

      <Card
        aria-label="Serialized document"
        className="mx-auto mt-4 hidden max-w-[1320px] overflow-hidden min-[560px]:block"
      >
        <CardContent className="p-4">
          <h2 className="mb-3 text-base leading-[1.1] font-bold">Document</h2>
          <pre className="max-h-[340px] overflow-auto rounded-lg bg-[#202927] p-3.5 text-[0.8rem] text-[#edf3e7]">
            {JSON.stringify(serializeLayerEditorDocument(document), null, 2)}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}

function ShellMessage({ detail, title }: { detail?: string; title: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#e8ece7] p-4 text-[#21302d]">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h1 className="text-2xl leading-[1.1] font-bold">{title}</h1>
          {detail ? <p className="mt-3 text-sm text-[#61726d]">{detail}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
