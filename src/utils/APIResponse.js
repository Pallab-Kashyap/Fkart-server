class ApiResponse {
    constructor(message = "Success", data = null) {
        this.message = message;
        this.data = data;
    }

    static success(response, message = "Success", data) {
        return response.status(200).json(
            new ApiResponse(message, data)
        );
    }

    static created(response, message = "Resource created successfully", data) {
        return response.status(201).json(
            new ApiResponse(message, data)
        );
    }
}

export default ApiResponse;