import { View, Text, StyleSheet } from 'react-native';
import { Colors } from "@/constants/Colors"

export default function SubscriptionAlertCard({ alert }) {
  return (
    <View style={styles.card}>
      <Text style={styles.alertText}>{alert.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.dark.background,
        padding: 18,
        borderRadius: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 3,
    },
    alertText: {
        fontSize: 16,
        color: Colors.light.background,
    },
});