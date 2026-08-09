import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useState, useCallback, useEffect } from "react";
import {
  Package,
  Plus,
  Minus,
  MapPin,
  Trash2,
  Move,
  Check,
  X,
} from "lucide-react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boxesService } from "../../lib/boxes-service";
import { useAuth } from "../../utils/auth";

export default function CitizenBoxesScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const [selectedBox, setSelectedBox] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [containerInput, setContainerInput] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [newLocation, setNewLocation] = useState(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Refetch boxes cuando el componente se monta o cuando isAuthenticated cambia
  useEffect(() => {
    if (isAuthenticated && refetch) {
      refetch();
    }
  }, [isAuthenticated, refetch]);

  // Fetch boxes
  const {
    data: boxesData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["boxes"],
    queryFn: () => boxesService.getAllBoxes(),
    enabled: isAuthenticated, // Solo ejecutar si está autenticado
    staleTime: 0, // Siempre considerar los datos como stale
    cacheTime: 5 * 60 * 1000, // Cache por 5 minutos
    refetchOnWindowFocus: true, // Refetch cuando la ventana recibe foco
  });

  // Update box mutation
  const updateBoxMutation = useMutation({
    mutationFn: ({ id, updates }) => boxesService.updateBox(id, updates),
    onSuccess: async () => {
      // Invalidar y refetch inmediatamente
      await queryClient.invalidateQueries({ queryKey: ["boxes"] });
      await queryClient.refetchQueries({ queryKey: ["boxes"] });
      
      setShowDetailModal(false);
      setSelectedBox(null);
      setContainerInput("");
      Alert.alert("Éxito", "¡Caja actualizada exitosamente!");
    },
    onError: (error) => {
      console.error('Update box error:', error);
      Alert.alert("Error", error.message || "Error al actualizar la caja");
    },
  });

  // Delete box mutation
  const deleteBoxMutation = useMutation({
    mutationFn: (id) => boxesService.deleteBox(id),
    onSuccess: async () => {
      // Invalidar y refetch inmediatamente
      await queryClient.invalidateQueries({ queryKey: ["boxes"] });
      await queryClient.refetchQueries({ queryKey: ["boxes"] });
      
      setShowDetailModal(false);
      setSelectedBox(null);
      Alert.alert("Éxito", "¡Caja eliminada exitosamente!");
    },
    onError: (error) => {
      console.error('Delete box error:', error);
      Alert.alert("Error", error.message || "Error al eliminar la caja");
    },
  });

  const handleBoxPress = useCallback((box) => {
    setSelectedBox(box);
    setContainerInput(box.current_containers.toString());
    setShowDetailModal(true);
  }, []);

  const handleAddContainers = useCallback(() => {
    if (!selectedBox) return;

    const newCount = parseInt(containerInput) || 0;
    if (newCount < 0) {
      Alert.alert("Error", "El número de envases no puede ser negativo");
      return;
    }
    if (newCount > selectedBox.max_containers) {
      Alert.alert(
        "Error",
        `El número de envases no puede exceder la capacidad máxima de ${selectedBox.max_containers}`,
      );
      return;
    }

    updateBoxMutation.mutate({
      id: selectedBox.id,
      updates: { current_containers: newCount },
    });
  }, [selectedBox, containerInput, updateBoxMutation]);

  const handleMarkFull = useCallback(() => {
    if (!selectedBox) return;

    updateBoxMutation.mutate({
      id: selectedBox.id,
      updates: {
        current_containers: selectedBox.max_containers,
        status: "full",
      },
    });
  }, [selectedBox, updateBoxMutation]);

  const handleDeleteBox = useCallback(() => {
    if (!selectedBox) return;

    Alert.alert(
      "Eliminar Caja",
      "¿Estás seguro de que quieres eliminar esta caja de recolección?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => deleteBoxMutation.mutate(selectedBox.id),
        },
      ],
    );
  }, [selectedBox, deleteBoxMutation]);

  const getStatusColor = (box) => {
    const percentage = (box.current_containers / box.max_containers) * 100;
    if (percentage >= 100) return "#EF4444"; // Red - Full
    if (percentage >= 75) return "#F59E0B"; // Orange - Almost full
    return "#00B86C"; // Green - Available
  };

  const getStatusText = (box) => {
    const percentage = (box.current_containers / box.max_containers) * 100;
    if (percentage >= 100) return "Llena";
    if (percentage >= 75) return "Casi Llena";
    return "Disponible";
  };

  if (!fontsLoaded) {
    return null;
  }

  const boxes = boxesData || [];

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
          Mis Cajas
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: "Inter_400Regular",
            color: isDark ? "#9CA3AF" : "#6B7280",
            marginTop: 4,
          }}
        >
          {boxes.length} caja{boxes.length !== 1 ? "s" : ""} encontrada{boxes.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
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
        {boxes.length === 0 ? (
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
              <Package size={32} color="#00B86C" />
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
              Sin Cajas de Recolección
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
              Ve al mapa para agregar tu primera caja de recolección
            </Text>
          </View>
        ) : (
          /* Box List */
          <View style={{ paddingTop: 20 }}>
            {boxes.map((box) => (
              <TouchableOpacity
                key={box.id}
                style={{
                  backgroundColor: isDark ? "#1E1E1E" : "#F8F9FA",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#333333" : "#E5E5E5",
                }}
                onPress={() => handleBoxPress(box)}
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
                        fontSize: 18,
                        fontFamily: "Inter_600SemiBold",
                        color: isDark ? "#FFFFFF" : "#000000",
                        marginBottom: 4,
                      }}
                    >
                      Caja #{box.id}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <MapPin
                        size={16}
                        color={isDark ? "#9CA3AF" : "#6B7280"}
                      />
                      <Text
                        style={{
                          marginLeft: 4,
                          fontSize: 14,
                          fontFamily: "Inter_400Regular",
                          color: isDark ? "#9CA3AF" : "#6B7280",
                        }}
                      >
                        {parseFloat(box.latitude).toFixed(4)},{" "}
                        {parseFloat(box.longitude).toFixed(4)}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor: getStatusColor(box),
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
                      {getStatusText(box)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View
                  style={{
                    height: 8,
                    backgroundColor: isDark ? "#333333" : "#E5E5E5",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      height: 8,
                      backgroundColor: getStatusColor(box),
                      borderRadius: 4,
                      width: `${Math.min(
                        (box.current_containers / box.max_containers) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "Inter_500Medium",
                    color: isDark ? "#FFFFFF" : "#000000",
                  }}
                >
                  {box.current_containers} / {box.max_containers} envases
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Box Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
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
              paddingTop: 20,
              paddingHorizontal: 20,
              paddingBottom: insets.bottom + 20,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontFamily: "Inter_600SemiBold",
                  color: isDark ? "#FFFFFF" : "#000000",
                }}
              >
                Caja #{selectedBox?.id}
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <X size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            {selectedBox && (
              <>
                {/* Status */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 20,
                    padding: 12,
                    backgroundColor: isDark ? "#333333" : "#F0F0F0",
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#FFFFFF" : "#000000",
                    }}
                  >
                    Estado: {getStatusText(selectedBox)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: getStatusColor(selectedBox),
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                    }}
                  />
                </View>

                {/* Container Count Input */}
                <View style={{ marginBottom: 24 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: "Inter_500Medium",
                      color: isDark ? "#FFFFFF" : "#000000",
                      marginBottom: 8,
                    }}
                  >
                    Actualizar Cantidad de Envases
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        backgroundColor: isDark ? "#333333" : "#F0F0F0",
                        padding: 12,
                        borderRadius: 8,
                      }}
                      onPress={() => {
                        const newValue = Math.max(
                          0,
                          parseInt(containerInput) - 1,
                        );
                        setContainerInput(newValue.toString());
                      }}
                    >
                      <Minus size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                    </TouchableOpacity>
                    <TextInput
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: isDark ? "#333333" : "#E5E5E5",
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        fontFamily: "Inter_400Regular",
                        color: isDark ? "#FFFFFF" : "#000000",
                        backgroundColor: isDark ? "#333333" : "#FFFFFF",
                        textAlign: "center",
                      }}
                      value={containerInput}
                      onChangeText={setContainerInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                    <TouchableOpacity
                      style={{
                        backgroundColor: isDark ? "#333333" : "#F0F0F0",
                        padding: 12,
                        borderRadius: 8,
                      }}
                      onPress={() => {
                        const newValue = Math.min(
                          selectedBox.max_containers,
                          parseInt(containerInput) + 1,
                        );
                        setContainerInput(newValue.toString());
                      }}
                    >
                      <Plus size={20} color={isDark ? "#FFFFFF" : "#000000"} />
                    </TouchableOpacity>
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "Inter_400Regular",
                      color: isDark ? "#9CA3AF" : "#6B7280",
                      marginTop: 4,
                    }}
                  >
                    Capacidad máxima: {selectedBox.max_containers} envases
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={{ gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#00B86C",
                      padding: 16,
                      borderRadius: 12,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      opacity: updateBoxMutation.isPending ? 0.7 : 1,
                    }}
                    onPress={handleAddContainers}
                    disabled={updateBoxMutation.isPending}
                  >
                    <Check size={20} color="#FFFFFF" />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 16,
                        fontFamily: "Inter_500Medium",
                        color: "#FFFFFF",
                      }}
                    >
                      Actualizar Cantidad
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#3B82F6",
                        padding: 16,
                        borderRadius: 12,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                      }}
                      onPress={() => {
                        setShowDetailModal(false);
                        setTimeout(() => {
                          Alert.alert(
                            "Mover Caja",
                            "Para mover esta caja, ve a la pantalla del Mapa y toca donde quieres colocarla. Esta función se mejorará en una actualización futura.",
                            [{ text: "OK" }],
                          );
                        }, 300);
                      }}
                    >
                      <Move size={16} color="#FFFFFF" />
                      <Text
                        style={{
                          marginLeft: 4,
                          fontSize: 14,
                          fontFamily: "Inter_500Medium",
                          color: "#FFFFFF",
                        }}
                      >
                        Mover
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#F59E0B",
                        padding: 16,
                        borderRadius: 12,
                        alignItems: "center",
                        opacity: updateBoxMutation.isPending ? 0.7 : 1,
                      }}
                      onPress={handleMarkFull}
                      disabled={updateBoxMutation.isPending}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: "Inter_500Medium",
                          color: "#FFFFFF",
                        }}
                      >
                        Marcar Llena
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        backgroundColor: "#EF4444",
                        padding: 16,
                        borderRadius: 12,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        opacity: deleteBoxMutation.isPending ? 0.7 : 1,
                      }}
                      onPress={handleDeleteBox}
                      disabled={deleteBoxMutation.isPending}
                    >
                      <Trash2 size={16} color="#FFFFFF" />
                      <Text
                        style={{
                          marginLeft: 4,
                          fontSize: 14,
                          fontFamily: "Inter_500Medium",
                          color: "#FFFFFF",
                        }}
                      >
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
