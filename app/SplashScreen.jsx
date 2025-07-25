import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
// import LottieView from 'lottie-react-native';

const SplashScreen = () => {
  useEffect(() => {
    setTimeout(() => {
      // Navigate to the main screen after animation ends
    }, 3000); // Match the duration of the animation
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* <LottieView
        source={require('@/assets/images/negzus.jpg')} 
        autoPlay
        loop={false}
      /> */}
    </View>
  );
};

export default SplashScreen;