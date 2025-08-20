// promo-hub/api/check-ecomobi-status.js
// Vercel Serverless Function

import { db } from '../js/app.js';
import { doc, updateDoc } from "firebase-admin/firestore";

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).send('Method Not Allowed');
  }
  
  const { orderId } = request.body;
  const ECO_TRACKING_PRIVATE_TOKEN = process.env.ECO_TRACKING_PRIVATE_TOKEN;
  
  if (!orderId) {
    return response.status(400).json({ message: 'Order ID is required' });
  }
  
  if (!ECO_TRACKING_PRIVATE_TOKEN) {
    console.error("ECO_TRACKING_PRIVATE_TOKEN is not set.");
    return response.status(500).json({ message: 'Server configuration error: Token not found.' });
  }
  
  try {
    const apiUrl = `https://api.ecotrackings.com/api/v3/conversions?token_private=${ECO_TRACKING_PRIVATE_TOKEN}&adv_order_id=${orderId}`;
    
    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      throw new Error(`API returned status ${apiResponse.status}`);
    }
    
    const apiData = await apiResponse.json();
    
    if (apiData.data && apiData.data.length > 0) {
      const conversion = apiData.data[0];
      const newStatus = conversion.status;
      
      // Perbarui status di Firestore
      const orderRef = db.collection('orders').doc(orderId);
      await updateDoc(orderRef, { status: newStatus });
      
      response.status(200).json({
        success: true,
        newStatus: newStatus,
        message: `Status transaksi berhasil diperbarui menjadi: ${newStatus}`
      });
    } else {
      response.status(404).json({
        success: false,
        message: 'Transaksi tidak ditemukan di Ecomobi.'
      });
    }
  } catch (error) {
    console.error("Error checking Ecomobi status:", error);
    response.status(500).json({
      success: false,
      message: 'Gagal memverifikasi status transaksi.',
      error: error.message
    });
  }
}