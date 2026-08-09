import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Switch,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useEffect } from "react";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from "expo-location";
import {
  MapPin,
  Package,
  Clock,
  Settings,
  X,
  Filter,
  Search,
  Navigation,
  RefreshCw,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxesService } from "../../lib/boxes-service";
import { collectionsService } from "../../lib/collections-service";
import { useAuth } from "../../utils/auth";
import { useTheme } from "../../utils/theme";

export default function MapViewScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Estados locales
  const [selectedBox, setSelectedBox] = useState(null);
  const [filters, setFilters] = useState({
    showFull: true,
    showAlmostFull: true,
    showAvailable: true,
  });
  const [mapType, setMapType] = useState('standard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(null);

  // Fetch boxes
  const { data: boxesData, isLoading, refetch } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => boxesService.getAllBoxes(),
    enabled: isAuthenticated,
  });

  // Mutation para marcar caja como recolectada
  const collectBoxMutation = useMutation({
    mutationFn: ({ boxId, containersCollected }) => 
      collectionsService.createCollection(boxId, containersCollected),
    onSuccess: async () => {
      // Invalidar queries de cajas
      await queryClient.invalidateQueries({ queryKey: ["boxes"] });
      setSelectedBox(null);
      Alert.alert("Éxito", "Caja marcada como recolectada y vaciada");
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "No se pudo marcar la caja como recolectada");
      console.error(error);
    },
  });

  const handleCollectBox = () => {
    if (!selectedBox) return;

    Alert.alert(
      "Marcar como Recolectada",
      `¿Marcar "${selectedBox.name}" como recolectada?\n\nSe vaciará la caja (${selectedBox.current_containers} envases).`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            collectBoxMutation.mutate({
              boxId: selectedBox.id,
              containersCollected: selectedBox.current_containers,
            });
          },
        },
      ]
    );
  };

  const boxes = boxesData || [];

  // Validar y filtrar cajas con coordenadas válidas
  const validBoxes = boxes.filter(box => {
    if (!box || !box.id) return false;
    const lat = parseFloat(box.latitude);
    const lng = parseFloat(box.longitude);
    return !isNaN(lat) && !isNaN(lng) && 
           typeof box.current_containers !== 'undefined' && 
           typeof box.max_containers !== 'undefined';
  });

  // Filtrar cajas según filtros
  const filteredBoxes = validBoxes.filter(box => {
    const percentage = box.current_containers / box.max_containers;
    const isFull = percentage >= 1;
    const isAlmostFull = percentage >= 0.75 && percentage < 1;
    const isAvailable = percentage < 0.75;

    const matchesStatus = 
      (isFull && filters.showFull) ||
      (isAlmostFull && filters.showAlmostFull) ||
      (isAvailable && filters.showAvailable);

    const matchesSearch = 
      (!searchQuery || searchQuery.trim() === '') ||
      (box.name && box.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (box.description && box.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Calcular región del mapa
  const getMapRegion = () => {
    if (filteredBoxes.length === 0) {
      return {
        latitude: -34.6037,
        longitude: -58.3816,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const latitudes = filteredBoxes.map(box => parseFloat(box.latitude)).filter(lat => !isNaN(lat));
    const longitudes = filteredBoxes.map(box => parseFloat(box.longitude)).filter(lng => !isNaN(lng));
    
    if (latitudes.length === 0 || longitudes.length === 0) {
      return {
        latitude: -34.6037,
        longitude: -58.3816,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = Math.max(maxLat - minLat, 0.01) * 1.2;
    const deltaLng = Math.max(maxLng - minLng, 0.01) * 1.2;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  };

  // Obtener ubicación del usuario al montar
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          let currentLocation = await Location.getCurrentPositionAsync({});
          setCurrentRegion({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        } else {
          // Si no hay permiso, usar región calculada
          setCurrentRegion(getMapRegion());
        }
      } catch (error) {
        console.error('Error getting location:', error);
        // Si hay error, usar región calculada
        setCurrentRegion(getMapRegion());
      }
    })();
  }, []);

  // Actualizar región cuando cambian las cajas filtradas
  useEffect(() => {
    if (filteredBoxes.length > 0) {
      setCurrentRegion(getMapRegion());
    }
  }, [filteredBoxes.length]);

  if (!fontsLoaded) {
    return null;
  }

  const getBoxStatusColor = (box) => {
    const percentage = box.current_containers / box.max_containers;
    if (percentage >= 1) return "#EF4444";
    if (percentage >= 0.75) return "#F59E0B";
    return "#00B86C";
  };

  const getBoxStatusText = (box) => {
    const percentage = box.current_containers / box.max_containers;
    if (percentage >= 1) return "Llena";
    if (percentage >= 0.75) return "Casi Llena";
    return "Disponible";
  };


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
              Mapa de Cajas
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: 4,
              }}
            >
              {filteredBoxes.length} caja{filteredBoxes.length !== 1 ? "s" : ""} visible{filteredBoxes.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => router.back()}
            >
              <X size={20} color={isDark ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de búsqueda */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginTop: 16,
          }}
        >
          <Search size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
          <TextInput
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 16,
              fontFamily: "Inter_400Regular",
              color: isDark ? "#FFFFFF" : "#000000",
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar cajas..."
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          />
        </View>
      </View>

      {/* Mapa */}
      <View style={{ flex: 1 }}>
        {currentRegion && (
          <MapView
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            region={currentRegion}
            mapType={mapType}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {filteredBoxes.map((box) => {
              const latitude = parseFloat(box.latitude);
              const longitude = parseFloat(box.longitude);
              
              // Validar coordenadas antes de renderizar
              if (isNaN(latitude) || isNaN(longitude)) {
                return null;
              }

              return (
                <Marker
                  key={box.id}
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                  title={box.name || `Caja ${box.id}`}
                  description={`${box.current_containers}/${box.max_containers} envases`}
                  onPress={() => setSelectedBox(box)}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: getBoxStatusColor(box),
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 3,
                      borderColor: "#FFFFFF",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                    }}
                  >
                    <Package size={20} color="#FFFFFF" />
                  </View>
                </Marker>
              );
            })}
          </MapView>
        )}
      </View>

      {/* Panel de filtros */}
      {showFilters && (
        <View
          style={{
            position: "absolute",
            top: insets.top + 120,
            right: 20,
            backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: isDark ? "#333333" : "#E5E5E5",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            minWidth: 200,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 16,
            }}
          >
            Filtros
          </Text>

          {/* Mostrar cajas llenas */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#EF4444",
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Llenas
              </Text>
            </View>
            <Switch
              value={filters.showFull}
              onValueChange={(value) => setFilters(prev => ({ ...prev, showFull: value }))}
              trackColor={{ false: isDark ? "#333333" : "#E5E5E5", true: "#EF4444" }}
              thumbColor={filters.showFull ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>

          {/* Mostrar cajas casi llenas */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#F59E0B",
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Casi Llenas
              </Text>
            </View>
            <Switch
              value={filters.showAlmostFull}
              onValueChange={(value) => setFilters(prev => ({ ...prev, showAlmostFull: value }))}
              trackColor={{ false: isDark ? "#333333" : "#E5E5E5", true: "#F59E0B" }}
              thumbColor={filters.showAlmostFull ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>

          {/* Mostrar cajas disponibles */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#00B86C",
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Disponibles
              </Text>
            </View>
            <Switch
              value={filters.showAvailable}
              onValueChange={(value) => setFilters(prev => ({ ...prev, showAvailable: value }))}
              trackColor={{ false: isDark ? "#333333" : "#E5E5E5", true: "#00B86C" }}
              thumbColor={filters.showAvailable ? "#FFFFFF" : "#FFFFFF"}
            />
          </View>

          {/* Tipo de mapa */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_500Medium",
                color: isDark ? "#FFFFFF" : "#000000",
                marginBottom: 8,
              }}
            >
              Tipo de Mapa
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  backgroundColor: mapType === 'standard' 
                    ? "#00B86C" 
                    : (isDark ? "#2A2A2A" : "#F5F5F5"),
                  alignItems: "center",
                }}
                onPress={() => setMapType('standard')}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_500Medium",
                    color: mapType === 'standard' 
                      ? "#FFFFFF" 
                      : (isDark ? "#FFFFFF" : "#000000"),
                  }}
                >
                  Estándar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 6,
                  backgroundColor: mapType === 'satellite' 
                    ? "#00B86C" 
                    : (isDark ? "#2A2A2A" : "#F5F5F5"),
                  alignItems: "center",
                }}
                onPress={() => setMapType('satellite')}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "Inter_500Medium",
                    color: mapType === 'satellite' 
                      ? "#FFFFFF" 
                      : (isDark ? "#FFFFFF" : "#000000"),
                  }}
                >
                  Satélite
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Modal de detalles de caja */}
      {selectedBox && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedBox(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              justifyContent: "flex-end",
            }}
          >
            <View
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: 20,
                paddingBottom: insets.bottom + 20,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 4,
                  backgroundColor: isDark ? "#333333" : "#E5E5E5",
                  borderRadius: 2,
                  alignSelf: "center",
                  marginBottom: 20,
                }}
              />

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: getBoxStatusColor(selectedBox),
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  <Package size={24} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                      marginBottom: 4,
                    }}
                  >
                    {selectedBox.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_400Regular",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    {getBoxStatusText(selectedBox)}
                  </Text>
                </View>
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: isDark ? "#FFFFFF" : "#000000",
                    marginBottom: 8,
                  }}
                >
                  Información
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    lineHeight: 20,
                  }}
                >
                  {selectedBox.description || "Sin descripción"}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: isDark ? "#2A2A2A" : "#F8F9FA",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Envases actuales
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    {selectedBox.current_containers}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Capacidad máxima
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    {selectedBox.max_containers}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                    }}
                  >
                    Porcentaje de llenado
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_600SemiBold",
                      color: getBoxStatusColor(selectedBox),
                    }}
                  >
                    {Math.round((selectedBox.current_containers / selectedBox.max_containers) * 100)}%
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                  }}
                  onPress={() => setSelectedBox(null)}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_600SemiBold",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    Cerrar
                  </Text>
                </TouchableOpacity>
                {selectedBox.current_containers > 0 ? (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: "#00B86C",
                      borderRadius: 12,
                      padding: 16,
                      alignItems: "center",
                    }}
                    onPress={handleCollectBox}
                    disabled={collectBoxMutation.isPending}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_600SemiBold",
                        color: "#FFFFFF",
                      }}
                    >
                      {collectBoxMutation.isPending ? "Procesando..." : "Recolectar"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: isDark ? "#2A2A2A" : "#F5F5F5",
                      borderRadius: 12,
                      padding: 16,
                      alignItems: "center",
                      opacity: 0.5,
                    }}
                    disabled={true}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_600SemiBold",
                        color: isDark ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      Vacía
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
