import { CreditCard, Settings, ShieldCheck } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import ListRow from "../../components/ui/ListRow";

export default function MorePage({ navigate }) {
  return (
    <>
      <PageHeader title="More" />
      <div className="page-body">
        <div className="card card-list">
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
        </div>
        <div className="card card-list">
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
