import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { CompetitorsGrid } from "@/components/competitors/CompetitorsGrid";

export const Route = createFileRoute("/app/indication/$id/competitors")({
  component: CompetitorsTab,
});

function CompetitorsTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="competitors">
      <CompetitorsGrid />
    </IndicationLayout>
  );
}
