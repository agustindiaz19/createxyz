import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Recycle } from 'lucide-react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export default function LoadingScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#E2E8F0']}
      style={{ flex: 1 }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        {/* Logo con animación */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: '#00B86C',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 32,
            shadowColor: '#00B86C',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <Recycle size={50} color="#FFFFFF" />
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 32,
            fontFamily: 'Inter_600SemiBold',
            color: isDark ? '#FFFFFF' : '#1E293B',
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Recipunto
        </Text>

        {/* Subtitle */}
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'Inter_400Regular',
            color: isDark ? '#94A3B8' : '#64748B',
            textAlign: 'center',
            lineHeight: 24,
            maxWidth: 280,
          }}
        >
          Cargando tu experiencia de reciclaje...
        </Text>

        {/* Loading indicator */}
        <View
          style={{
            marginTop: 32,
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 3,
            borderColor: isDark ? '#334155' : '#E2E8F0',
            borderTopColor: '#00B86C',
            // Aquí podrías agregar una animación de rotación si quisieras
          }}
        />
      </View>
    </LinearGradient>
  );
}
