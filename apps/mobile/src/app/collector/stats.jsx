import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  BarChart3,
  Package,
  TrendingUp,
  Calendar,
  X,
  Clock,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useQuery } from "@tanstack/react-query";
import { collectionsService } from "../../lib/collections-service";
import { useAuth } from "../../utils/auth";
import { useTheme } from "../../utils/theme";
import { supabase } from "../../lib/supabase";

export default function CollectorStatsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Get current user ID
  const { data: userData } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    enabled: isAuthenticated,
  });

  // Fetch statistics
  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ["collectionStats", userData?.id],
    queryFn: () => collectionsService.getStatistics(userData?.id),
    enabled: isAuthenticated && !!userData?.id,
  });

  // Fetch recent collections
  const { data: recentCollections, isLoading: isLoadingCollections } = useQuery({
    queryKey: ["recentCollections", userData?.id],
    queryFn: () => collectionsService.getCollectionsByCollector(userData?.id),
    enabled: isAuthenticated && !!userData?.id,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  const statistics = stats || {
    totalCollections: 0,
    totalContainers: 0,
    todayCollections: 0,
    todayContainers: 0,
    last7DaysCollections: 0,
  };

  const recent = recentCollections || [];

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
              Reportes
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: 4,
              }}
            >
              Estadísticas de recolección
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
            onPress={() => router.back()}
          >
            <X size={20} color={isDark ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estadísticas Principales */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 16,
            }}
          >
            Resumen General
          </Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            {/* Total Recolecciones */}
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
                <BarChart3 size={20} color="#00B86C" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Total
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                {statistics.totalCollections}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  marginTop: 4,
                }}
              >
                recolecciones
              </Text>
            </View>

            {/* Total Envases */}
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
                <Package size={20} color="#3B82F6" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Envases
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Inter_600SemiBold",
                  color: "#3B82F6",
                }}
              >
                {statistics.totalContainers}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  marginTop: 4,
                }}
              >
                recolectados
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* Hoy */}
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
                <Calendar size={20} color="#F59E0B" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Hoy
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Inter_600SemiBold",
                  color: "#F59E0B",
                }}
              >
                {statistics.todayCollections}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  marginTop: 4,
                }}
              >
                {statistics.todayContainers} envases
              </Text>
            </View>

            {/* Últimos 7 días */}
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
                <TrendingUp size={20} color="#8B5CF6" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  7 días
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontFamily: "Inter_600SemiBold",
                  color: "#8B5CF6",
                }}
              >
                {statistics.last7DaysCollections}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  marginTop: 4,
                }}
              >
                recolecciones
              </Text>
            </View>
          </View>
        </View>

        {/* Recolecciones Recientes */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 16,
            }}
          >
            Recolecciones Recientes
          </Text>

          {isLoadingCollections ? (
            <View
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#333333" : "#E5E5E5",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                }}
              >
                Cargando...
              </Text>
            </View>
          ) : recent.length === 0 ? (
            <View
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                borderRadius: 12,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: isDark ? "#333333" : "#E5E5E5",
              }}
            >
              <Package size={32} color={isDark ? "#9CA3AF" : "#6B7280"} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                  marginTop: 12,
                  marginBottom: 4,
                }}
              >
                Sin recolecciones
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#9CA3AF" : "#6B7280",
                  textAlign: "center",
                }}
              >
                Las recolecciones que realices aparecerán aquí
              </Text>
            </View>
          ) : (
            recent.slice(0, 10).map((collection) => {
              const box = collection.boxes;
              const date = new Date(collection.collected_at);
              const formattedDate = date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View
                  key={collection.id}
                  style={{
                    backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isDark ? "#333333" : "#E5E5E5",
                  }}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontFamily: "Inter_600SemiBold",
                          color: isDark ? "#FFFFFF" : "#000000",
                          marginBottom: 4,
                        }}
                      >
                        {box?.name || `Caja ${collection.box_id.slice(0, 8)}`}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <Clock size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 12,
                            fontFamily: "Inter_400Regular",
                            color: isDark ? "#9CA3AF" : "#6B7280",
                          }}
                        >
                          {formattedDate}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 16 }}>
                        <View>
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: "Inter_500Medium",
                              color: isDark ? "#9CA3AF" : "#6B7280",
                            }}
                          >
                            Recolectados
                          </Text>
                          <Text
                            style={{
                              fontSize: 16,
                              fontFamily: "Inter_600SemiBold",
                              color: "#00B86C",
                            }}
                          >
                            {collection.containers_collected}
                          </Text>
                        </View>
                        <View>
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: "Inter_500Medium",
                              color: isDark ? "#9CA3AF" : "#6B7280",
                            }}
                          >
                            Antes
                          </Text>
                          <Text
                            style={{
                              fontSize: 16,
                              fontFamily: "Inter_600SemiBold",
                              color: isDark ? "#FFFFFF" : "#000000",
                            }}
                          >
                            {collection.containers_before}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

