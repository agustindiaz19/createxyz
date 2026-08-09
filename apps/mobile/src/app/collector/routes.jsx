import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    useColorScheme,
    ScrollView,
  } from "react-native";
  import { useSafeAreaInsets } from "react-native-safe-area-context";
  import { StatusBar } from "expo-status-bar";
  import { useState, useEffect } from "react";
  import { Route, Truck, MapPin, Clock, Package, Settings, BarChart3 } from "lucide-react-native";
  import { useRouter } from "expo-router";
  import {
    useFonts,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  } from "@expo-google-fonts/inter";
  import { useQuery } from "@tanstack/react-query";
  import { boxesService } from "../../lib/boxes-service";
  import { useAuth } from "../../utils/auth";
  import { useTheme } from "../../utils/theme";
  
  export default function CollectorRoutesScreen() {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const { isAuthenticated } = useAuth();
    const router = useRouter();
  
    const [fontsLoaded] = useFonts({
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
    });
  
    // Fetch boxes para mostrar estadísticas
    const { data: boxesData, isLoading } = useQuery({
      queryKey: ["boxes"],
      queryFn: () => boxesService.getAllBoxes(),
      enabled: isAuthenticated,
      staleTime: 0,
      cacheTime: 5 * 60 * 1000,
      refetchOnWindowFocus: true,
    });

    const boxes = boxesData || [];
    
    // Calcular estadísticas
    const totalBoxes = boxes.length;
    const fullBoxes = boxes.filter(box => (box.current_containers / box.max_containers) >= 1).length;
    const almostFullBoxes = boxes.filter(box => {
      const percentage = (box.current_containers / box.max_containers);
      return percentage >= 0.75 && percentage < 1;
    }).length;
    const availableBoxes = boxes.filter(box => (box.current_containers / box.max_containers) < 0.75).length;
  
    if (!fontsLoaded) {
      return null;
    }
  
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? "#121212" : "#FFFFFF" }}>
        <StatusBar style={isDark ? "light" : "dark"} />
  
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 16,
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: isDark ? "#121212" : "#FFFFFF",
            borderBottomWidth: 1,
            borderBottomColor: isDark ? "#333333" : "#F0F0F0",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Rutas de Recolección
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  marginTop: 4,
                }}
              >
                Optimiza tus rutas de recolección
              </Text>
            </View>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 16,
              }}
              onPress={() => router.push("/collector/settings")}
            >
              <Settings size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>
        </View>
  
        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Cards */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: isDark ? "#FFFFFF" : "#000000",
                marginBottom: 16,
              }}
            >
              Estado de las Cajas
            </Text>
            
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              {/* Total Boxes */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#333333" : "#E5E5E5",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Package size={20} color="#00B86C" />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Total Cajas
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Inter_600SemiBold",
                    color: isDark ? "#FFFFFF" : "#000000",
                  }}
                >
                  {totalBoxes}
                </Text>
              </View>
  
              {/* Full Boxes */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#333333" : "#E5E5E5",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Package size={20} color="#EF4444" />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Llenas
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Inter_600SemiBold",
                    color: "#EF4444",
                  }}
                >
                  {fullBoxes}
                </Text>
              </View>
            </View>
  
            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Almost Full Boxes */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#333333" : "#E5E5E5",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Package size={20} color="#F59E0B" />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Casi Llenas
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Inter_600SemiBold",
                    color: "#F59E0B",
                  }}
                >
                  {almostFullBoxes}
                </Text>
              </View>
  
              {/* Available Boxes */}
              <View
                style={{
                  flex: 1,
                  backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#333333" : "#E5E5E5",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Package size={20} color="#00B86C" />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Disponibles
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Inter_600SemiBold",
                    color: "#00B86C",
                  }}
                >
                  {availableBoxes}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: isDark ? "#FFFFFF" : "#000000",
                marginBottom: 16,
              }}
            >
              Acciones Rápidas
            </Text>
  
            {/* Optimize Route Button */}
            <TouchableOpacity
              style={{
                backgroundColor: "#00B86C",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
              }}
              onPress={() => router.push("/collector/route-optimizer")}
            >
              <Route size={24} color="#FFFFFF" />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: "#FFFFFF",
                    marginBottom: 2,
                  }}
                >
                  Optimizar Ruta
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: "#FFFFFF",
                    opacity: 0.8,
                  }}
                >
                  Crear ruta eficiente para recolección
                </Text>
              </View>
            </TouchableOpacity>
  
            {/* View Map Button */}
            <TouchableOpacity
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#333333" : "#E5E5E5",
                marginBottom: 12,
              }}
              onPress={() => router.push("/collector/map-view")}
            >
              <MapPin size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: isDark ? "#FFFFFF" : "#000000",
                    marginBottom: 2,
                  }}
                >
                  Ver Mapa
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Ver todas las cajas en el mapa
                </Text>
              </View>
            </TouchableOpacity>

            {/* View Stats Button */}
            <TouchableOpacity
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#333333" : "#E5E5E5",
              }}
              onPress={() => router.push("/collector/stats")}
            >
              <Clock size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: isDark ? "#FFFFFF" : "#000000",
                    marginBottom: 2,
                  }}
                >
                  Ver Reportes
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Estadísticas de recolección
                </Text>
              </View>
            </TouchableOpacity>
          </View>
  
          {/* Priority Boxes */}
          {fullBoxes > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                  marginBottom: 16,
                }}
              >
                Cajas Prioritarias
              </Text>
              
              <View
                style={{
                  backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#EF4444",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Package size={20} color="#EF4444" />
                  <Text
                    style={{
                      marginLeft: 8,
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: "#EF4444",
                    }}
                  >
                    {fullBoxes} Cajas Llenas
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    lineHeight: 20,
                  }}
                >
                  Estas cajas necesitan recolección inmediata. Considera incluirlas en tu próxima ruta.
                </Text>
              </View>
            </View>
          )}

          {/* Coming Soon */}
          <View
            style={{
              backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
              borderRadius: 12,
              padding: 20,
              borderWidth: 1,
              borderColor: isDark ? "#333333" : "#E5E5E5",
              alignItems: "center",
            }}
          >
            <Truck size={32} color={isDark ? "#9CA3AF" : "#6B7280"} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: "Inter_600SemiBold",
                color: isDark ? "#FFFFFF" : "#000000",
                marginTop: 12,
                marginBottom: 8,
              }}
            >
              Funcionalidades Próximas
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              • Rutas optimizadas con IA{'\n'}
              • Navegación paso a paso{'\n'}
              • Tracking en tiempo real{'\n'}
              • Reportes de recolección
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }
  