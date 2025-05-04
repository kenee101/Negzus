import { View, Text, StyleSheet } from 'react-native';

export default function SubscriptionAlertCard({ alert }) {
  return (
    <View style={styles.card}>
      <Text style={styles.alertText}>{alert.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f8f8f8',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 3,
    },
    alertText: {
        fontSize: 16,
        color: '#333',
    },
});