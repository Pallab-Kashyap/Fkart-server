import axios from "axios";
import ShiprocketAuth from "../models/shiprocketAuthModel.js"; // added import

const getShiprocketToken = async () => {

try {
    	const record = await ShiprocketAuth.findOne();
    	const now = new Date();
    	if (record && record.expires_at > now) {
    		return record.token;
    	}
    
        const url = process.env.SHIPROCKET_BASE_URL + "auth/login";
        const data = {
            email: process.env.SHIPROCKET_USER_EMAIL,
            password: process.env.SHIPROCKET_USER_PASSWORD,
        }

        if(!url || !data.email || !data.password) {
            throw new Error("ENV missing");
        }

        const response = await axios.post(url, data);

    	const newToken = response.data.token;
    
    
    	const expireDate = new Date();
    	expireDate.setDate(expireDate.getDate() + 9);
    
    
    	if (record) {
    		record.token = newToken;
    		record.expires_at = expireDate;
    		await record.save();
    	} else {
    		await ShiprocketAuth.create({
    			token: newToken,
    			expires_at: expireDate,
    		});
    	}
    
    	return newToken;
} catch (error) {
    throw error;
}
};

export {
	getShiprocketToken
}