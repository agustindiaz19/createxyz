import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Recycle,
  Leaf,
  User,
  Truck,
} from 'lucide-react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../utils/auth';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { signIn, signUp, resetPassword, isAuthenticated } = useAuth();

  // Estados del formulario
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState('citizen'); // Nuevo estado para el rol
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animaciones
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [fontsLoaded]);

  // Efecto para redirigir cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      // Pequeño delay para que el usuario vea el éxito
      setTimeout(() => {
        router.replace('/');
      }, 500);
    }
  }, [isAuthenticated, router]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    // Validations
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const { error } = isSignUp
        ? await signUp(email, password, userRole)
        : await signIn(email, password);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        if (isSignUp) {
          // Para registro, mostrar mensaje de éxito
          // El rol se manejará automáticamente por el trigger de Supabase
          Alert.alert(
            '¡Cuenta Creada!',
            'Por favor revisa tu email para verificar tu cuenta antes de continuar.'
          );
        } else {
          // For successful login, no alert shown, useEffect handles redirection
          console.log('Login successful, redirecting...');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu email primero');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    try {
      const { error } = await resetPassword(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Email Enviado',
          'Por favor revisa tu email para restablecer tu contraseña'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#F8FAFC', '#E2E8F0']}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingTop: insets.top + 40,
                paddingHorizontal: 24,
                paddingBottom: 40,
                alignItems: 'center',
              }}
            >
              {/* Logo */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#00B86C',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 24,
                  shadowColor: '#00B86C',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <Recycle size={40} color="#FFFFFF" />
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
                {isSignUp
                  ? 'Únete a la comunidad y ayuda a crear un futuro más sostenible'
                  : 'Bienvenido de vuelta. Continúa tu impacto ambiental'}
              </Text>
            </View>

            {/* Form */}
            <View
              style={{
                flex: 1,
                paddingHorizontal: 24,
                paddingBottom: insets.bottom + 24,
              }}
            >
              <View
                style={{
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderRadius: 24,
                  padding: 24,
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                {/* Form Title */}
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: 'Inter_600SemiBold',
                    color: isDark ? '#FFFFFF' : '#1E293B',
                    marginBottom: 8,
                    textAlign: 'center',
                  }}
                >
                  {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </Text>

                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: 'Inter_400Regular',
                    color: isDark ? '#94A3B8' : '#64748B',
                    marginBottom: 32,
                    textAlign: 'center',
                  }}
                >
                  {isSignUp
                    ? 'Completa la información para comenzar'
                    : 'Ingresa tus credenciales para continuar'}
                </Text>

                {/* Email Input */}
                <View style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Inter_500Medium',
                      color: isDark ? '#E2E8F0' : '#475569',
                      marginBottom: 8,
                    }}
                  >
                    Email
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#334155' : '#F1F5F9',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      borderWidth: 1,
                      borderColor: isDark ? '#475569' : '#E2E8F0',
                    }}
                  >
                    <Mail
                      size={20}
                      color={isDark ? '#94A3B8' : '#64748B'}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 16,
                        fontFamily: 'Inter_400Regular',
                        color: isDark ? '#FFFFFF' : '#1E293B',
                        paddingVertical: 16,
                      }}
                      placeholder="your@email.com"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Password Input */}
                <View style={{ marginBottom: 20 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Inter_500Medium',
                        color: isDark ? '#E2E8F0' : '#475569',
                        marginBottom: 8,
                      }}
                    >
                      Password
                    </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: isDark ? '#334155' : '#F1F5F9',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      borderWidth: 1,
                      borderColor: isDark ? '#475569' : '#E2E8F0',
                    }}
                  >
                    <Lock
                      size={20}
                      color={isDark ? '#94A3B8' : '#64748B'}
                      style={{ marginRight: 12 }}
                    />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 16,
                        fontFamily: 'Inter_400Regular',
                        color: isDark ? '#FFFFFF' : '#1E293B',
                        paddingVertical: 16,
                      }}
                      placeholder="••••••••"
                      placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ padding: 4 }}
                    >
                      {showPassword ? (
                        <EyeOff
                          size={20}
                          color={isDark ? '#94A3B8' : '#64748B'}
                        />
                      ) : (
                        <Eye
                          size={20}
                          color={isDark ? '#94A3B8' : '#64748B'}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Input (Sign Up only) */}
                {isSignUp && (
                  <View style={{ marginBottom: 20 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Inter_500Medium',
                        color: isDark ? '#E2E8F0' : '#475569',
                        marginBottom: 8,
                      }}
                    >
                      Confirmar Contraseña
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isDark ? '#334155' : '#F1F5F9',
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        borderWidth: 1,
                        borderColor: isDark ? '#475569' : '#E2E8F0',
                      }}
                    >
                      <Lock
                        size={20}
                        color={isDark ? '#94A3B8' : '#64748B'}
                        style={{ marginRight: 12 }}
                      />
                      <TextInput
                        style={{
                          flex: 1,
                          fontSize: 16,
                          fontFamily: 'Inter_400Regular',
                          color: isDark ? '#FFFFFF' : '#1E293B',
                          paddingVertical: 16,
                        }}
                        placeholder="••••••••"
                        placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ padding: 4 }}
                      >
                        {showConfirmPassword ? (
                          <EyeOff
                            size={20}
                            color={isDark ? '#94A3B8' : '#64748B'}
                          />
                        ) : (
                          <Eye
                            size={20}
                            color={isDark ? '#94A3B8' : '#64748B'}
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Role Selector (Sign Up only) */}
                {isSignUp && (
                  <View style={{ marginBottom: 20 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Inter_500Medium',
                        color: isDark ? '#E2E8F0' : '#475569',
                        marginBottom: 8,
                      }}
                    >
                      Tipo de Usuario
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        backgroundColor: isDark ? '#334155' : '#F1F5F9',
                        borderRadius: 12,
                        padding: 4,
                        borderWidth: 1,
                        borderColor: isDark ? '#475569' : '#E2E8F0',
                      }}
                    >
                      {/* Citizen Option */}
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: userRole === 'citizen' 
                            ? '#00B86C' 
                            : 'transparent',
                        }}
                        onPress={() => setUserRole('citizen')}
                      >
                        <User
                          size={16}
                          color={userRole === 'citizen' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: 'Inter_500Medium',
                            color: userRole === 'citizen' 
                              ? '#FFFFFF' 
                              : (isDark ? '#94A3B8' : '#64748B'),
                          }}
                        >
                          Ciudadano/Comercio
                        </Text>
                      </TouchableOpacity>

                      {/* Collector Option */}
                      <TouchableOpacity
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          borderRadius: 8,
                          backgroundColor: userRole === 'collector' 
                            ? '#00B86C' 
                            : 'transparent',
                        }}
                        onPress={() => setUserRole('collector')}
                      >
                        <Truck
                          size={16}
                          color={userRole === 'collector' ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B')}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={{
                            fontSize: 14,
                            fontFamily: 'Inter_500Medium',
                            color: userRole === 'collector' 
                              ? '#FFFFFF' 
                              : (isDark ? '#94A3B8' : '#64748B'),
                          }}
                        >
                          Municipio/Reciclador
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Forgot Password (Sign In only) */}
                {!isSignUp && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={{
                      alignSelf: 'flex-end',
                      marginBottom: 24,
                      paddingVertical: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: 'Inter_500Medium',
                        color: '#00B86C',
                      }}
                    >
                      ¿Olvidaste tu contraseña?
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Auth Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#00B86C',
                    borderRadius: 12,
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    shadowColor: '#00B86C',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                    opacity: loading ? 0.7 : 1,
                  }}
                  onPress={handleAuth}
                  disabled={loading}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: 'Inter_600SemiBold',
                      color: '#FFFFFF',
                      marginRight: 8,
                    }}
                  >
                    {loading
                      ? 'Cargando...'
                      : isSignUp
                      ? 'Crear Cuenta'
                      : 'Iniciar Sesión'}
                  </Text>
                  {!loading && (
                    <ArrowRight size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                {/* Switch Mode */}
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setPassword('');
                    setConfirmPassword('');
                    setUserRole('citizen'); // Reset role to default
                  }}
                  style={{
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Inter_400Regular',
                      color: isDark ? '#94A3B8' : '#64748B',
                      textAlign: 'center',
                    }}
                  >
                    {isSignUp
                      ? '¿Ya tienes una cuenta? '
                      : '¿No tienes una cuenta? '}
                    <Text
                      style={{
                        fontFamily: 'Inter_600SemiBold',
                        color: '#00B86C',
                      }}
                    >
                      {isSignUp ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Environmental Impact Message */}
              <View
                style={{
                  marginTop: 24,
                  padding: 20,
                  backgroundColor: isDark ? '#0F172A' : '#F0FDF4',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isDark ? '#1E293B' : '#BBF7D0',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#00B86C',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}
                >
                  <Leaf size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontFamily: 'Inter_600SemiBold',
                      color: isDark ? '#FFFFFF' : '#166534',
                      marginBottom: 4,
                    }}
                  >
                    Impacto Ambiental
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: 'Inter_400Regular',
                      color: isDark ? '#94A3B8' : '#15803D',
                      lineHeight: 16,
                    }}
                  >
                    Cada caja que registres ayuda a optimizar las rutas de recolección
                    y reducir la huella de carbono
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
