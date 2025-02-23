import axios from 'axios';

class ShipRocket {
  constructor(token) {
    this.axiosAuthInstance = axios.create({
      baseURL: process.env.SHIPROCKET_URL,
    });

    this.axiosInstance = axios.create({
      baseURL: process.env.SHIPROCKET_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async generateShiprocketAuthToken() {
    try {
      const result = await this.axiosAuthInstance.post('auth/login', {
        email: process.env.SHIPROCKET_USER,
        password: process.env.SHIPROCKET_PASSWORD,
      });

      return result.data;
    } catch (error) {
      throw error;
    }
  }

  async requestCreateOrder(request) {
    try {
      const {
        order_id,
        order_date,
        pickup_location,
        channel_id,
        comment,
        billing_customer_name,
        billing_last_name,
        billing_address,
        billing_address_2,
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing,
        order_items,
        payment_method,
        shipping_charges,
        giftwrap_charges,
        transaction_charges,
        total_discount,
        sub_total,
        length,
        breadth,
        height,
        weight,
      } = request;

      const result = await this.axiosInstance.post('orders/create/adhoc', {
        order_id,
        order_date,
        pickup_location,
        channel_id,
        comment,
        billing_customer_name,
        billing_last_name,
        billing_address,
        billing_address_2,
        billing_city,
        billing_pincode,
        billing_state,
        billing_country,
        billing_email,
        billing_phone,
        shipping_is_billing,
        order_items,
        payment_method,
        shipping_charges,
        giftwrap_charges,
        transaction_charges,
        total_discount,
        sub_total,
        length,
        breadth,
        height,
        weight,
      });

      return result.data;
    } catch (error) {
      throw error;
    }
  }

  async requestCreateReturnOrder(request) {
    try {
      const result = await this.axiosInstance.post(
        'orders/create/return',
        request
      );
      return result.data;
    } catch (error) {
      throw error;
    }
  }

  async generateAWB(shipment_id) {
    try {
      const result = await this.axiosInstance.post('courier/assign/awb', {
        shipment_id,
        courier_id: '',
      });

      const data = result.data;
      const returnData = data.response.data;
      returnData.awb_assign_status = data.awb_assign_status;

      return returnData;
    } catch (error) {
      throw error;
    }
  }

  async generateLabel(shipment_id) {
    try {
      const result = await this.axiosInstance.post('courier/generate/label', {
        shipment_id,
      });

      const data = result.data;
      return data.label_url;
    } catch (error) {
      throw error;
    }
  }

  async generateInvoice(ids) {
    try {
      const result = await this.axiosInstance.post('orders/print/invoice', {
        ids,
      });

      const data = result.data;
      return data.invoice_url;
    } catch (error) {
      throw error;
    }
  }

  async shipmentPickUp(shipment_id) {
    try {
      const result = await this.axiosInstance.post('courier/generate/pickup', {
        shipment_id,
      });

      const data = result.data;
      const returnData = {};
      const {
        pickup_scheduled_date,
        pickup_token_number,
        status: pickUpStatus,
        pickup_generated_date,
        data: message,
      } = data.response;

      returnData.pickup_status = data.pickup_status;
      returnData.pickup_scheduled_date = pickup_scheduled_date;
      returnData.pickup_token_number = pickup_token_number;
      returnData.status = pickUpStatus;
      returnData.pickup_generated_date = pickup_generated_date;

      return returnData;
    } catch (error) {
      throw error;
    }
  }

  async generateManifests(shipment_id) {
    try {
      const result = await this.axiosInstance.post('manifests/generate', {
        shipment_id,
      });

      const data = result.data;
      return data.manifest_url;
    } catch (error) {
      throw error;
    }
  }

  async printManifests(order_ids) {
    try {
      const result = await this.axiosInstance.post('manifests/print', {
        order_ids,
      });

      const data = result.data;
      return data.manifest_url;
    } catch (error) {
      throw error;
    }
  }

  async cancelOrder(ids) {
    try {
      await this.axiosInstance.post('orders/cancel', {
        ids,
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  parseError(error) {
    try {
      const { response } = error;

      if (!response) throw new Error(error.message);

      const {
        data: { message },
      } = response;

      return message || 'Error while operating!';
    } catch (e) {
      return e.message;
    }
  }
}

export default ShipRocket;
