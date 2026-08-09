import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Map, Package, BarChart3, Settings } from "lucide-react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: isDark ? "#333333" : "#EAEAEA",
        },
        tabBarActiveTintColor: "#00B86C",
        tabBarInactiveTintColor: isDark ? "#9CA3AF" : "#9B9B9B",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Map color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="boxes"
        options={{
          title: "Cajas",
          tabBarIcon: ({ color, size }) => <Package color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Estadísticas",
          tabBarIcon: ({ color, size }) => (
            <BarChart3 color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Configuración",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
