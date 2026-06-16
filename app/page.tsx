import { Workbench } from "@/components/workbench";
import { getKnowledgeAssets } from "@/lib/assets-store";

export default async function Home() {
  const assets = await getKnowledgeAssets();

  return <Workbench initialAssets={assets} />;
}
