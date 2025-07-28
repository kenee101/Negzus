import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Paystack } from 'react-native-paystack-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function PaymentScreenUser() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: 'user@example.com',
    name: 'John Doe',
    phone: '+2348012345678'
  });

  useEffect(() => {
    requestCameraPermission();
    loadPaymentHistory();
    loadUserProfile();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      Alert.alert('Error', 'Camera permission required');
    }
  };

  const loadPaymentHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('paymentHistory');
      if (history) {
        setPaymentHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const savePaymentHistory = async (newHistory) => {
    try {
      await AsyncStorage.setItem('paymentHistory', JSON.stringify(newHistory));
      setPaymentHistory(newHistory);
    } catch (error) {
      console.error('Error saving payment history:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await AsyncStorage.getItem('userProfile');
      if (profile) {
        setUserProfile(JSON.parse(profile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const onBarcodeScanned = ({ type, data }) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    
    try {
      const paymentData = JSON.parse(data);
      
      // Enhanced validation for gas station QR codes
      if (paymentData.stationId && paymentData.amount && paymentData.fuelType) {
        // Generate unique reference for each transaction
        const reference = `NEG_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        setScannedData({
          ...paymentData,
          reference,
          email: userProfile.email,
          customerName: userProfile.name,
          timestamp: new Date().toISOString()
        });
        setShowPayment(true);
      } else {
        Alert.alert('Error', 'Invalid gas station QR code');
        setIsScanning(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not read QR code. Please try again.');
      setIsScanning(true);
    }
  };

  const processPayment = () => {
    if (!scannedData) return;
    
    setShowPayment(false);
    setShowPaystack(true);
    setIsProcessing(true);
  };

  const handlePaymentSuccess = async (response) => {
    setIsProcessing(false);
    setShowPaystack(false);
    
    try {
      // Verify payment on your backend
      const verification = await verifyPaymentOnBackend(response.data.reference);
      
      if (verification.success) {
        Alert.alert('Success', 'Payment completed successfully! You can now collect your fuel.');
        
        // Add to payment history
        const historyItem = {
          ...scannedData,
          status: 'completed',
          transactionId: response.data.reference,
          completedAt: new Date().toISOString(),
          amount: scannedData.amount,
          fuelQuantity: scannedData.fuelQuantity,
          stationName: scannedData.stationName,
        };
        
        const newHistory = [historyItem, ...paymentHistory].slice(0, 20); // Keep last 20 payments
        await savePaymentHistory(newHistory);
        
        // Generate receipt or pump authorization code
        showReceiptModal(historyItem);
      } else {
        Alert.alert('Error', 'Payment verification failed. Please contact support.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify payment. Please contact support.');
    }
    
    resetScanner();
  };

  const handlePaymentCancel = () => {
    setIsProcessing(false);
    setShowPaystack(false);
    Alert.alert('Cancelled', 'Payment was cancelled');
    resetScanner();
  };

  const handlePaymentError = (error) => {
    setIsProcessing(false);
    setShowPaystack(false);
    Alert.alert('Error', `Payment failed: ${error.message || 'Unknown error'}`);
    resetScanner();
  };

  const verifyPaymentOnBackend = async (reference) => {
    try {
      // Replace with your actual backend endpoint
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference }),
      });
      
      return await response.json();
    } catch (error) {
      console.error('Backend verification error:', error);
      return { success: false, error: error.message };
    }
  };

  const showReceiptModal = (transaction) => {
    Alert.alert(
      'Payment Receipt',
      `Transaction ID: ${transaction.transactionId}\n` +
      `Station: ${transaction.stationName}\n` +
      `Amount: ₦${transaction.amount.toLocaleString()}\n` +
      `Fuel: ${transaction.fuelQuantity}L of ${transaction.fuelType}\n` +
      `Date: ${new Date(transaction.completedAt).toLocaleString()}`,
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
  };

  const cancelPayment = () => {
    setShowPayment(false);
    resetScanner();
  };

  const resetScanner = () => {
    setScannedData(null);
    setIsScanning(true);
  };

  const retryScanning = () => {
    setIsScanning(true);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="camera-off" size={64} color="#666" />
        <Text style={styles.permissionText}>Camera permission denied</Text>
        <Text style={styles.permissionSubtext}>
          Please enable camera access in settings to scan QR codes
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fuel Payment</Text>
        <Text style={styles.subtitle}>Scan station QR code to pay</Text>
      </View>
      
      {/* Camera Section */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={isScanning ? onBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.scannerOverlay} pointerEvents="none">
          <View style={styles.scannerFrame}>
            <View style={styles.scannerCorner} />
            <View style={[styles.scannerCorner, styles.topRight]} />
            <View style={[styles.scannerCorner, styles.bottomLeft]} />
            <View style={[styles.scannerCorner, styles.bottomRight]} />
          </View>
          <Text style={styles.scannerText}>
            {isScanning ? 'Point camera at QR code' : 'Processing...'}
          </Text>
          {!isScanning && (
            <TouchableOpacity style={styles.retryButton} onPress={retryScanning}>
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Payment History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Payments</Text>
        <ScrollView style={styles.historyScroll} showsVerticalScrollIndicator={false}>
          {paymentHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={32} color="#666" />
              <Text style={styles.emptyText}>No payments yet</Text>
            </View>
          ) : (
            paymentHistory.slice(0, 5).map((payment) => (
              <View key={payment.transactionId} style={styles.historyItem}>
                <View style={styles.historyLeft}>
                  <Text style={styles.historyMerchant}>{payment.stationName}</Text>
                  <Text style={styles.historyDetails}>
                    {payment.fuelQuantity}L • {payment.fuelType}
                  </Text>
                  <Text style={styles.historyDate}>
                    {new Date(payment.completedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>₦{payment.amount.toLocaleString()}</Text>
                  <View style={styles.statusContainer}>
                    <Ionicons name="checkmark-circle" size={12} color="#4caf50" />
                    <Text style={styles.historyStatus}>Completed</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Payment Confirmation Modal */}
      <Modal visible={showPayment} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            
            {scannedData && (
              <View style={styles.paymentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="business" size={16} color="#007bff" />
                  <Text style={styles.detailLabel}>Station:</Text>
                  <Text style={styles.detailValue}>{scannedData.stationName}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="car" size={16} color="#007bff" />
                  <Text style={styles.detailLabel}>Fuel Type:</Text>
                  <Text style={styles.detailValue}>{scannedData.fuelType}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="speedometer" size={16} color="#007bff" />
                  <Text style={styles.detailLabel}>Quantity:</Text>
                  <Text style={styles.detailValue}>{scannedData.fuelQuantity} Liters</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="card" size={16} color="#007bff" />
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[styles.detailValue, styles.amountText]}>
                    ₦{scannedData.amount.toLocaleString()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="document-text" size={16} color="#007bff" />
                  <Text style={styles.detailLabel}>Reference:</Text>
                  <Text style={styles.detailValue}>{scannedData.reference}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelPayment}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={processPayment}>
                <Text style={styles.confirmButtonText}>Pay Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paystack Payment Modal */}
      {showPaystack && scannedData && (
        <Modal visible={showPaystack} animationType="slide">
          <View style={styles.paystackContainer}>
            {isProcessing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.processingText}>Processing Payment...</Text>
              </View>
            )}
            
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scannerFrame: {
    width: 220,
    height: 220,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007bff',
    borderWidth: 3,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    top: -2,
    left: -2,
  },
  topRight: {
    top: -2,
    right: -2,
    left: 'auto',
    transform: [{ rotate: '90deg' }],
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    top: 'auto',
    transform: [{ rotate: '-90deg' }],
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    top: 'auto',
    left: 'auto',
    transform: [{ rotate: '180deg' }],
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 30,
    textAlign: 'center',
    fontWeight: '500',
  },
  historyContainer: {
    backgroundColor: '#1a1a1a',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 15,
    maxHeight: 200,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  historyScroll: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  historyLeft: {
    flex: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyMerchant: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  historyDetails: {
    color: '#999',
    fontSize: 14,
    marginBottom: 2,
  },
  historyDate: {
    color: '#666',
    fontSize: 12,
  },
  historyAmount: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatus: {
    color: '#4caf50',
    fontSize: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: 25,
    borderRadius: 20,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 25,
  },
  paymentDetails: {
    marginBottom: 25,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
    marginLeft: 10,
    width: 80,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  amountText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paystackContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    fontWeight: '500',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
  permissionSubtext: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});