import { useAuth } from './auth';

// Hook para obtener el rol del usuario desde user_metadata
export const useUserRole = () => {
  const { user } = useAuth();
  
  // Obtener el rol desde user_metadata, por defecto 'citizen'
  const role = user?.user_metadata?.role || 'citizen';
  
  return {
    role,
    isCitizen: role === 'citizen',
    isCollector: role === 'collector',
  };
};
