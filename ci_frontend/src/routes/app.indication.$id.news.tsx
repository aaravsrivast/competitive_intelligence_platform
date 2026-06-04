import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listNews } from "@/api/news";
import { getIndication } from "@/api/therapeuticAreas";
import { IndicationLayout } from "@/components/indication/IndicationLayout";
import { ArticleListDetail } from "@/components/articles/ArticleListDetail";

export const Route = createFileRoute("/app/indication/$id/news")({
  component: NewsTab,
});

function NewsTab() {
  const { id } = Route.useParams();
  const indQuery = useQuery({ queryKey: ["indication", id], queryFn: () => getIndication(id) });
  const articlesQuery = useQuery({ queryKey: ["news", id], queryFn: () => listNews(id) });

  return (
    <IndicationLayout indication={indQuery.data} indicationId={id} activeTabId="news">
      <ArticleListDetail
        indicationId={id}
        tabKey="news"
        articles={articlesQuery.data ?? []}
        isLoading={articlesQuery.isLoading}
      />
    </IndicationLayout>
  );
}
