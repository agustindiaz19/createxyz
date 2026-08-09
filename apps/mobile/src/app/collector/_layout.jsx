import { Stack } from 'expo-router';
import { useUserRole } from '../../utils/useUserRole';

export default function CollectorLayout() {
  const { role } = useUserRole();

  // Si el usuario no es collector, redirigir
  if (role !== 'collector') {
    return null; // El index.jsx se encargará de la redirección
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="routes" />
      <Stack.Screen name="route-optimizer" />
      <Stack.Screen name="map-view" />
      <Stack.Screen name="map" />
      <Stack.Screen name="boxes" />
      <Stack.Screen name="stats" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
