import { redirect } from "next/navigation";

// Static prototype lives at public/demo/index.html — route it cleanly.
export default function DemoRedirect() {
  redirect("/demo/index.html");
}
