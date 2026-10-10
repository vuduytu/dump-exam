import { TopBar } from "@/components/top-bar";

// Every page is dynamic: without this, a click shows nothing until the server finishes rendering.
export default function Loading() {
  return <TopBar />;
}
