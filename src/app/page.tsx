import Intake from "@/components/intake";

// Hostinger's CDN otherwise keeps the statically generated shell for up to a
// year, which can leave it pointing at assets from an earlier deployment.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return <Intake />;
}
