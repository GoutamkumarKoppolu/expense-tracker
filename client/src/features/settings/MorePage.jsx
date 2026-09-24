import { CreditCard, DatabaseBackup, Palette, Settings, ShieldCheck, Tags } from "lucide-react";
import { useTheme } from "../../theme/useTheme";
import { ACCENTS, BACKGROUNDS } from "../../theme/palettes";
import PageHeader from "../../components/ui/PageHeader";
import ListRow from "../../components/ui/ListRow";

export default function MorePage({ navigate }) {
  const { theme } = useTheme();
  const label = (list, id) => list.find((x) => x.id === id).label;

  return (
    <>
      <PageHeader title="More" />
      <div className="page-body">
        <div className="card card-list">
          <ListRow
            icon={Tags}
            tone="positive"
            title="Tags"
            subtitle="Every tag across months, e.g. a trip or a loan"
            onClick={() => navigate("tags")}
          />
          <ListRow
            icon={CreditCard}
            tone="warning"
            title="Credit cards"
            subtitle="Log card spend separately from your balance"
            onClick={() => navigate("cards")}
          />
          <ListRow
            icon={Settings}
            title="Manage options"
            subtitle="Transaction types, payment methods and sources"
            onClick={() => navigate("settings")}
          />
          <ListRow
            icon={Palette}
            tone="savings"
            title="Appearance"
            subtitle={`${label(BACKGROUNDS, theme.background)} background · ${label(ACCENTS, theme.accent)}`}
            onClick={() => navigate("appearance")}
          />
        </div>
        <div className="card card-list">
          <ListRow
            icon={DatabaseBackup}
            tone="warning"
            title="Backup & restore"
            subtitle="Export your data to a file, or import it on a new install"
            onClick={() => navigate("backup")}
          />
          <ListRow
            icon={ShieldCheck}
            tone="positive"
            title="Stored on this device"
            subtitle="Works offline. Nothing is sent to a server."
          />
        </div>
      </div>
    </>
  );
}
