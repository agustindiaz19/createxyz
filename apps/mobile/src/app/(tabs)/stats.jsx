import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Package, MapPin, TrendingUp, Recycle } from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useQuery } from "@tanstack/react-query";
import { boxesService } from "../../lib/boxes-service";
import { useAuth } from "../../utils/auth";

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { isAuthenticated } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Fetch boxes for statistics
  const {
    data: boxesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => boxesService.getAllBoxes(),
    enabled: isAuthenticated, // Solo ejecutar si está autenticado
  });

  if (!fontsLoaded) {
    return null;
  }

  const boxes = boxesData?.boxes || [];

  // Calculate statistics
  const totalBoxes = boxes.length;
  const totalContainers = boxes.reduce(
    (sum, box) => sum + box.current_containers,
    0
  );
  const totalCapacity = boxes.reduce((sum, box) => sum + box.max_containers, 0);
  const fullBoxes = boxes.filter(
    (box) => box.current_containers >= box.max_containers
  ).length;
  const almostFullBoxes = boxes.filter(
    (box) =>
      box.current_containers / box.max_containers >= 0.75 &&
      box.current_containers < box.max_containers
  ).length;
  const averageFillPercentage =
    totalCapacity > 0 ? (totalContainers / totalCapacity) * 100 : 0;

  const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <View
      style={{
        backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: isDark ? "#333333" : "#E5E5E5",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontFamily: "Inter_500Medium",
              color: isDark ? "#9CA3AF" : "#6B7280",
              marginBottom: 4,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: 32,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 4,
            }}
          >
            {value}
          </Text>
          {subtitle && (
            <Text
              style={{
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
              }}
            >
              {subtitle}
            </Text>
          )}
        </View>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: `${color}20`,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Icon size={24} color={color} />
        </View>
      </View>
    </View>
  );

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
        <Text
          style={{
            fontSize: 28,
            fontFamily: "Inter_600SemiBold",
            color: isDark ? "#FFFFFF" : "#000000",
          }}
        >
          Estadísticas de Recolección
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginTop: 4,
          }}
        >
          Rastrea tu impacto de reciclaje
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={isDark ? "#FFFFFF" : "#000000"}
          />
        }
      >
        {totalBoxes === 0 ? (
          /* Empty State */
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingVertical: 60,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDark ? "#1E3A3A" : "#E6F4F1",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <TrendingUp size={32} color="#00B86C" />
            </View>

            <Text
              style={{
                fontSize: 20,
                fontFamily: "Inter_600SemiBold",
                color: isDark ? "#FFFFFF" : "#000000",
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              Sin Datos Aún
            </Text>

            <Text
              style={{
                fontSize: 16,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
                textAlign: "center",
                lineHeight: 24,
                paddingHorizontal: 40,
              }}
            >
              Agrega algunas cajas de recolección para ver tus estadísticas de reciclaje
            </Text>
          </View>
        ) : (
          /* Statistics */
          <View>
            {/* Overview Cards */}
            <StatCard
              title="Total de Cajas"
              value={totalBoxes}
              subtitle="Puntos de recolección creados"
              icon={Package}
              color="#00B86C"
            />

            <StatCard
              title="Envases Recolectados"
              value={totalContainers}
              subtitle={`De ${totalCapacity} capacidad total`}
              icon={Recycle}
              color="#3B82F6"
            />

            <StatCard
              title="Tasa de Llenado Promedio"
              value={`${averageFillPercentage.toFixed(1)}%`}
              subtitle="En todas las cajas de recolección"
              icon={TrendingUp}
              color="#8B5CF6"
            />

            {/* Status Breakdown */}
            <View
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: isDark ? "#333333" : "#E5E5E5",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                  marginBottom: 16,
                }}
              >
                Desglose del Estado de las Cajas
              </Text>

              <View style={{ gap: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#EF4444",
                        marginRight: 12,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_500Medium",
                        color: isDark ? "#FFFFFF" : "#000000",
                      }}
                    >
                      Cajas Llenas
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    {fullBoxes}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#F59E0B",
                        marginRight: 12,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_500Medium",
                        color: isDark ? "#FFFFFF" : "#000000",
                      }}
                    >
                      Casi Llenas
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    {almostFullBoxes}
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 8,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#00B86C",
                        marginRight: 12,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_500Medium",
                        color: isDark ? "#FFFFFF" : "#000000",
                      }}
                    >
                      Disponibles
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    {totalBoxes - fullBoxes - almostFullBoxes}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: isDark ? "#333333" : "#E5E5E5",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                  marginBottom: 16,
                }}
              >
                Resumen de Impacto
              </Text>

              <View
                style={{
                  padding: 16,
                  backgroundColor: isDark ? "#0F3F3F" : "#E6F7FF",
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: "#00B86C",
                    marginBottom: 4,
                  }}
                >
                  Impacto Ambiental Total
                </Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Inter_600SemiBold",
                    color: isDark ? "#FFFFFF" : "#000000",
                    marginBottom: 4,
                  }}
                >
                  {totalContainers} Envases
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Recolectados para reciclaje
                </Text>
              </View>

              {fullBoxes > 0 && (
                <View
                  style={{
                    padding: 16,
                    backgroundColor: isDark ? "#3F1F1F" : "#FFF1F0",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#EF4444",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: "#EF4444",
                      marginBottom: 4,
                    }}
                  >
                    Acción Requerida
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                      marginBottom: 4,
                    }}
                  >
                    {fullBoxes} caja{fullBoxes !== 1 ? "s" : ""} lista{fullBoxes !== 1 ? "s" : ""} para
                    recolección
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Considera llevarlas a un punto de reciclaje
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}