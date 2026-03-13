import { PublicGamePage } from "@/components/game/public-game-page";

export default async function GameRoute({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;

  return <PublicGamePage joinCode={joinCode.toUpperCase()} />;
}
