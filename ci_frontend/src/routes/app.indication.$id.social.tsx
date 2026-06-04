import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listSocial } from "@/api/news";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { ArticleListDetail } from "@/components/articles/ArticleListDetail";

export const Route = createFileRoute("/app/indication/$id/social")({
  component: SocialTab,
});

function SocialTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  const articlesQuery = useQuery({ queryKey: ["social", id], queryFn: () => listSocial(id) });

  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="social">
      <ArticleListDetail
        indicationId={id}
        tabKey="social"
        articles={articlesQuery.data ?? []}
        isLoading={articlesQuery.isLoading}
      />
    </IndicationLayout>
  );
}
