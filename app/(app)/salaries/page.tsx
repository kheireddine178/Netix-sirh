import { listerSalariesPaginated } from "./actions";
import SalariesViewClient from "./salaries-view-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function SalariesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const search = query.search || "";
  const status = query.status || "active";
  const page = parseInt(query.page || "1", 10);
  const limit = 20;

  const { salaries, totalCount } = await listerSalariesPaginated({
    search,
    actifOnly: status === "active",
    page,
    limit,
  });

  return (
    <SalariesViewClient
      salaries={salaries}
      totalCount={totalCount}
      page={page}
      limit={limit}
      search={search}
      status={status}
    />
  );
}
