import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { ReportWizard } from "@/components/reports/ReportWizard";

export const Route = createFileRoute("/app/indication/$id/reports")({
  component: ReportsTab,
});

function ReportsTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="reports">
      <ReportWizard indicationId={id} />
    </IndicationLayout>
  );
}
