import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { TrialsTable } from "@/components/trials/TrialsTable";

export const Route = createFileRoute("/app/indication/$id/clinical-trials")({
  component: ClinicalTrialsTab,
});

function ClinicalTrialsTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="clinical-trials">
      <TrialsTable indicationId={id} />
    </IndicationLayout>
  );
}
