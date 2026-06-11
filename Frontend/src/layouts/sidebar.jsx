import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  Animated, 
  SafeAreaView 
} from 'react-native';
import { 
  Home, 
  BarChart2, 
  Users, 
  Settings, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  LogOut 
} from 'lucide-react-native'; // Versión para React Native

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [sidebarWidth] = useState(new Animated.Value(250)); // Ancho inicial (expandido)

  const toggleSidebar = () => {
    // Animación suave para abrir/cerrar
    Animated.timing(sidebarWidth, {
      toValue: isExpanded ? 80 : 250,
      duration: 300,
      useNativeDriver: false, // width no está soportado por el driver nativo
    }).start();

    setIsExpanded(!isExpanded);
  };

  const menuItems = [
    { icon: Home, label: 'Inicio', active: true },
    { icon: BarChart2, label: 'Estadísticas' },
    { icon: Users, label: 'Equipo' },
    { icon: Settings, label: 'Configuración' },
    { icon: HelpCircle, label: 'Ayuda' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.sidebar, { width: sidebarWidth }]}>
        
        {/* CABECERA */}
        <div style={styles.header}>
          {isExpanded && (
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoText}>D</Text>
              </View>
              <Text style={styles.brandName}>Dashboard</Text>
            </View>
          )}
          
          <TouchableOpacity 
            onPress={toggleSidebar} 
            style={[styles.toggleBtn, !isExpanded && { width: '100%', alignItems: 'center' }]}
          >
            {isExpanded ? (
              <ChevronLeft color="#94a3b8" size={20} />
            ) : (
              <ChevronRight color="#94a3b8" size={20} />
            )}
          </TouchableOpacity>
        </div>

        {/* MENÚ DE NAVEGACIÓN */}
        <View style={styles.navSection}>
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  item.active && styles.menuItemActive,
                  !isExpanded && { justifyContent: 'center' }
                ]}
              >
                <IconComponent 
                  color={item.active ? '#ffffff' : '#94a3b8'} 
                  size={22} 
                />
                {isExpanded && (
                  <Text style={[styles.menuLabel, item.active && styles.menuLabelActive]}>
                    {item.label}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PERFIL DE USUARIO */}
        <View style={[styles.footer, !isExpanded && { justifyContent: 'center', paddingHorizontal: 0 }]}>
          <View style={styles.profileContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' }}
              style={styles.avatar}
            />
            {isExpanded && (
              <View style={styles.profileTextContainer}>
                <Text style={styles.profileName} numberOfLines={1}>Ana Martínez</Text>
                <Text style={styles.profileEmail} numberOfLines={1}>ana@ejemplo.com</Text>
              </View>
            )}
          </View>

          {isExpanded && (
            <TouchableOpacity style={styles.logoutBtn}>
              <LogOut color="#94a3b8" size={18} />
            </TouchableOpacity>
          )}
        </View>

      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Fondo oscuro general de la app
  },
  sidebar: {
    height: '100%',
    backgroundColor: '#1e293b', // Slate 800
    borderRightWidth: 1,
    borderRightColor: '#334155',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'between',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#4f46e5', // Indigo 600
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  navSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 16,
  },
  menuItemActive: {
    backgroundColor: '#4f46e5',
  },
  menuLabel: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#ffffff',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  profileTextContainer: {
    flex: 1,
  },
  profileName: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  profileEmail: {
    color: '#64748b',
    fontSize: 12,
  },
  logoutBtn: {
    padding: 8,
  },
});