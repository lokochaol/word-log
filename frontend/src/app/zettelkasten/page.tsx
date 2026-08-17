import * as permanentNotes from "@/lib/permanentNotes";
import * as quickNotes from "@/lib/quickNotes";
import * as indexEntries from "@/lib/indexEntries";
import { requireOwnerSub } from "@/lib/session";
import { ZettelkastenScreen } from "@/components/ZettelkastenScreen";

export default async function ZettelkastenPage(props: PageProps<"/zettelkasten">) {
  const params = await props.searchParams;
  const openId = typeof params.open === "string" ? params.open : undefined;

  const ownerSub = await requireOwnerSub();
  const [globalOrder, activeQuickNotes, entries] = await Promise.all([
    permanentNotes.getGlobalOrder(ownerSub),
    quickNotes.listActive(ownerSub),
    indexEntries.list(ownerSub),
  ]);

  return (
    <ZettelkastenScreen
      initialGlobalOrder={globalOrder}
      initialActiveQuickNotes={activeQuickNotes}
      initialIndexEntries={entries}
      deepLinkOpenId={openId}
    />
  );
}
