// Splash Screen - App loading screen with logo
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { COLORS } from '../config/theme';

const SplashScreen = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Dashboard');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primaryDark} barStyle="light-content" />
      <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Animated.Image 
          source={require('../../assets/logo.png')} 
          style={[styles.logoImage, { transform: [{ scale: scaleAnim }] }]} 
          resizeMode="contain"
        />
        <Text style={styles.title}>MANJULA</Text>
        <Text style={styles.titleSecond}>MILK FORMING</Text>
        <Text style={styles.tagline}>Fresh Milk, Healthy Life</Text>
      </Animated.View>
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>Managing your dairy business</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 4,
  },
  titleSecond: {
    fontSize: 28,
    fontWeight: '700',
    color: '#8BC34A',
    letterSpacing: 3,
    marginTop: -2,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});

export default SplashScreen;
