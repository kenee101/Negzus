import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Modal,
  Share,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Picker } from '@react-native-picker/picker';

export default function PaymentScreenMerchant() {
  const [formData, setFormData] = useState({
    merchantName: 'Total',
    amount: '',
    paymentMethod: 'card',
    description: '',
    customerEmail: '',
  });
  const [qrData, setQrData] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [generatedPayments, setGeneratedPayments] = useState([]);

  // Generate unique payment reference
  const generateReference = () => {
    return `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  };

  // Generate QR Code with payment details
  const generateQRCode = () => {
    if (!formData.merchantName || !formData.amount || !formData.customerEmail) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const paymentReference = generateReference();
    const paymentData = {
      id: paymentReference,
      merchant: formData.merchantName,
      amount: parseFloat(formData.amount),
      currency: 'NGN',
      email: formData.customerEmail,
      method: formData.paymentMethod,
      description: formData.description,
      timestamp: new Date().toISOString(),
      status: 'pending',
      // Paystack specific fields
      reference: paymentReference,
      callback_url: 'https://yourapp.com/payment-callback',
    };

    setQrData(paymentData);
    setShowQRModal(true);
    
    // Add to generated payments list
    setGeneratedPayments(prev => [paymentData, ...prev]);
  };

  // Share QR code
  const shareQRCode = async () => {
    try {
      await Share.share({
        message: `Payment Request: ${qrData.merchant}\nAmount: ₦${qrData.amount}\nReference: ${qrData.reference}`,
        title: 'Payment Request',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share payment request');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Payment Management</Text>
      
      {/* Form Section */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Generate Payment QR Code</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Merchant Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.merchantName}
            onChangeText={(text) => setFormData({...formData, merchantName: text})}
            placeholder="Enter merchant name"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (₦) *</Text>
          <TextInput
            style={styles.input}
            value={formData.amount}
            onChangeText={(text) => setFormData({...formData, amount: text})}
            placeholder="0.00"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Customer Email *</Text>
          <TextInput
            style={styles.input}
            value={formData.customerEmail}
            onChangeText={(text) => setFormData({...formData, customerEmail: text})}
            placeholder="customer@example.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.paymentMethod}
              onValueChange={(itemValue) => setFormData({...formData, paymentMethod: itemValue})}
              style={styles.picker}
            >
              <Picker.Item label="Credit/Debit Card" value="card" />
              <Picker.Item label="Bank Transfer" value="bank" />
              <Picker.Item label="USSD" value="ussd" />
              <Picker.Item label="Mobile Money" value="mobile_money" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({...formData, description: text})}
            placeholder="Payment description..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>

        <TouchableOpacity style={styles.generateButton} onPress={generateQRCode}>
          <Text style={styles.generateButtonText}>Generate QR Code</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Payments Section */}
      <View style={styles.historyContainer}>
        <Text style={styles.sectionTitle}>Recent Generated Payments</Text>
        {generatedPayments.length === 0 ? (
          <Text style={styles.emptyText}>No payments generated yet</Text>
        ) : (
          generatedPayments.slice(0, 5).map((payment) => (
            <View key={payment.id} style={styles.paymentItem}>
              <Text style={styles.paymentMerchant}>{payment.merchant}</Text>
              <Text style={styles.paymentAmount}>₦{payment.amount.toFixed(2)}</Text>
              <Text style={styles.paymentReference}>{payment.reference}</Text>
              <Text style={styles.paymentStatus}>Status: {payment.status}</Text>
            </View>
          ))
        )}
      </View>

      {/* QR Code Modal */}
      <Modal visible={showQRModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Payment QR Code</Text>
            
            {qrData && (
              <View style={styles.qrContainer}>
                <QRCode
                  value={JSON.stringify(qrData)}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
                
                <View style={styles.paymentDetails}>
                  <Text style={styles.detailText}>Merchant: {qrData.merchant}</Text>
                  <Text style={styles.detailText}>Amount: ₦{qrData.amount.toFixed(2)}</Text>
                  <Text style={styles.detailText}>Reference: {qrData.reference}</Text>
                  <Text style={styles.detailText}>Email: {qrData.email}</Text>
                </View>
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.shareButton} onPress={shareQRCode}>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
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