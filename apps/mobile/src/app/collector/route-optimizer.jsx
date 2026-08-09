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
import {
  Route,
  MapPin,
  Clock,
  Package,
  Settings,
  X,
  Check,
  RefreshCw,
  Navigation,
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
import { routesService } from "../../lib/routes-service";
import { collectionsService } from "../../lib/collections-service";
import { useAuth } from "../../utils/auth";
import { useTheme } from "../../utils/theme";
import * as Location from "expo-location";

export default function RouteOptimizerScreen() {
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
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [optimizedRoute, setOptimizedRoute] = useState([]);
  const [optimizationOptions, setOptimizationOptions] = useState({
    prioritizeFull: true,
    prioritizeAlmostFull: true,
    maxDistance: 50,
    algorithm: 'nearest'
  });
  const [routeName, setRouteName] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [collectedBoxes, setCollectedBoxes] = useState(new Set());

  // Mutation para marcar caja como recolectada
  const collectBoxMutation = useMutation({
    mutationFn: ({ boxId, containersCollected }) => 
      collectionsService.createCollection(boxId, containersCollected),
    onSuccess: async (data, variables) => {
      // Invalidar queries de cajas y recolecciones
      await queryClient.invalidateQueries({ queryKey: ["boxes"] });
      
      // Marcar la caja como recolectada en el estado local
      setCollectedBoxes(prev => new Set([...prev, variables.boxId]));
      
      // Actualizar la ruta optimizada para reflejar que la caja está vacía
      setOptimizedRoute(prev => 
        prev.map(box => 
          box.id === variables.boxId 
            ? { ...box, current_containers: 0 }
            : box
        )
      );
      
      Alert.alert("Éxito", "Caja marcada como recolectada y vaciada");
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "No se pudo marcar la caja como recolectada");
      console.error(error);
    },
  });

  const handleCollectBox = (box) => {
    Alert.alert(
      "Marcar como Recolectada",
      `¿Marcar "${box.name}" como recolectada?\n\nSe vaciará la caja (${box.current_containers} envases).`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            collectBoxMutation.mutate({
              boxId: box.id,
              containersCollected: box.current_containers,
            });
          },
        },
      ]
    );
  };

  // Fetch boxes
  const { data: boxesData, isLoading } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => boxesService.getAllBoxes(),
    enabled: isAuthenticated,
  });

  const boxes = boxesData || [];

  // Obtener ubicación del usuario
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          let location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.error('Error getting user location:', error);
      }
    })();
  }, []);

  // Categorizar cajas
  const fullBoxes = boxes.filter(box => (box.current_containers / box.max_containers) >= 1);
  const almostFullBoxes = boxes.filter(box => {
    const percentage = (box.current_containers / box.max_containers);
    return percentage >= 0.75 && percentage < 1;
  });
  const availableBoxes = boxes.filter(box => (box.current_containers / box.max_containers) < 0.75);

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distancia en kilómetros
  };

  // Algoritmo de optimización: Vecino más cercano
  const optimizeNearestNeighbor = (boxesToOptimize, startLocation) => {
    if (boxesToOptimize.length === 0) return [];

    const optimized = [];
    const remaining = [...boxesToOptimize];
    let currentLocation = startLocation;

    // Si no hay ubicación del usuario, usar la primera caja como punto de partida
    if (!currentLocation && remaining.length > 0) {
      currentLocation = {
        latitude: parseFloat(remaining[0].latitude),
        longitude: parseFloat(remaining[0].longitude),
      };
    }

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      // Encontrar la caja más cercana
      for (let i = 0; i < remaining.length; i++) {
        const box = remaining[i];
        const boxLat = parseFloat(box.latitude);
        const boxLng = parseFloat(box.longitude);

        if (isNaN(boxLat) || isNaN(boxLng)) continue;

        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          boxLat,
          boxLng
        );

        // Aplicar filtro de distancia máxima si está configurado
        if (optimizationOptions.maxDistance && distance > optimizationOptions.maxDistance) {
          continue;
        }

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      // Si no se encontró ninguna caja dentro del rango, terminar
      if (nearestDistance === Infinity) break;

      const nearestBox = remaining.splice(nearestIndex, 1)[0];
      optimized.push({
        ...nearestBox,
        order: optimized.length + 1,
        distance: nearestDistance,
      });

      // Actualizar ubicación actual
      currentLocation = {
        latitude: parseFloat(nearestBox.latitude),
        longitude: parseFloat(nearestBox.longitude),
      };
    }

    return optimized;
  };

  // Algoritmo de optimización: Priorizar por estado (llenas primero, luego casi llenas)
  const optimizeByPriority = (boxesToOptimize, startLocation) => {
    if (boxesToOptimize.length === 0) return [];

    // Separar cajas por prioridad
    const full = boxesToOptimize.filter(box => {
      const percentage = box.current_containers / box.max_containers;
      return percentage >= 1;
    });
    const almostFull = boxesToOptimize.filter(box => {
      const percentage = box.current_containers / box.max_containers;
      return percentage >= 0.75 && percentage < 1;
    });
    const available = boxesToOptimize.filter(box => {
      const percentage = box.current_containers / box.max_containers;
      return percentage < 0.75;
    });

    const optimized = [];
    let currentLocation = startLocation;

    // Si no hay ubicación del usuario, usar la primera caja como punto de partida
    if (!currentLocation && boxesToOptimize.length > 0) {
      const firstBox = boxesToOptimize[0];
      currentLocation = {
        latitude: parseFloat(firstBox.latitude),
        longitude: parseFloat(firstBox.longitude),
      };
    }

    // Procesar por prioridad
    const priorityGroups = [];
    if (optimizationOptions.prioritizeFull && full.length > 0) {
      priorityGroups.push(full);
    }
    if (optimizationOptions.prioritizeAlmostFull && almostFull.length > 0) {
      priorityGroups.push(almostFull);
    }
    priorityGroups.push(available);

    for (const group of priorityGroups) {
      const groupOptimized = optimizeNearestNeighbor(group, currentLocation);
      optimized.push(...groupOptimized);
      
      // Actualizar ubicación actual con la última caja del grupo
      if (groupOptimized.length > 0) {
        const lastBox = groupOptimized[groupOptimized.length - 1];
        currentLocation = {
          latitude: parseFloat(lastBox.latitude),
          longitude: parseFloat(lastBox.longitude),
        };
      }
    }

    // Reordenar con números de orden correctos
    return optimized.map((box, index) => ({
      ...box,
      order: index + 1,
    }));
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleBoxToggle = (box) => {
    setSelectedBoxes(prev => {
      const isSelected = prev.some(b => b.id === box.id);
      if (isSelected) {
        return prev.filter(b => b.id !== box.id);
      } else {
        return [...prev, box];
      }
    });
  };

  const handleOptimizeRoute = async () => {
    if (selectedBoxes.length === 0) {
      Alert.alert("Error", "Selecciona al menos una caja para optimizar");
      return;
    }

    setIsOptimizing(true);
    
    try {
      // Validar que todas las cajas tengan coordenadas válidas
      const validBoxes = selectedBoxes.filter(box => {
        const lat = parseFloat(box.latitude);
        const lng = parseFloat(box.longitude);
        return !isNaN(lat) && !isNaN(lng);
      });

      if (validBoxes.length === 0) {
        Alert.alert("Error", "Las cajas seleccionadas no tienen coordenadas válidas");
        setIsOptimizing(false);
        return;
      }

      let optimized = [];

      if (optimizationOptions.algorithm === 'nearest') {
        // Algoritmo: Vecino más cercano
        optimized = optimizeNearestNeighbor(validBoxes, userLocation);
      } else {
        // Algoritmo: Priorizar por estado
        optimized = optimizeByPriority(validBoxes, userLocation);
      }

      if (optimized.length === 0) {
        Alert.alert("Error", "No se pudo crear una ruta con las cajas seleccionadas. Verifica que estén dentro del rango de distancia máxima.");
        setIsOptimizing(false);
        return;
      }

      setOptimizedRoute(optimized);
    } catch (error) {
      Alert.alert("Error", "No se pudo optimizar la ruta");
      console.error(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCreateRoute = async () => {
    if (!routeName.trim()) {
      Alert.alert("Error", "Ingresa un nombre para la ruta");
      return;
    }

    if (optimizedRoute.length === 0) {
      Alert.alert("Error", "Optimiza la ruta primero");
      return;
    }

    try {
      // Calcular distancia total y tiempo estimado
      const totalDistance = optimizedRoute.reduce((sum, box) => sum + (box.distance || 0), 0);
      const estimatedTime = Math.round(totalDistance * 2); // Estimación: 2 minutos por km

      // Crear la ruta
      const newRoute = await routesService.createRoute({
        name: routeName.trim(),
        boxes: optimizedRoute.map(box => ({
          id: box.id,
          name: box.name,
          latitude: box.latitude,
          longitude: box.longitude,
          current_containers: box.current_containers,
          max_containers: box.max_containers,
          order: box.order,
          distance: box.distance,
        })),
        totalDistance: parseFloat(totalDistance.toFixed(2)),
        estimatedTime,
        algorithm: optimizationOptions.algorithm,
      });

      Alert.alert("Éxito", `Ruta "${routeName}" creada correctamente`);
      setRouteName('');
      setOptimizedRoute([]);
      setSelectedBoxes([]);
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo crear la ruta");
      console.error(error);
    }
  };

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
              Optimizar Ruta
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter_400Regular",
                color: isDark ? "#9CA3AF" : "#6B7280",
                marginTop: 4,
              }}
            >
              Selecciona cajas y optimiza tu ruta
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
        showsVerticalScrollIndicator={false}
      >
        {/* Configuración de Optimización */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 16,
            }}
          >
            Configuración
          </Text>

          <View
            style={{
              backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: isDark ? "#333333" : "#E5E5E5",
            }}
          >
            {/* Priorizar cajas llenas */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Priorizar cajas llenas
              </Text>
              <Switch
                value={optimizationOptions.prioritizeFull}
                onValueChange={(value) => setOptimizationOptions(prev => ({ ...prev, prioritizeFull: value }))}
                trackColor={{ false: isDark ? "#333333" : "#E5E5E5", true: "#00B86C" }}
                thumbColor={optimizationOptions.prioritizeFull ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>

            {/* Priorizar cajas casi llenas */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Priorizar cajas casi llenas
              </Text>
              <Switch
                value={optimizationOptions.prioritizeAlmostFull}
                onValueChange={(value) => setOptimizationOptions(prev => ({ ...prev, prioritizeAlmostFull: value }))}
                trackColor={{ false: isDark ? "#333333" : "#E5E5E5", true: "#00B86C" }}
                thumbColor={optimizationOptions.prioritizeAlmostFull ? "#FFFFFF" : "#FFFFFF"}
              />
            </View>

            {/* Distancia máxima */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                  marginBottom: 8,
                }}
              >
                Distancia máxima (km)
              </Text>
              <TextInput
                style={{
                  backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#FFFFFF" : "#000000",
                  borderWidth: 1,
                  borderColor: isDark ? "#333333" : "#E5E5E5",
                }}
                value={optimizationOptions.maxDistance.toString()}
                onChangeText={(text) => setOptimizationOptions(prev => ({ ...prev, maxDistance: parseInt(text) || 50 }))}
                keyboardType="numeric"
                placeholder="50"
              />
            </View>

            {/* Algoritmo */}
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_500Medium",
                  color: isDark ? "#FFFFFF" : "#000000",
                  marginBottom: 8,
                }}
              >
                Algoritmo de optimización
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: optimizationOptions.algorithm === 'nearest' 
                      ? "#00B86C" 
                      : (isDark ? "#2A2A2A" : "#F5F5F5"),
                    alignItems: "center",
                  }}
                  onPress={() => setOptimizationOptions(prev => ({ ...prev, algorithm: 'nearest' }))}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: optimizationOptions.algorithm === 'nearest' 
                        ? "#FFFFFF" 
                        : (isDark ? "#FFFFFF" : "#000000"),
                    }}
                  >
                    Vecino Más Cercano
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: optimizationOptions.algorithm === 'genetic' 
                      ? "#00B86C" 
                      : (isDark ? "#2A2A2A" : "#F5F5F5"),
                    alignItems: "center",
                  }}
                  onPress={() => setOptimizationOptions(prev => ({ ...prev, algorithm: 'genetic' }))}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: "Inter_500Medium",
                      color: optimizationOptions.algorithm === 'genetic' 
                        ? "#FFFFFF" 
                        : (isDark ? "#FFFFFF" : "#000000"),
                    }}
                  >
                    Algoritmo Genético
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Selección de Cajas */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Inter_600SemiBold",
              color: isDark ? "#FFFFFF" : "#000000",
              marginBottom: 16,
            }}
          >
            Seleccionar Cajas ({selectedBoxes.length})
          </Text>

          {/* Cajas Llenas */}
          {fullBoxes.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  color: "#EF4444",
                  marginBottom: 12,
                }}
              >
                Cajas Llenas ({fullBoxes.length})
              </Text>
              {fullBoxes.map((box) => (
                <TouchableOpacity
                  key={box.id}
                  style={{
                    backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selectedBoxes.some(b => b.id === box.id) 
                      ? "#00B86C" 
                      : (isDark ? "#333333" : "#E5E5E5"),
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => handleBoxToggle(box)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: selectedBoxes.some(b => b.id === box.id) 
                        ? "#00B86C" 
                        : "transparent",
                      borderWidth: 2,
                      borderColor: selectedBoxes.some(b => b.id === box.id) 
                        ? "#00B86C" 
                        : (isDark ? "#666666" : "#CCCCCC"),
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {selectedBoxes.some(b => b.id === box.id) && (
                      <Check size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_600SemiBold",
                        color: isDark ? "#FFFFFF" : "#000000",
                        marginBottom: 4,
                      }}
                    >
                      {box.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_400Regular",
                        color: isDark ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      {box.current_containers}/{box.max_containers} envases
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#EF4444",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_500Medium",
                        color: "#FFFFFF",
                      }}
                    >
                      Llena
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Cajas Casi Llenas */}
          {almostFullBoxes.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  color: "#F59E0B",
                  marginBottom: 12,
                }}
              >
                Cajas Casi Llenas ({almostFullBoxes.length})
              </Text>
              {almostFullBoxes.map((box) => (
                <TouchableOpacity
                  key={box.id}
                  style={{
                    backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selectedBoxes.some(b => b.id === box.id) 
                      ? "#00B86C" 
                      : (isDark ? "#333333" : "#E5E5E5"),
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => handleBoxToggle(box)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: selectedBoxes.some(b => b.id === box.id) 
                        ? "#00B86C" 
                        : "transparent",
                      borderWidth: 2,
                      borderColor: selectedBoxes.some(b => b.id === box.id) 
                        ? "#00B86C" 
                        : (isDark ? "#666666" : "#CCCCCC"),
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {selectedBoxes.some(b => b.id === box.id) && (
                      <Check size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_600SemiBold",
                        color: isDark ? "#FFFFFF" : "#000000",
                        marginBottom: 4,
                      }}
                    >
                      {box.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_400Regular",
                        color: isDark ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      {box.current_containers}/{box.max_containers} envases
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#F59E0B",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_500Medium",
                        color: "#FFFFFF",
                      }}
                    >
                      Casi Llena
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Cajas Disponibles */}
          {availableBoxes.length > 0 && (
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: "Inter_600SemiBold",
                  color: "#00B86C",
                  marginBottom: 12,
                }}
              >
                Cajas Disponibles ({availableBoxes.length})
              </Text>
              {availableBoxes.slice(0, 10).map((box) => (
                <TouchableOpacity
                  key={box.id}
                  style={{
                    backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selectedBoxes.some(b => b.id === box.id) 
                      ? "#00B86C" 
                      : (isDark ? "#333333" : "#E5E5E5"),
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                  onPress={() => handleBoxToggle(box)}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: selectedBoxes.some(b => b.id === box.id) 
                        ? "#00B86C" 
                        : "transparent",
                      borderWidth: 2,
                      borderColor: selectedBoxes.some(b => b.id === box.id) 
                        ? "#00B86C" 
                        : (isDark ? "#666666" : "#CCCCCC"),
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {selectedBoxes.some(b => b.id === box.id) && (
                      <Check size={12} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_600SemiBold",
                        color: isDark ? "#FFFFFF" : "#000000",
                        marginBottom: 4,
                      }}
                    >
                      {box.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_400Regular",
                        color: isDark ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      {box.current_containers}/{box.max_containers} envases
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "#00B86C",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "Inter_500Medium",
                        color: "#FFFFFF",
                      }}
                    >
                      Disponible
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {availableBoxes.length > 10 && (
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_400Regular",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Y {availableBoxes.length - 10} cajas más...
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Botón Optimizar */}
        <TouchableOpacity
          style={{
            backgroundColor: selectedBoxes.length > 0 ? "#00B86C" : (isDark ? "#2A2A2A" : "#E5E5E5"),
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            opacity: selectedBoxes.length > 0 ? 1 : 0.5,
          }}
          onPress={handleOptimizeRoute}
          disabled={selectedBoxes.length === 0 || isOptimizing}
        >
          {isOptimizing ? (
            <RefreshCw size={20} color="#FFFFFF" className="animate-spin" />
          ) : (
            <Route size={20} color="#FFFFFF" />
          )}
          <Text
            style={{
              marginLeft: 12,
              fontSize: 16,
              fontFamily: "Inter_600SemiBold",
              color: "#FFFFFF",
            }}
          >
            {isOptimizing ? "Optimizando..." : "Optimizar Ruta"}
          </Text>
        </TouchableOpacity>

        {/* Ruta Optimizada */}
        {optimizedRoute.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Inter_600SemiBold",
                color: isDark ? "#FFFFFF" : "#000000",
                marginBottom: 16,
              }}
            >
              Ruta Optimizada
            </Text>

            <View
              style={{
                backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: isDark ? "#333333" : "#E5E5E5",
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Navigation size={20} color="#00B86C" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: isDark ? "#FFFFFF" : "#000000",
                  }}
                >
                  {optimizedRoute.length} paradas
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Clock size={20} color="#3B82F6" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Tiempo estimado: {Math.round(optimizedRoute.reduce((total, box) => total + (box.distance || 0), 0) * 2)} min
                </Text>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <MapPin size={20} color="#8B5CF6" />
                <Text
                  style={{
                    marginLeft: 8,
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#9CA3AF" : "#6B7280",
                  }}
                >
                  Distancia: {optimizedRoute.reduce((total, box) => total + (box.distance || 0), 0).toFixed(1)} km
                </Text>
              </View>
            </View>

            {/* Lista de paradas */}
            {optimizedRoute.map((box, index) => {
              const isCollected = collectedBoxes.has(box.id);
              const hasContainers = box.current_containers > 0;

              return (
                <View
                  key={box.id}
                  style={{
                    backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: isCollected 
                      ? "#00B86C" 
                      : (isDark ? "#333333" : "#E5E5E5"),
                    flexDirection: "row",
                    alignItems: "center",
                    opacity: isCollected ? 0.6 : 1,
                  }}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isCollected ? "#9CA3AF" : "#00B86C",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    {isCollected ? (
                      <Check size={16} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter_600SemiBold",
                          color: "#FFFFFF",
                        }}
                      >
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: "Inter_600SemiBold",
                        color: isDark ? "#FFFFFF" : "#000000",
                        marginBottom: 4,
                        textDecorationLine: isCollected ? "line-through" : "none",
                      }}
                    >
                      {box.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: "Inter_400Regular",
                        color: isDark ? "#9CA3AF" : "#6B7280",
                      }}
                    >
                      {box.current_containers}/{box.max_containers} envases
                    </Text>
                  </View>
                  {!isCollected && hasContainers ? (
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#00B86C",
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        marginRight: 8,
                      }}
                      onPress={() => handleCollectBox(box)}
                      disabled={collectBoxMutation.isPending}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_600SemiBold",
                          color: "#FFFFFF",
                        }}
                      >
                        Recolectar
                      </Text>
                    </TouchableOpacity>
                  ) : isCollected ? (
                    <View
                      style={{
                        backgroundColor: "#9CA3AF",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                          color: "#FFFFFF",
                        }}
                      >
                        Recolectada
                      </Text>
                    </View>
                  ) : (
                    <View
                      style={{
                        backgroundColor: getBoxStatusColor(box),
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Inter_500Medium",
                          color: "#FFFFFF",
                        }}
                      >
                        {getBoxStatusText(box)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Crear Ruta */}
            <View style={{ marginTop: 16 }}>
              <TextInput
                style={{
                  backgroundColor: isDark ? "#2A2A2A" : "#FFFFFF",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  fontFamily: "Inter_400Regular",
                  color: isDark ? "#FFFFFF" : "#000000",
                  borderWidth: 1,
                  borderColor: isDark ? "#333333" : "#E5E5E5",
                  marginBottom: 12,
                }}
                value={routeName}
                onChangeText={setRouteName}
                placeholder="Nombre de la ruta"
                placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              />
              
              <TouchableOpacity
                style={{
                  backgroundColor: "#00B86C",
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={handleCreateRoute}
              >
                <Check size={20} color="#FFFFFF" />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 16,
                    fontFamily: "Inter_600SemiBold",
                    color: "#FFFFFF",
                  }}
                >
                  Crear Ruta
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
