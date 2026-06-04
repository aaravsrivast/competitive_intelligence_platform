import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { Timeline } from "@/components/timeline/Timeline";

export const Route = createFileRoute("/app/indication/$id/timelines")({
  component: TimelinesTab,
});

function TimelinesTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="timelines">
      <Timeline indicationId={id} />
    </IndicationLayout>
  );
}
