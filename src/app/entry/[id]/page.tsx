type Props = {
  params: Promise<{ id: string }>;
};

export default async function EntryPage({ params }: Props) {
  const { id } = await params;
  return <h1 className="text-2xl font-bold">Entry: {id}</h1>;
}
