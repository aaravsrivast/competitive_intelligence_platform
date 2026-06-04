import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listPublications } from "@/api/news";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { ArticleListDetail } from "@/components/articles/ArticleListDetail";

export const Route = createFileRoute("/app/indication/$id/publications")({
  component: PublicationsTab,
});

function PublicationsTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  const articlesQuery = useQuery({ queryKey: ["publications", id], queryFn: () => listPublications(id) });

  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="publications">
      <ArticleListDetail
        indicationId={id}
        tabKey="publications"
        articles={articlesQuery.data ?? []}
        isLoading={articlesQuery.isLoading}
      />
    </IndicationLayout>
  );
}
