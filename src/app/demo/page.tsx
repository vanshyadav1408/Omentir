import { redirect } from "next/navigation";

import { DEMO_BOOKING_URL } from "../demo-booking-url";

export default function DemoPage() {
  redirect(DEMO_BOOKING_URL);
}
