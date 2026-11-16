import Link from "next/link";
import { AuthHeading } from "../auth-ui";

// LinkedIn-connected view for existing users who reconnect from Settings.
// Not rendered by any route at the moment.
export default function StepLinkedInConnected() {
  return (
    <div className="w-full">
      <AuthHeading
        title="LinkedIn connected"
        subtitle="Your account is linked. Omentir can now find your potential customers and contact them."
      />
      <Link href="/overview" className="auth-btn">
        Go to main app
      </Link>
    </div>
  );
}
