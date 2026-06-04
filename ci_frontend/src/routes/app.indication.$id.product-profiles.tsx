import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { ProductProfilePane } from "@/components/profile/ProductProfilePane";

export const Route = createFileRoute("/app/indication/$id/product-profiles")({
  component: ProductProfileTab,
});

function ProductProfileTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="product-profiles">
      <ProductProfilePane indicationId={id} />
    </IndicationLayout>
  );
}
