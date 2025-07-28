import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Button,
  ScrollView,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { CameraView, Camera } from 'expo-camera';
import { usePaystack } from 'react-native-paystack-webview';
import { UserProfileStorage, PaymentHistoryStorage } from '../utils/storage';


export default function PaymentScreenUser() {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  // const [showPaystack, setShowPaystack] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    email: 'nexus@gmail.com',
    name: 'Nexus',
    phone: '+2347080345674'
  });
  const { popup } = usePaystack();

  useEffect(() => {
    requestCameraPermission();
    loadUserProfile();
    loadPaymentHistory();
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
      const history = await PaymentHistoryStorage.loadPaymentHistory();
      setPaymentHistory(history);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await UserProfileStorage.loadUserProfile();
      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const saveUserProfile = async (newProfile) => {
    try {
      const result = await UserProfileStorage.saveUserProfile(newProfile);
      if (result.success) {
        setUserProfile(newProfile);
        console.log('User profile saved successfully');
      }
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const result = await UserProfileStorage.updateUserProfile(updates);
      if (result.success) {
        setUserProfile(result.profile);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  const clearUserProfile = async () => {
    try {
      const result = await UserProfileStorage.clearUserProfile();
      if (result.success) {
        setUserProfile({
          email: '',
          name: '',
          phone: ''
        });
        console.log('User profile cleared');
      }
    } catch (error) {
      console.error('Error clearing user profile:', error);
    }
  };

  const onBarcodeScanned = ({ type, data }) => {
    if (!isScanning) return;
    
    setIsScanning(false);
    
    try {
      const paymentData = JSON.parse(data);
      
      // Validate payment data structure
      if (paymentData.id && paymentData.amount && paymentData.merchant) {
        setScannedData({
          ...paymentData,
          timestamp: new Date().toISOString()
        });
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
    
  const payNow = (data) => {
    popup.checkout({
      email: data.email,
      amount: data.amount,
      reference: data.reference,
      // plan: 'PLN_example123',
      // invoice_limit: 3,
      // subaccount: 'SUB_abc123',
      // split_code: 'SPL_def456',
      // split: {
      //   type: 'percentage',
      //   bearer_type: 'account',
      //   subaccounts: [
      //     { subaccount: 'ACCT_abc', share: 60 },
      //     { subaccount: 'ACCT_xyz', share: 40 }
      //   ]
      // },
      metadata: {
        custom_fields: [
          {
            display_name: 'Order ID',
            variable_name: 'order_id',
            value: 'OID1234'
          }
        ]
      },
      onSuccess: (res) => {
        console.log('Success:', res);
        setScannedData(null);
        setIsScanning(true);
        setShowPayment(false);
        setIsProcessing(false);
        // handlePaymentSuccess(res);
        navigation.navigate('index')
      },
      onCancel: () => {
        console.log('User cancelled')
        handlePaymentCancel()
        // setIsProcessing(false);
      },
      onLoad: (res) => console.log('WebView Loaded:', res),
      onError: (err) => console.log('WebView Error:', err)
    });
  };

  const processPayment = () => {
    if (!scannedData) return;
    
    setShowPayment(false);
    setIsProcessing(true)
    payNow(scannedData);
  };

  const handlePaymentSuccess = async (response) => {
    setIsProcessing(false);
    
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
          // fuelQuantity: scannedData.fuelQuantity,
          stationName: scannedData.merchant,
        };
        
        const result = await PaymentHistoryStorage.addPaymentToHistory(historyItem);
        if (result.success) {
          setPaymentHistory(result.history);
        }
        
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

  const showReceiptModal = (transaction) => {
    Alert.alert(
      'Payment Receipt',
      `Transaction ID: ${transaction.transactionId}\n` +
      `Station: ${transaction.stationName}\n` +
      `Amount: ₦${transaction.amount.toLocaleString()}\n` +
      // `Fuel: ${transaction.fuelQuantity}L of ${transaction.fuelType}\n`
      + `Date: ${new Date(transaction.completedAt).toLocaleString()}`,
      [
        { text: 'OK', onPress: () => {} }
      ]
    );
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


  const handlePaymentCancel = () => {
    setShowPayment(false);
    Alert.alert('Cancelled', 'Payment was cancelled');
    setScannedData(null);
    setIsScanning(true);
    setIsProcessing(false)
  };

  const handlePaymentError = (error) => {
    setIsProcessing(false);
    Alert.alert('Error', `Payment failed: ${error.message || 'Unknown error'}`);
    resetScanner();
  };

  // const handlePaymentCancel = () => {
  //   setShowPayment(false);
  //   setScannedData(null);
  //   setIsScanning(true);
  // };

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
          {/* {!isScanning && (
            <TouchableOpacity style={styles.retryButton} onPress={retryScanning}>
              <Text style={styles.retryButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )} */}
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
              <TouchableOpacity style={styles.cancelButton} onPress={handlePaymentCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 20,
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
    backgroundColor: '#4ade80',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#000',
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
    backgroundColor: '#000',
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