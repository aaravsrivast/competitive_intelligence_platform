import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { KanbanBoard } from "@/components/cl/KanbanBoard";

export const Route = createFileRoute("/app/indication/$id/competitive-landscape")({
  component: CLTab,
});

function CLTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="competitive-landscape">
      <KanbanBoard indicationId={id} />
    </IndicationLayout>
  );
}
