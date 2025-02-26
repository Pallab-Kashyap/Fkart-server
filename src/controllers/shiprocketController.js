import APIResponse from '../utils/APIResponse.js';
import ShipRocket  from '../helpers/shiprocket.class.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import APIError from '../utils/APIError.js';
import { getShiprocketToken } from '../utils/shiprocketToken.js';
import {
  Order,
  OrderItem,
  ProductVariation,
  Product,
  User,
  Shipment,
  Address,
} from '../models/index.js';
import ApiResponse from '../utils/APIResponse.js';
import ApiError from '../utils/APIError.js';

export const createShiprocketOrder = async (orderId) => {
  try {
    const order = await Order.findOne({
      where: { id: orderId },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [
            {
              model: ProductVariation,
              as: 'product_variation',
              include: [
                {
                  model: Product,
                  as: 'product',
                },
              ],
            },
          ],
        },
        {
          model: Address,
          as: 'shipping_address',
          where: { isDeleted: false }
        },
        {
          model: User,
        },
      ],
    });

    if (!order) {
      throw APIError.badRequest('Order not found');
    }

    const shipRocketOrderData = {
      order_id: order.order_id,
      order_date: order.createdAt,
      pickup_location: 'work',
      channel_id: '',
      comment: 'Order creation requested',
      billing_customer_name: order.shipping_address.name,
      billing_address: order.shipping_address.address,
      billing_address_2: order.shipping_address.address_2 || '',
      billing_city: order.shipping_address.city,
      billing_pincode: order.shipping_address.pincode,
      billing_state: order.shipping_address.state,
      billing_country: order.shipping_address.country,
      billing_email: order.User.email,
      billing_phone: order.shipping_address.phone,
      shipping_is_billing: true,
      order_items: order.OrderItems.map((item) => ({
        name: item.product_variation.product.product_name,
        sku: `${item.product_variation.id.slice(-6)}`,
        units: item.quantity,
        selling_price: item.selling_price,
        size: item.product_variation.size,
        color: item.product_variation.color,
      })),
      payment_method: order.payment_method,
      shipping_charges: order.shipping_charges || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order?.discount || 0,
      sub_total: order.total_amount,
     
      length: order.OrderItems[0]?.product_variation?.length || 10,
      breadth: order.OrderItems[0]?.product_variation?.breadth || 10,
      height: order.OrderItems[0]?.product_variation?.height || 10,
      weight: order.OrderItems[0]?.product_variation?.weight || 1,
    };

    const token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);

    let step = 0;
    let responseData = {};
    let shiprocketOrderResponse; 

    try {
      shiprocketOrderResponse = await shipRocket.requestCreateOrder(shipRocketOrderData);
      const shipmentId = shiprocketOrderResponse.shipment_id;
      const orderId = shiprocketOrderResponse.order_id;
      step++;

      // Assign AWB
      // const awbData = await shipRocket.generateAWB(shipmentId);
      step++;
      // Generate Label
      // const labelData = await shipRocket.generateLabel([shipmentId]);
      step++;
      // Generate Invoice
      // const invoiceData = await shipRocket.generateInvoice([orderId]);

      // Schedule Pickup
      // const pickupData = await shipRocket.shipmentPickUp([shipmentId]);
      step++;
      // Generate Manifest
      // const manifestData = await shipRocket.generateManifests([shipmentId]);
      step++;
      
      responseData = {
        order: shiprocketOrderResponse,
        // awb: awbData,
        // label: labelData,
        // invoice: invoiceData,
        // pickup: pickupData,
        // manifest: manifestData,
      };
    } catch (error) {
      throw APIError.internal(
        `Error processing order through Shiprocket in step.on: ${step} error: ${error.message}`
      );
    }

    try {
      await Shipment.create({
        order_id: orderId,
        shiprocket_order_id: shiprocketOrderResponse.order_id,
        shipment_id: shiprocketOrderResponse.shipment_id,
        // awb_code: awbData?.awb,
        // courier_id: awbData?.courier_company_id,
        // courier_name: awbData?.courier_name,
        status: 'awb_generated',
        freight_charge: shiprocketOrderResponse.shipping_charges,
        length: shipRocketOrderData.length,
        breadth: shipRocketOrderData.breadth,
        height: shipRocketOrderData.height,
        weight: shipRocketOrderData.weight,
        // pickup_scheduled_at: pickupData?.pickup_scheduled_date,
        // label_url: labelData?.label_url,
        // invoice_url: invoiceData?.invoice_url,
        // tracking_url: awbData?.tracking_url,
        // manifest_url: manifestData?.manifest_url,
        shipping_details: responseData,
        metadata: {
          // pickup_token: pickupData?.pickup_token,
          // manifest_token: manifestData?.manifest_token,
        },
      });
    } catch (error) {
      console.log(error);
      throw APIError.internal('Error creating shipment record in database');
    }

  } catch (error) {
    console.error(error);
    return
  }
};

