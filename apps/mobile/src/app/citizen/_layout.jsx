import { Tabs } from 'expo-router';
import { useUserRole } from '../../utils/useUserRole';
import { MapPin, Package, BarChart3, Settings } from 'lucide-react-native';
import { useTheme } from '../../utils/theme';

export default function CitizenLayout() {
  const { role } = useUserRole();
  const { isDark } = useTheme();

  // Si el usuario no es citizen, redirigir
  if (role !== 'citizen') {
    return null; // El index.jsx se encargará de la redirección
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderTopColor: isDark ? '#333333' : '#E5E5E5',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00B86C',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter_500Medium',
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
        initialParams={{ initialRoute: true }}
      />
      <Tabs.Screen
        name="boxes"
        options={{
          title: 'Cajas',
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Estadísticas',
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Configuración',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
