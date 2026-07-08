import Canvas from "@/components/studio/Canvas";

export default async function StudioPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <Canvas studioId={resolvedParams.id} />;
}
