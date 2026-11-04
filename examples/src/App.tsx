import { useQuery } from "@tanstack/react-query";
import {
  EditorPane,
  EditorPaneContent,
  EditorPaneHeader,
  EditorPaneLayout,
  EditorPaneMain,
  EditorPaneToggle,
  EditorToolbar,
  EditorToolbarGroup,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@moritzbrantner/ui";
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

const layersPaneId = "layer-editor-layers";
const propertiesPaneId = "layer-editor-properties";
const documentPaneId = "layer-editor-document";

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
    <main className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <EditorPaneLayout orientation="vertical">
        <EditorToolbar
          aria-label="Workbench"
          className="rounded-none border-x-0 border-t-0 shadow-none"
          overflow="scroll"
        >
          <EditorToolbarGroup aria-label="Panes">
            <EditorPaneToggle paneId={layersPaneId} />
          </EditorToolbarGroup>
          <h1 className="min-w-0 truncate text-sm font-semibold max-[480px]:sr-only">
            Layer Editor
          </h1>
          <Tabs
            className="ms-auto"
            value={activeExample}
            onValueChange={(value) => setActiveExample(value as ExampleKey)}
          >
            <TabsList aria-label="Examples">
              {(Object.keys(exampleLabels) as ExampleKey[]).map((example) => (
                <TabsTrigger key={example} value={example}>
                  {exampleLabels[example]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <EditorToolbarGroup aria-label="Inspector panes">
            <EditorPaneToggle paneId={documentPaneId} />
            <EditorPaneToggle paneId={propertiesPaneId} />
          </EditorToolbarGroup>
        </EditorToolbar>

        <EditorPaneMain className="flex min-h-0 flex-col overflow-hidden">
          <EditorPaneLayout>
            <EditorPane
              rail={false}
              collapsible
              defaultSize={320}
              id={layersPaneId}
              label="Layers"
              maxSize={480}
              minSize={240}
              side="start"
            >
              <EditorPaneHeader title="Layers" />
              <EditorPaneContent>
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
              </EditorPaneContent>
            </EditorPane>

            <EditorPaneMain
              aria-label={`${exampleLabels[activeExample]} preview`}
              className="grid place-items-center bg-muted/30 p-3 md:p-6"
              role="region"
            >
              <div className="w-full max-w-[960px]">
                <ExamplePreview document={document} example={activeExample} selection={selection} />
              </div>
            </EditorPaneMain>

            <EditorPane
              rail={false}
              collapsible
              defaultSize={300}
              id={propertiesPaneId}
              label="Properties"
              minSize={240}
              side="end"
            >
              <EditorPaneHeader title="Properties" />
              <LayerControls
                document={document}
                layer={selectedLayer}
                selectedCount={selection.layerIds.length}
                onDocumentChange={setActiveDocument}
              />
            </EditorPane>
          </EditorPaneLayout>
        </EditorPaneMain>

        <EditorPane
          rail={false}
          collapsible
          defaultCollapsed
          defaultSize={240}
          id={documentPaneId}
          label="Serialized document"
          maxSize={480}
          minSize={120}
          side="end"
        >
          <EditorPaneHeader title="Serialized document" />
          <EditorPaneContent>
            <pre className="m-0 rounded-md bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
              {JSON.stringify(serializeLayerEditorDocument(document), null, 2)}
            </pre>
          </EditorPaneContent>
        </EditorPane>
      </EditorPaneLayout>
    </main>
  );
}

function ShellMessage({ detail, title }: { detail?: string; title: string }) {
  return (
    <main className="grid h-dvh place-items-center bg-background p-4 text-foreground">
      <div className="grid gap-2 text-center">
        <h1 className="text-base font-semibold">{title}</h1>
        {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
      </div>
    </main>
  );
}
