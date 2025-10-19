const asyncHandler = (func) => async (req, res, next) => {
    try {
        return await func(req, res, next);
    } catch (error) {
        console.log(error);

        return res.status(error.statusCode || 500).json({
            statusCode: error.statusCode || 500,
            status: false,
            message: error.message,
            error: error.error || "SERVER_ERROR" || [],
        });
    }
};
export { asyncHandler };

const asyncHandlerPromise = (requestHandler) => async (req, res, next) => {
    return Promise.resolve(requestHandler(req, res, next)).catch((error) =>
        next(error),
    );
};

// const asyncHandlers = (fnc) => () => {};   //higerorder function - that function to pass  argument as function and then return a function
