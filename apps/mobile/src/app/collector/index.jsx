import { Redirect } from "expo-router";

export default function CollectorIndex() {
  // Redirigir a la pantalla principal de collector (routes)
  return <Redirect href="/collector/routes" />;
}
