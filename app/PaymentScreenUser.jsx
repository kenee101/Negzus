import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Paystack } from 'react-native-paystack-webview';

export default function PaymentScreenUser() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showPaystack, setShowPaystack] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      Alert.alert('Error', 'Camera permission required');
    }
  };

  const onBarcodeScanned = ({ type, data }) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    
    try {
      const paymentData = JSON.parse(data);
      
      // Validate payment data structure
      if (paymentData.id && paymentData.amount && paymentData.merchant) {
        setScannedData(paymentData);
        setShowPayment(true);
      } else {
        Alert.alert('Error', 'Invalid payment QR code');
        setIsScanning(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not read QR code');
      setIsScanning(true);
    }
  };

  const processPayment = () => {
    if (!scannedData) return;
    
    setShowPayment(false);
    setShowPaystack(true);
  };

  const handlePaymentSuccess = (response) => {
    setShowPaystack(false);
    Alert.alert('Success', 'Payment completed successfully!');
    
    // Add to payment history
    const historyItem = {
      ...scannedData,
      status: 'completed',
      transactionId: response.data.reference,
      completedAt: new Date().toISOString(),
    };
    
    setPaymentHistory(prev => [historyItem, ...prev]);
    setScannedData(null);
    setIsScanning(true);
  };

  const handlePaymentCancel = () => {
    setShowPaystack(false);
    Alert.alert('Cancelled', 'Payment was cancelled');
    setScannedData(null);
    setIsScanning(true);
  };

  const cancelPayment = () => {
    setShowPayment(false);
    setScannedData(null);
    setIsScanning(true);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission denied</Text>
        <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan QR Code to Pay</Text>
      
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={isScanning ? onBarcodeScanned : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        <View style={styles.scannerOverlay} pointerEvents="none">
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerText}>
            {isScanning ? 'Point camera at QR code' : 'Processing...'}
          </Text>
        </View>
      </View>

      {/* Payment History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Recent Payments</Text>
        <ScrollView style={styles.historyScroll}>
          {paymentHistory.length === 0 ? (
            <Text style={styles.emptyText}>No payments yet</Text>
          ) : (
            paymentHistory.slice(0, 5).map((payment) => (
              <View key={payment.transactionId} style={styles.historyItem}>
                <Text style={styles.historyMerchant}>{payment.merchant}</Text>
                <Text style={styles.historyAmount}>₦{payment.amount.toFixed(2)}</Text>
                <Text style={styles.historyStatus}>✓ Completed</Text>
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
                <Text style={styles.detailText}>Merchant: {scannedData.merchant}</Text>
                <Text style={styles.detailText}>Amount: ₦{scannedData.amount.toFixed(2)}</Text>
                <Text style={styles.detailText}>Method: {scannedData.method}</Text>
                <Text style={styles.detailText}>Description: {scannedData.description || 'No description'}</Text>
                <Text style={styles.detailText}>Reference: {scannedData.reference}</Text>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.confirmButton} onPress={processPayment}>
                <Text style={styles.confirmButtonText}>Confirm Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelPayment}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Paystack Payment */}
      {showPaystack && scannedData && (
        <Paystack
          paystackKey="pk_test_your_public_key_here" // Replace with your actual public key
          amount={scannedData.amount * 100} // Paystack expects amount in kobo
          billingEmail={scannedData.email}
          reference={scannedData.reference}
          activityIndicatorColor="green"
          onCancel={handlePaymentCancel}
          onSuccess={handlePaymentSuccess}
          autoStart={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  formContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  picker: {
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyContainer: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  historyScroll: {
    maxHeight: 150,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  paymentItem: {
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: '#3a3a3a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMerchant: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyMerchant: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  paymentAmount: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyAmount: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  paymentReference: {
    color: '#999',
    fontSize: 12,
  },
  paymentStatus: {
    color: '#ffc107',
    fontSize: 12,
  },
  historyStatus: {
    color: '#4caf50',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    maxWidth: 350,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentDetails: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#3a3a3a',
    borderRadius: 8,
  },
  detailText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
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
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scannerFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});