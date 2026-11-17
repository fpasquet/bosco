import { SessionPage } from './session-page';

export default async function SessionRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionPage id={id} />;
}
