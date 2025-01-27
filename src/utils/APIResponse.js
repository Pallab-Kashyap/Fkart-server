
class ApiResponse {
    constructor(data = null, message = "Success") {
        // this.success = true;
        // this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    static success(response, message = "Success", data) {
        return response.status(200).json(
            new ApiResponse(200, data, message)
        );
    }

    static created(response, message = "Resource created successfully", data) {
        return response.status(201).json(
            new ApiResponse(201, data, message)
        );
    }
}

export default ApiResponse;