export const cancelShiprocketOrder = async ( shiprocket_order_id ) => {
 try {
   
   const shipment = await Shipment.findOne({
     where: { shiprocket_order_id }
   });
 
   if (!shipment) {
     throw APIError.badRequest('Shipment not found for this order');
   }
 
   const token = await getShiprocketToken();
   const shipRocket = new ShipRocket(token);
   const cancelResponse = await shipRocket.cancelOrder([shiprocket_order_id]);
 
  
   await shipment.update({ 
     status: 'cancelled',
     cancelled_at: new Date(),
     metadata: {
       ...shipment.metadata,
       cancellation: cancelResponse
     }
   });
 
   return true;
 } catch (error) {
  throw APIError.internal(error.message || 'Error cancelling order');
 }
};

export const shiprocketReturnOrder = async (data) => {
  const { sellerDetails, customerDetails, orderDetails } = data;

  try {
    const shipment = await Shipment.findOne({
      where: { order_id: orderDetails.original_order_id },
      include: [
        {
          model: Order,
          include: [
            {
              model: OrderItem,
              as: 'orderItems',
              include: [
                {
                  model: ProductVariation,
                  as: 'product_variation',
                  include: [{ model: Product, as: 'product' }],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!shipment) {
      throw new APIError('Original shipment not found', 404);
    }

    const returnOrderData = {
      order_id: `RET-${shipment.order_id}`,
      order_date: new Date().toISOString().split('T')[0],
      channel_id: '',
      // Customer pickup details
      pickup_customer_name: customerDetails.name,
      pickup_address: customerDetails.address,
      pickup_address_2: customerDetails.address_2 || '',
      pickup_city: customerDetails.city,
      pickup_state: customerDetails.state,
      pickup_country: customerDetails.country,
      pickup_pincode: customerDetails.pincode,
      pickup_email: customerDetails.email,
      pickup_phone: customerDetails.phone,
      // Seller shipping details
      shipping_customer_name: sellerDetails.name,
      shipping_address: sellerDetails.address,
      shipping_address_2: sellerDetails.address_2 || '',
      shipping_city: sellerDetails.city,
      shipping_state: sellerDetails.state,
      shipping_country: sellerDetails.country,
      shipping_pincode: sellerDetails.pincode,
      shipping_email: sellerDetails.email,
      shipping_phone: sellerDetails.phone,
      // Order details
      order_items: orderDetails.items,
      payment_method: orderDetails.payment_method || 'PREPAID',
      total_discount: orderDetails.total_discount || '0',
      sub_total: orderDetails.sub_total,
      length: orderDetails.length || 10,
      breadth: orderDetails.breadth || 10,
      height: orderDetails.height || 10,
      weight: orderDetails.weight || 0.5
    };

    const token = await getShiprocketToken();
    const shipRocket = new ShipRocket(token);
    const returnOrder = await shipRocket.requestCreateReturnOrder(returnOrderData);


    const returnShipment = await Shipment.create({
      order_id: orderDetails.original_order_id,
      shiprocket_order_id: returnOrder.order_id,
      shipment_id: returnOrder.shipment_id,
      status: returnOrder.status,
      type: 'return',
      metadata: {
        return_details: returnOrder
      }
    });

    return {
      message: 'Return order created successfully',
      data: returnOrder,
      shipment: returnShipment
    };
  } catch (error) {
    throw new APIError.internal(error.message || 'Error creating return order');
  }
};

export const shiprocketWebhook = async (req, res) => {
  try {

    const token = req.headers['x-api-key'];

    if (!token) {
      return APIResponse.success('Recieved webhook but no Shiprocket Webhook Secret');
    }

    if(!process.env.SHIPROCKET_WEBHOOK_SECRET) {
      console.log('MISSING ENV FOR SHIPROCKET_WEBHOOK_SECRET');
      return APIResponse.success('Recieved webhook but Shiprocket Webhook Secret not set');
    }

    if(token !== process.env.SHIPROCKET_WEBHOOK_SECRET) {
      return APIResponse.success('Recieved webhook but Invalid Shiprocket Webhook Secret');
    }

    const data = req.body;
    console.log("SHIPROCKET WEBHOOK DATA");
    console.log(data);

    return ApiResponse.success(res, 'webhook processed successfully');
    
  } catch (error) {
    console.log(error);
    if(error instanceof APIError && error.statusCode === 401) {
      return ApiError.unauthorized('Invalid Shiprocket Webhook Secret');
    }
    return APIResponse.success('Recieved webhook but Error processing Shiprocket Webhook');
  }
}
