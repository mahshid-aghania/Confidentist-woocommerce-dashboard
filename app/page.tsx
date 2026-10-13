import { redirect } from "next/navigation";

// The Dashboard overview tab was retired. The app now opens on the WooCommerce
// Orders screen. (Previous dashboard UI remains in git history if needed.)
export default function Home() {
  redirect("/wc-orders");
}
